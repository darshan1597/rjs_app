import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { AppError } from '../../common/errors/app-error.js';
import { authenticateAdmin, requireEmployee } from '../admins/admin-auth.middleware.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { WebsiteEnquiry } from './website-enquiry.model.js';
import { listWebsiteEnquiriesSchema, updateWebsiteEnquirySchema } from './website-enquiry.schemas.js';

const router = express.Router();
router.use(authenticateAdmin, requireEmployee);

router.get('/', validate(listWebsiteEnquiriesSchema), async (req, res, next) => {
  try {
    const { page, limit, search, status, source } = req.validated.query;
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (search) {
      const value = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { enquiryNumber: { $regex: value, $options: 'i' } },
        { 'customer.name': { $regex: value, $options: 'i' } },
        { 'customer.phone': { $regex: value, $options: 'i' } },
        { 'customer.email': { $regex: value, $options: 'i' } },
        { 'packageSnapshot.title': { $regex: value, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      WebsiteEnquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      WebsiteEnquiry.countDocuments(filter),
    ]);
    return res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } } });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:enquiryId', validate(updateWebsiteEnquirySchema), async (req, res, next) => {
  try {
    const enquiry = await WebsiteEnquiry.findByIdAndUpdate(req.validated.params.enquiryId, {
      $set: {
        ...req.validated.body,
        reviewedBy: req.admin.id,
        reviewedAt: new Date(),
      },
    }, { new: true, runValidators: true }).lean();
    if (!enquiry) throw new AppError(404, 'WEBSITE_ENQUIRY_NOT_FOUND', 'Website enquiry not found');
    await writeAuditLog({
      req,
      action: 'website-enquiry.update',
      actor: req.admin,
      targetType: 'WebsiteEnquiry',
      targetId: enquiry._id,
      metadata: req.validated.body,
    });
    return res.json({ success: true, data: { enquiry } });
  } catch (error) {
    return next(error);
  }
});

export { router as adminWebsiteEnquiryRouter };
