import { z } from "zod";
const empty = z.object({});
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const text = z.string().trim().min(2).max(5000);

const packageBody = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  badge: z.string().trim().min(2).max(50),
  shortDescription: z.string().trim().min(5).max(300),
  heroSubtitle: z.string().trim().min(5).max(200),
  about: text,
  originCity: z.string().trim().min(2).max(100),
  durationLabel: z.string().trim().min(2).max(60),
  durationMinutes: z.coerce.number().int().min(60),
  distanceKm: z.coerce.number().positive(),
  price: z.coerce.number().min(0),
  coverImageUrl: z.string().trim().max(1000).optional().default(""),
  gallery: z.array(z.string().trim().max(1000)).max(12).optional().default([]),
  idealFor: z.string().trim().min(2).max(80),
  driverLabel: z.string().trim().min(2).max(80),
  vehicleLabel: z.string().trim().min(2).max(100),
  vehicleDescription: z.string().trim().min(2).max(200),
  vehicleTraits: z.array(z.string().trim().min(1).max(80)).min(1),
  vehicleTypes: z.array(z.enum(["CAR", "TEMPO_TRAVELLER", "BUS"])).min(1),
  inclusions: z.array(z.string().trim().min(2).max(100)).min(1),
  inclusionDetails: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(100),
        subtitle: z.string().trim().min(1).max(100),
      }),
    )
    .min(1),
  places: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        time: z.string().trim().min(2).max(60),
        description: z.string().trim().min(5).max(500),
        imageUrl: z.string().trim().max(1000).optional().default(""),
      }),
    )
    .min(1),
  itineraryNote: z.string().trim().min(3).max(300),
  notes: z.array(z.string().trim().min(3).max(500)).min(1),
  safetyTitle: z.string().trim().min(2).max(80),
  safetyMessage: z.string().trim().min(3).max(200),
  priceNote: z.string().trim().min(2).max(100),
  freeCancellationHours: z.coerce.number().int().min(0).max(720),
  featured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

const listTourPackagesSchema = z.object({
  body: z.unknown().optional(),
  params: empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  }),
});

const tourPackageParamsSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ packageId: objectId }),
  query: empty,
});

const createTourPackageSchema = z.object({
  body: packageBody,
  params: empty,
  query: empty,
});

const updateTourPackageSchema = z.object({
  body: packageBody.partial().refine((value) => Object.keys(value).length > 0),
  params: z.object({ packageId: objectId }),
  query: empty,
});

export {
  createTourPackageSchema,
  listTourPackagesSchema,
  tourPackageParamsSchema,
  updateTourPackageSchema,
};
