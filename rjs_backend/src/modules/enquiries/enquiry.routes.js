import express from "express";
import { validate } from "../../common/middleware/validate.js";
import { AppError } from "../../common/errors/app-error.js";
import {
    authenticateAdmin,
    requireEmployee,
} from "../admins/admin-auth.middleware.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { Booking } from "../bookings/booking.model.js";
import { VehicleCategory, VehicleVariant } from "../vehicles/vehicle.model.js";
import { Enquiry } from "./enquiry.model.js";
import {
    createEnquirySchema,
    enquiryActionSchema,
    listEnquiriesSchema,
    statusSchema,
    updateEnquirySchema,
} from "./enquiry.schemas.js";

const enquiryRouter = express.Router();

enquiryRouter.use(authenticateAdmin, requireEmployee);

async function vehicles(body, activeOnly = true) {
  const categoryFilter = { _id: body.categoryId };
  const variantFilter = { _id: body.variantId, categoryId: body.categoryId };

  if (activeOnly) {
    categoryFilter.isActive = true;
    variantFilter.isActive = true;
  }

  const [category, variant] = await Promise.all([
    VehicleCategory.findOne(categoryFilter),
    VehicleVariant.findOne(variantFilter),
  ]);

  if (!category || !variant)
    throw new AppError( 422, "VEHICLE_UNAVAILABLE", "Choose a valid active vehicle category and variant", );

  return { category, variant };
}
enquiryRouter.get("/", validate(listEnquiriesSchema), async (req, res, next) => {
    try {
        const { page, limit, search, status } = req.validated.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) {
            const value = search.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
            filter.$or = [
                { enquiryNumber: { $regex: value, $options: "i" } },
                { "customer.name": { $regex: value, $options: "i" } },
                { "customer.phone": { $regex: value, $options: "i" } },
                { "locations.address": { $regex: value, $options: "i" } },
            ];
        }
        const [items, total] = await Promise.all([
            Enquiry.find(filter)
            .populate("categoryId", "name code photoUrl")
            .populate("variantId", "name code photoUrl")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
            Enquiry.countDocuments(filter),
        ]);
        return res.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.max(1, Math.ceil(total / limit)),
                },
            },
        });
    } catch (error) {
        return next(error);
    }
});

enquiryRouter.post("/", validate(createEnquirySchema), async (req, res, next) => {
    try {
        await vehicles(req.validated.body);
        const enquiry = await Enquiry.create({
            ...req.validated.body,
            createdBy: req.admin.id,
        });
        await writeAuditLog({
            req,
            action: "enquiry.create",
            actor: req.admin,
            targetType: "Enquiry",
            targetId: enquiry.id,
            metadata: { enquiryNumber: enquiry.enquiryNumber },
        });
        return res.status(201).json({ success: true, data: { enquiry } });
    } catch (error) {
        return next(error);
    }
});

enquiryRouter.get("/:enquiryId", validate(enquiryActionSchema), async (req, res, next) => {
    try {
        const enquiry = await Enquiry.findById(req.validated.params.enquiryId)
            .populate("categoryId", "name code photoUrl isActive")
            .populate("variantId", "name code photoUrl isActive")
            .populate("bookingId", "bookingNumber status")
            .lean();
        if (!enquiry)
            throw new AppError(404, "ENQUIRY_NOT_FOUND", "Enquiry not found");
        return res.json({ success: true, data: { enquiry } });
    } catch (error) {
        return next(error);
    }
});

enquiryRouter.put("/:enquiryId", validate(updateEnquirySchema), async (req, res, next) => {
    try {
        await vehicles(req.validated.body);
        const enquiry = await Enquiry.findOneAndUpdate(
            { _id: req.validated.params.enquiryId, bookingId: { $exists: false } },
            { $set: { ...req.validated.body, status: "QUOTED" } },
            { new: true, runValidators: true },
        );
        if (!enquiry)
            throw new AppError( 409, "ENQUIRY_NOT_EDITABLE", "Converted enquiries cannot be edited", );
        await writeAuditLog({
            req,
            action: "enquiry.update",
            actor: req.admin,
            targetType: "Enquiry",
            targetId: enquiry.id,
        });
        return res.json({ success: true, data: { enquiry } });
    } catch (error) {
        return next(error);
    }
});

enquiryRouter.patch("/:enquiryId/status", validate(statusSchema), async (req, res, next) => {
    try {
        const enquiry = await Enquiry.findOneAndUpdate(
            { _id: req.validated.params.enquiryId, bookingId: { $exists: false } },
            { status: req.validated.body.status },
            { new: true },
        );
        if (!enquiry)
            throw new AppError( 409, "ENQUIRY_NOT_EDITABLE", "Converted enquiry status cannot be changed", );
        await writeAuditLog({
            req,
            action: "enquiry.status",
            actor: req.admin,
            targetType: "Enquiry",
            targetId: enquiry.id,
            metadata: req.validated.body,
        });
        return res.json({ success: true, data: { enquiry } });
    } catch (error) {
        return next(error);
    }
});

enquiryRouter.post("/:enquiryId/convert", validate(enquiryActionSchema), async (req, res, next) => {
    try {
        const enquiry = await Enquiry.findById(req.validated.params.enquiryId);

        if (!enquiry)
            throw new AppError(404, "ENQUIRY_NOT_FOUND", "Enquiry not found");

        if (enquiry.bookingId) {
            const booking = await Booking.findById(enquiry.bookingId);
            return res.json({ success: true, data: { booking, enquiry } });
        }

        if (enquiry.status !== "CONFIRMED")
            throw new AppError( 409, "ENQUIRY_NOT_CONFIRMED", "Confirm the enquiry before converting it", );

        const { category, variant } = await vehicles(enquiry, false);
        const ordered = [...enquiry.locations].sort((a, b) => a.order - b.order);
        const start = new Date(enquiry.startDate),
            end = new Date(
                start.getTime() + enquiry.numberOfDays * 24 * 60 * 60 * 1000,
            );
        const booking = await Booking.createWithUniqueNumber({
            customer: enquiry.customer,
            serviceType: "CUSTOM_TRIP",
            timing: "SCHEDULED",
            pickup: { address: ordered[0].address },
            destination: { address: ordered.at(-1).address },
            waypoints: ordered
            .slice(1, -1)
            .map((x) => ({ address: x.address, order: x.order })),
            durationMinutes: enquiry.numberOfDays * 1440,
            estimatedDistanceKm: enquiry.estimatedDistanceKm,
            passengerCount: enquiry.passengerCount,
            requestedVehicleType: category.code,
            requestedVehicleVariant: variant.code,
            vehicleCategoryId: category.id,
            vehicleVariantId: variant.id,
            scheduledStartAt: start,
            scheduledEndAt: end,
            assignmentMode: "MANUAL",
            status: "NEW",
            paymentStatus: "PENDING",
            totalAmount: enquiry.estimatedPrice,
            internalNotes: [
                {
                    text: "Created from custom enquiry " + enquiry.enquiryNumber,
                    authorId: req.admin.id,
                    authorName: req.admin.name,
                },
            ],
        });
        enquiry.bookingId = booking.id;
        await enquiry.save();
        await writeAuditLog({
            req,
            action: "enquiry.convert",
            actor: req.admin,
            targetType: "Booking",
            targetId: booking.id,
            metadata: {
                enquiryId: enquiry.id,
                bookingNumber: booking.bookingNumber,
            },
        });
        return res
            .status(201)
            .json({ success: true, data: { booking, enquiry } });
    } catch (error) {
        return next(error);
    }
});

export { enquiryRouter };
