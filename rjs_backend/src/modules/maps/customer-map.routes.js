import express from 'express';
import { z } from 'zod';

import { validate } from '../../common/middleware/validate.js';
import { authenticateCustomer } from '../customers/customer-auth.middleware.js';
import { autocompletePlaces, computeRoute, getPlace, reverseGeocode } from './maps.service.js';

const router = express.Router();
const empty = z.object({});
const coordinate = z.coerce.number().finite();

router.use(authenticateCustomer);

router.get('/autocomplete', validate(z.object({
  body: z.unknown().optional(), params: empty,
  query: z.object({ input: z.string().trim().min(3).max(150), sessionToken: z.string().uuid(), latitude: coordinate.optional(), longitude: coordinate.optional() }),
})), async (req, res, next) => {
  try { return res.json({ success: true, data: { predictions: await autocompletePlaces(req.validated.query) } }); }
  catch (error) { return next(error); }
});

router.get('/places/:placeId', validate(z.object({
  body: z.unknown().optional(), params: z.object({ placeId: z.string().min(3).max(300) }), query: z.object({ sessionToken: z.string().uuid().optional() }),
})), async (req, res, next) => {
  try { return res.json({ success: true, data: { place: await getPlace(req.validated.params.placeId, req.validated.query.sessionToken) } }); }
  catch (error) { return next(error); }
});

router.get('/reverse-geocode', validate(z.object({
  body: z.unknown().optional(), params: empty, query: z.object({ latitude: coordinate.min(-90).max(90), longitude: coordinate.min(-180).max(180) }),
})), async (req, res, next) => {
  try { return res.json({ success: true, data: { place: await reverseGeocode(req.validated.query.latitude, req.validated.query.longitude) } }); }
  catch (error) { return next(error); }
});

router.post('/route', validate(z.object({
  body: z.object({ origin: z.object({ latitude: coordinate.min(-90).max(90), longitude: coordinate.min(-180).max(180) }), destination: z.object({ latitude: coordinate.min(-90).max(90), longitude: coordinate.min(-180).max(180) }) }), params: empty, query: empty,
})), async (req, res, next) => {
  try { return res.json({ success: true, data: { route: await computeRoute(req.validated.body) } }); }
  catch (error) { return next(error); }
});

export { router as customerMapRouter };
