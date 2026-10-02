import { z } from 'zod';

const empty = z.object({});
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

const createWebsiteEnquirySchema = z.object({
  params: empty,
  query: empty,
  body: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{8,17}$/, 'Enter a valid mobile number'),
    email: z.string().trim().email().max(254),
    travelType: z.string().trim().min(2).max(120),
    message: z.string().trim().min(10).max(2000),
    packageId: objectId.optional(),
    website: z.string().max(0).optional(),
  }),
});

const listWebsiteEnquiriesSchema = z.object({
  body: z.unknown().optional(),
  params: empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(['NEW', 'CONTACTED', 'RESOLVED', 'CLOSED']).optional(),
    source: z.enum(['CONTACT', 'TOUR_PACKAGE']).optional(),
  }),
});

const updateWebsiteEnquirySchema = z.object({
  params: z.object({ enquiryId: objectId }),
  query: empty,
  body: z.object({
    status: z.enum(['NEW', 'CONTACTED', 'RESOLVED', 'CLOSED']).optional(),
    adminNotes: z.string().trim().max(3000).optional(),
  }).refine((value) => Object.keys(value).length > 0),
});

export { createWebsiteEnquirySchema, listWebsiteEnquiriesSchema, updateWebsiteEnquirySchema };
