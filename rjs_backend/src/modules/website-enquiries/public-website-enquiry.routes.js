import express from 'express';
import { createLimiter } from '../../common/middleware/rate-limits.js';
import { validate } from '../../common/middleware/validate.js';
import { AppError } from '../../common/errors/app-error.js';
import { TourPackage } from '../tour-packages/tour-package.model.js';
import { WebsiteEnquiry } from './website-enquiry.model.js';
import { createWebsiteEnquirySchema } from './website-enquiry.schemas.js';

const router = express.Router();
const submissionLimiter = createLimiter({ windowMs: 15 * 60_000, limit: 5 });

router.post('/', submissionLimiter, validate(createWebsiteEnquirySchema), async (req, res, next) => {
  try {
    const { packageId, website, ...body } = req.validated.body;
    if (website) throw new AppError(400, 'INVALID_SUBMISSION', 'Unable to submit this enquiry');

    let tourPackage;
    if (packageId) {
      tourPackage = await TourPackage.findOne({ _id: packageId, status: 'PUBLISHED' })
        .select('title slug price durationLabel')
        .lean();
      if (!tourPackage) throw new AppError(422, 'TOUR_PACKAGE_UNAVAILABLE', 'This tour package is no longer available');
    }

    const enquiry = await WebsiteEnquiry.create({
      customer: { name: body.name, phone: body.phone, email: body.email },
      travelType: body.travelType,
      message: body.message,
      source: tourPackage ? 'TOUR_PACKAGE' : 'CONTACT',
      ...(tourPackage ? {
        packageId: tourPackage._id,
        packageSnapshot: {
          title: tourPackage.title,
          slug: tourPackage.slug,
          price: tourPackage.price,
          durationLabel: tourPackage.durationLabel,
        },
      } : {}),
    });

    return res.status(201).json({
      success: true,
      data: { enquiryNumber: enquiry.enquiryNumber, status: enquiry.status },
    });
  } catch (error) {
    return next(error);
  }
});

export { router as publicWebsiteEnquiryRouter };
