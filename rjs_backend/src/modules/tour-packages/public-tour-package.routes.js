import express from 'express';
import { z } from 'zod';
import { createLimiter } from '../../common/middleware/rate-limits.js';
import { validate } from '../../common/middleware/validate.js';
import { AppError } from '../../common/errors/app-error.js';
import { TourPackage } from './tour-package.model.js';

const router = express.Router();
const publicCatalogueLimiter = createLimiter({ windowMs: 60_000, limit: 120 });
const empty = z.object({});

const listSchema = z.object({
  body: z.unknown().optional(),
  params: empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
    search: z.string().trim().max(100).optional(),
    featured: z.enum(['true', 'false']).optional(),
  }),
});

const detailSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({
    slug: z.string().trim().min(3).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
  query: empty,
});

function publicProjection() {
  return '-createdBy -updatedBy -__v -status';
}

router.use(publicCatalogueLimiter);

router.get('/', validate(listSchema), async (req, res, next) => {
  try {
    const { page, limit, search, featured } = req.validated.query;
    const filter = { status: 'PUBLISHED' };
    if (featured !== undefined) filter.featured = featured === 'true';
    if (search) {
      const value = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: value, $options: 'i' } },
        { originCity: { $regex: value, $options: 'i' } },
        { shortDescription: { $regex: value, $options: 'i' } },
        { 'places.name': { $regex: value, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      TourPackage.find(filter)
        .select(publicProjection())
        .sort({ featured: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TourPackage.countDocuments(filter),
    ]);
    return res.json({
      success: true,
      data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:slug', validate(detailSchema), async (req, res, next) => {
  try {
    const item = await TourPackage.findOne({ slug: req.validated.params.slug, status: 'PUBLISHED' })
      .select(publicProjection())
      .lean();
    if (!item) throw new AppError(404, 'TOUR_PACKAGE_NOT_FOUND', 'Tour package was not found');
    return res.json({ success: true, data: { package: item } });
  } catch (error) {
    return next(error);
  }
});

export { router as publicTourPackageRouter };
