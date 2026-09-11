import { z } from 'zod';
const empty = z.object({});
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const photoUrl = z.string().trim().startsWith('/api/v1/media/vehicle-images/');
const entityBody = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  photoUrl,
  isActive: z.boolean().optional(),
});
const paging = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(12), search: z.string().trim().max(100).optional() });
const createCategorySchema = z.object({ body: entityBody, params: empty, query: empty });
const listCategoriesSchema = z.object({ body: z.unknown().optional(), params: empty, query: paging });
const categoryParamsSchema = z.object({ body: z.unknown().optional(), params: z.object({ categoryId: objectId }), query: empty });
const updateCategoryStatusSchema = z.object({ body: z.object({ isActive: z.boolean() }), params: z.object({ categoryId: objectId }), query: empty });
const createVariantSchema = z.object({
  body: entityBody.extend({ onRoadPrice: z.coerce.number().positive().max(100000000) }),
  params: z.object({ categoryId: objectId }),
  query: empty,
});
const listVariantsSchema = z.object({ body: z.unknown().optional(), params: z.object({ categoryId: objectId }), query: paging });
const updateVariantStatusSchema = z.object({ body: z.object({ isActive: z.boolean() }), params: z.object({ categoryId: objectId, variantId: objectId }), query: empty });
const updateVariantPriceSchema = z.object({
  body: z.object({ onRoadPrice: z.coerce.number().positive().max(100000000) }),
  params: z.object({ categoryId: objectId, variantId: objectId }),
  query: empty,
});
export { categoryParamsSchema, createCategorySchema, createVariantSchema, listCategoriesSchema, listVariantsSchema, updateCategoryStatusSchema, updateVariantPriceSchema, updateVariantStatusSchema };
