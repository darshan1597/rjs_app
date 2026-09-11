import { z } from 'zod';

const empty = z.object({});
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const fileName = z.string().trim().max(255).optional().default('');
const driverFileUrl = z.string().trim().startsWith('/api/v1/media/driver-files/');
const requiredText = z.string().trim().min(2).max(200);
const date = z.coerce.date();

const createDriverSchema = z.object({
  body: z.object({
    phoneVerificationToken: z.string().min(20),
    serviceAssignment: z.enum(['LOCAL', 'OUTSTATION', 'FLEXIBLE']),
    personal: z.object({
      fullName: requiredText, phone: z.string().trim().min(10).max(16), dateOfBirth: date,
      gender: z.enum(['MALE', 'FEMALE', 'OTHER']), email: z.union([z.string().email(), z.literal('')]).optional(),
      residentialAddress: z.string().trim().min(5).max(500), emergencyContact: z.string().trim().min(10).max(16), profilePhoto: driverFileUrl,
    }),
    licence: z.object({
      number: z.string().trim().min(5).max(30), issueDate: date, expiryDate: date, issuingState: requiredText,
      frontFileName: fileName, backFileName: fileName, frontUrl: driverFileUrl, backUrl: driverFileUrl,
    }).refine((value) => value.expiryDate > value.issueDate, { message: 'Licence expiry must be after issue date', path: ['expiryDate'] }),
    vehicle: z.object({
      categoryId: objectId, variantId: objectId, registrationNumber: z.string().trim().min(5).max(20),
      manufacturer: requiredText, model: requiredText, fuelType: requiredText, color: requiredText,
      ownershipType: z.enum(['RJS_OWNED', 'DRIVER_OWNED', 'THIRD_PARTY']),
      seatingCapacity: z.coerce.number().int().min(1).max(100), manufacturingYear: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
      frontPhoto: driverFileUrl, rearPhoto: driverFileUrl,
    }),
    documents: z.array(z.object({ name: requiredText, fileName, url: driverFileUrl })).min(5),
    bank: z.object({
      accountHolderName: requiredText, accountNumber: z.string().trim().min(6).max(30),
      ifscCode: z.string().trim().min(8).max(15), upiId: z.string().trim().max(100).optional().default(''), proofFileName: fileName, proofUrl: driverFileUrl,
    }),
    consentAccepted: z.literal(true),
  }), params: empty, query: empty,
});

const listDriversSchema = z.object({
  body: z.unknown().optional(), params: empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(), status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
    vehicleType: objectId.optional(),
  }),
});

const updateDriverStatusSchema = z.object({
  body: z.object({ status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']) }),
  params: z.object({ driverId: objectId }), query: empty,
});
const driverDetailsSchema = z.object({ body: z.unknown().optional(), params: z.object({ driverId: objectId }), query: empty });

const phoneVerificationRequestSchema = z.object({
  body: z.object({ phone: z.string().trim().regex(/^(?:\+91|91)?[6-9]\d{9}$/) }), params: empty, query: empty,
});
const phoneVerificationConfirmSchema = z.object({
  body: z.object({
    phone: z.string().trim().regex(/^(?:\+91|91)?[6-9]\d{9}$/),
    otp: z.string().trim().regex(/^\d{6}$/),
  }), params: empty, query: empty,
});

export { createDriverSchema, driverDetailsSchema, listDriversSchema, phoneVerificationConfirmSchema, phoneVerificationRequestSchema, updateDriverStatusSchema };
