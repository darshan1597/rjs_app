import { AppError } from "../../common/errors/app-error.js";
import { TourPackage } from "./tour-package.model.js";
async function listTourPackages({ page, limit, search, status }) {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
        const value = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { title: { $regex: value, $options: "i" } },
            { originCity: { $regex: value, $options: "i" } },
            { shortDescription: { $regex: value, $options: "i" } },
        ];
    }
    const [items, total] = await Promise.all([
        TourPackage.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
        TourPackage.countDocuments(filter),
    ]);
    return {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
async function getTourPackage(id) {
    const item = await TourPackage.findById(id).lean();
    if (!item)
        throw new AppError(
            404,
            "TOUR_PACKAGE_NOT_FOUND",
            "Tour package was not found",
        );
    return item;
}
async function createTourPackage(data, adminId) {
  if (await TourPackage.exists({ slug: data.slug }))
    throw new AppError(
        409,
        "SLUG_IN_USE",
        "A tour package already uses this slug",
    );
  return TourPackage.create({
    ...data,
    createdBy: adminId,
    updatedBy: adminId,
  });
}
async function updateTourPackage(id, data, adminId) {
    if (
        data.slug &&
        (await TourPackage.exists({ slug: data.slug, _id: { $ne: id } }))
    )
        throw new AppError(
            409,
            "SLUG_IN_USE",
            "A tour package already uses this slug",
        );
    const item = await TourPackage.findByIdAndUpdate(
        id,
        { ...data, updatedBy: adminId },
        { new: true, runValidators: true },
    );
    if (!item)
        throw new AppError(
            404,
            "TOUR_PACKAGE_NOT_FOUND",
            "Tour package was not found",
        );
    return item;
}
export {
    createTourPackage,
    getTourPackage,
    listTourPackages,
    updateTourPackage,
};
