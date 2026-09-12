import { AppError } from "../../common/errors/app-error.js";
import { VehicleCategory, VehicleVariant } from "./vehicle.model.js";
const escapeRegex = (value) => value.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");

async function ensureCategory(categoryId) {
  const category = await VehicleCategory.findById(categoryId);
  if (!category)
    throw new AppError(
      404,
      "VEHICLE_CATEGORY_NOT_FOUND",
      "Vehicle category not found",
    );
  return category;
}

async function createCategory(payload, adminId) {
  const duplicate = await VehicleCategory.exists({
    $or: [
      {
        name: { $regex: "^" + escapeRegex(payload.name) + "$", $options: "i" },
      },
      { code: payload.code.toUpperCase() },
    ],
  });
  if (duplicate)
    throw new AppError(
      409,
      "VEHICLE_CATEGORY_EXISTS",
      "A category with this name or code already exists",
    );
  return VehicleCategory.create({
    ...payload,
    code: payload.code.toUpperCase(),
    createdBy: adminId,
  });
}

async function listCategories({ page, limit, search }) {
  const filter = search
    ? {
        $or: [
          { name: { $regex: escapeRegex(search), $options: "i" } },
          { code: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    VehicleCategory.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "vehiclevariants",
          localField: "_id",
          foreignField: "categoryId",
          as: "variants",
        },
      },
      { $addFields: { variantCount: { $size: "$variants" } } },
      { $project: { variants: 0 } },
    ]),
    VehicleCategory.countDocuments(filter),
  ]);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function getCategory(categoryId) {
  return ensureCategory(categoryId);
}

async function setCategoryStatus(categoryId, isActive) {
  await ensureCategory(categoryId);
  return VehicleCategory.findByIdAndUpdate(
    categoryId,
    { isActive },
    { new: true },
  );
}

async function createVariant(categoryId, payload, adminId) {
  await ensureCategory(categoryId);
  const duplicate = await VehicleVariant.exists({
    categoryId,
    $or: [
      {
        name: { $regex: "^" + escapeRegex(payload.name) + "$", $options: "i" },
      },
      { code: payload.code.toUpperCase() },
    ],
  });
  if (duplicate)
    throw new AppError(
      409,
      "VEHICLE_VARIANT_EXISTS",
      "This category already has a variant with that name or code",
    );
  return VehicleVariant.create({
    ...payload,
    code: payload.code.toUpperCase(),
    categoryId,
    createdBy: adminId,
  });
}

async function listVariants(categoryId, { page, limit, search }) {
  const category = await ensureCategory(categoryId);
  const filter = {
    categoryId,
    ...(search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: "i" } },
            { code: { $regex: escapeRegex(search), $options: "i" } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    VehicleVariant.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    VehicleVariant.countDocuments(filter),
  ]);
  return {
    category,
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function setVariantStatus(categoryId, variantId, isActive) {
  await ensureCategory(categoryId);
  const variant = await VehicleVariant.findOneAndUpdate(
    { _id: variantId, categoryId },
    { isActive },
    { new: true },
  );
  if (!variant)
    throw new AppError(
      404,
      "VEHICLE_VARIANT_NOT_FOUND",
      "Vehicle variant not found",
    );
  return variant;
}

async function setVariantPrice(categoryId, variantId, onRoadPrice) {
  await ensureCategory(categoryId);
  const variant = await VehicleVariant.findOneAndUpdate(
    { _id: variantId, categoryId },
    { onRoadPrice },
    { new: true, runValidators: true },
  );
  if (!variant)
    throw new AppError(
      404,
      "VEHICLE_VARIANT_NOT_FOUND",
      "Vehicle variant not found",
    );
  return variant;
}

export {
  createCategory,
  createVariant,
  getCategory,
  listCategories,
  listVariants,
  setCategoryStatus,
  setVariantPrice,
  setVariantStatus,
};
