import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError } from '../../common/errors/app-error.js';
import { validate } from '../../common/middleware/validate.js';
import { authenticateCustomer } from './customer-auth.middleware.js';
import { CustomerAddress } from './customer-address.model.js';
import { Customer } from './customer.model.js';

const router = express.Router();
const empty = z.object({});
const id = z.string().regex(/^[a-f\d]{24}$/i);
const fields = z.object({
  type: z.enum(['HOME', 'WORK', 'FAVORITE']),
  label: z.string().trim().max(60).optional(),
  addressLine: z.string().trim().min(5).max(300),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80).default('Bengaluru'),
  pincode: z.union([z.string().trim().regex(/^\d{6}$/), z.literal('')]).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

const createSchema = z.object({ body: fields, params: empty, query: empty });
const updateSchema = z.object({ body: fields, params: z.object({ id }), query: empty });
const idSchema = z.object({ body: empty, params: z.object({ id }), query: empty });
const favoriteLimit = 5;

async function lockFavoriteWrites(customerId, session) {
  const result = await Customer.updateOne({ _id: customerId },
    { $inc: { favoritePlacesRevision: 1 } }, { session });
  if (result.matchedCount !== 1) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer was not found');
}

async function assertFavoriteCapacity(customerId, session) {
  const count = await CustomerAddress.countDocuments({ customerId, type: 'FAVORITE' }).session(session);
  if (count >= favoriteLimit) throw new AppError(409, 'FAVORITE_LIMIT_REACHED', 'You can save up to 5 favorite places');
}

const toSafeObject = (address) => ({
  id: address.id,
  type: address.type,
  label: address.label,
  addressLine: address.addressLine,
  landmark: address.landmark,
  city: address.city,
  pincode: address.pincode,
  location: address.location,
});

router.use(authenticateCustomer);

router.get('/', async (req, res, next) => {
  try {
    const addresses = await CustomerAddress.find({ customerId: req.customer.id })
      .sort({ type: 1, updatedAt: -1 });
    return res.json({ success: true, data: { addresses: addresses.map(toSafeObject) } });
  } catch (error) {
    return next(error);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const values = { ...req.validated.body, customerId: req.customer.id };
    const address = values.type === 'FAVORITE'
      ? await mongoose.connection.transaction(async (session) => {
        await lockFavoriteWrites(req.customer.id, session);
        await assertFavoriteCapacity(req.customer.id, session);
        const [created] = await CustomerAddress.create([values], { session });
        return created;
      })
      : await CustomerAddress.findOneAndUpdate(
        { customerId: req.customer.id, type: values.type },
        { $set: values },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
    return res.status(201).json({ success: true, data: { address: toSafeObject(address) } });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const filter = { _id: req.validated.params.id, customerId: req.customer.id };
    const update = { $set: req.validated.body };
    const address = req.validated.body.type === 'FAVORITE'
      ? await mongoose.connection.transaction(async (session) => {
        await lockFavoriteWrites(req.customer.id, session);
        const existing = await CustomerAddress.findOne(filter).session(session);
        if (!existing) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Saved place not found');
        if (existing.type !== 'FAVORITE') await assertFavoriteCapacity(req.customer.id, session);
        return CustomerAddress.findOneAndUpdate(filter, update,
          { new: true, runValidators: true, session });
      })
      : await CustomerAddress.findOneAndUpdate(filter, update,
        { new: true, runValidators: true });
    if (!address) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Saved place not found');
    return res.json({ success: true, data: { address: toSafeObject(address) } });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', validate(idSchema), async (req, res, next) => {
  try {
    const address = await CustomerAddress.findOneAndDelete({
      _id: req.validated.params.id,
      customerId: req.customer.id,
    });
    if (!address) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Saved place not found');
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return next(error);
  }
});

export { router as customerAddressRouter };
