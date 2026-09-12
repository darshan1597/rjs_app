import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { authenticateAdmin, requireEmployee } from '../admins/admin-auth.middleware.js';
import * as controller from './vehicle.controller.js';
import * as schemas from './vehicle.schemas.js';

const vehicleRouter = express.Router();

vehicleRouter.use(authenticateAdmin, requireEmployee);
vehicleRouter.get('/categories', validate(schemas.listCategoriesSchema), controller.listCategories);
vehicleRouter.post('/categories', validate(schemas.createCategorySchema), controller.createCategory);
vehicleRouter.get('/categories/:categoryId', validate(schemas.categoryParamsSchema), controller.getCategory);
vehicleRouter.patch('/categories/:categoryId/status', validate(schemas.updateCategoryStatusSchema), controller.setCategoryStatus);
vehicleRouter.get('/categories/:categoryId/variants', validate(schemas.listVariantsSchema), controller.listVariants);
vehicleRouter.post('/categories/:categoryId/variants', validate(schemas.createVariantSchema), controller.createVariant);
vehicleRouter.patch('/categories/:categoryId/variants/:variantId/status', validate(schemas.updateVariantStatusSchema), controller.setVariantStatus);
vehicleRouter.patch('/categories/:categoryId/variants/:variantId/price', validate(schemas.updateVariantPriceSchema), controller.setVariantPrice);

export { vehicleRouter };
