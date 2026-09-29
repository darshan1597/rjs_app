import express from 'express';
import { z } from 'zod';

import { validate } from '../../common/middleware/validate.js';
import { optionalAuthenticateCustomer } from '../customers/customer-auth.middleware.js';
import { createLimiter } from '../../common/middleware/rate-limits.js';
import { autocompletePlaces, computeRoute, getPlace, reverseGeocode } from './maps.service.js';

const router = express.Router();
const empty = z.object({});
const coordinate = z.coerce.number().finite();

const guestLocationLimiter = createLimiter({ windowMs: 60000, limit: 30 });
const guestRouteLimiter = createLimiter({ windowMs: 60000, limit: 20 });
const guestsOnly = (limiter) => (req, res, next) => req.customer ? next() : limiter(req, res, next);

router.use(optionalAuthenticateCustomer);

router.get('/autocomplete', guestsOnly(guestLocationLimiter), validate(z.object({
  body: z.unknown().optional(), 
  params: empty,
  query: z.object({ 
    input: z.string().trim().min(3).max(150), 
    sessionToken: z.string().uuid(), 
    latitude: coordinate.optional(), 
    longitude: coordinate.optional() 
  }),
})), async (req, res, next) => {
  try { 
    return res.json({ 
      success: true, 
      data: { predictions: await autocompletePlaces(req.validated.query) } 
    }); 
  }
  catch (error) { return next(error); }
});

router.get('/places/:placeId', guestsOnly(guestLocationLimiter), validate(z.object({
  body: z.unknown().optional(),
  params: z.object({ 
    placeId: z.string().min(3).max(300) 
  }), 
  query: z.object({ sessionToken: z.string().uuid().optional() }),
})), async (req, res, next) => {
  try { 
    return res.json({ success: true, data: { place: await getPlace(req.validated.params.placeId, req.validated.query.sessionToken)}}); 
  }
  catch (error) { 
    return next(error); 
  }
});

router.get('/reverse-geocode', guestsOnly(guestLocationLimiter), validate(z.object({
  body: z.unknown().optional(), 
  params: empty, 
  query: z.object({ 
    latitude: coordinate.min(-90).max(90), 
    longitude: coordinate.min(-180).max(180) 
  }),
})), async (req, res, next) => {
  try { 
    return res.json({ success: true, data: { place: await reverseGeocode(req.validated.query.latitude, req.validated.query.longitude) }}); 
  }
  catch (error) { 
    return next(error); 
  }
});

router.post('/route', guestsOnly(guestRouteLimiter), validate(z.object({
  body: z.object({ 
    origin: z.object({ 
      latitude: coordinate.min(-90).max(90), 
      longitude: coordinate.min(-180).max(180) 
    }), 
    destination: z.object({ 
      latitude: coordinate.min(-90).max(90), 
      longitude: coordinate.min(-180).max(180) 
    }) 
  }), 
  params: empty, query: empty,
})), async (req, res, next) => {
  try { 
    return res.json({ success: true, data: { route: await computeRoute(req.validated.body) }}); 
  }
  catch (error) { 
    return next(error); 
  }
});

export { router as customerMapRouter };
