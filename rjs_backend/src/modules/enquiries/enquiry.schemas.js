import { z } from "zod";
const empty = z.object({});
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const body = z.object({
    customer: z.object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(10).max(16),
        email: z.string().trim().email().optional().or(z.literal("")),
    }),
    locations: z
        .array(
            z.object({
                address: z.string().trim().min(2).max(300),
                order: z.number().int().nonnegative(),
            }),
        )
        .min(2)
        .max(20),
    startDate: z.coerce.date(),
    numberOfDays: z.coerce.number().int().min(1).max(365),
    passengerCount: z.coerce.number().int().min(1).max(100),
    categoryId: objectId,
    variantId: objectId,
    estimatedDistanceKm: z.coerce.number().min(0).optional(),
    pricing: z.object({
        ratePerKm: z.coerce.number().min(0),
        dailyCharge: z.coerce.number().min(0),
        extraCharges: z.coerce.number().min(0),
    }),
    estimatedPrice: z.coerce.number().min(0),
    notes: z.string().trim().max(2000).optional(),
});
const createEnquirySchema = z.object({ params: empty, query: empty, body });
const listEnquiriesSchema = z.object({
    body: z.unknown().optional(),
    params: empty,
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        search: z.string().trim().max(100).optional(),
        status: z.enum(["DRAFT", "QUOTED", "CONFIRMED", "CANCELLED"]).optional(),
    }),
});
const params = z.object({ enquiryId: objectId });
const enquiryActionSchema = z.object({
    body: z.unknown().optional(),
    params,
    query: empty,
});
const updateEnquirySchema = z.object({ body, params, query: empty });
const statusSchema = z.object({
    body: z.object({ status: z.enum(["QUOTED", "CONFIRMED", "CANCELLED"]) }),
    params,
    query: empty,
});
export {
    createEnquirySchema,
    enquiryActionSchema,
    listEnquiriesSchema,
    statusSchema,
    updateEnquirySchema,
};
