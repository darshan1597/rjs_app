import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';

vi.mock('mongoose', () => ({
  default: { connection: { transaction: vi.fn() } },
}));
vi.mock('../src/modules/customers/customer-auth.middleware.js', () => ({
  authenticateCustomer: (req, _res, next) => { req.customer = { id: 'a'.repeat(24) }; next(); },
}));
vi.mock('../src/modules/customers/customer.model.js', () => ({
  Customer: { updateOne: vi.fn() },
}));
vi.mock('../src/modules/customers/customer-address.model.js', () => ({
  CustomerAddress: {
    countDocuments: vi.fn(), create: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn(),
  },
}));

import mongoose from 'mongoose';
import { Customer } from '../src/modules/customers/customer.model.js';
import { CustomerAddress } from '../src/modules/customers/customer-address.model.js';
import { customerAddressRouter } from '../src/modules/customers/customer-address.routes.js';
import { errorHandler } from '../src/common/middleware/error-handler.js';

const app = express();
app.use(express.json());
app.use('/addresses', customerAddressRouter);
app.use(errorHandler);
const body = { type: 'FAVORITE', label: 'Gym', addressLine: '12 Main Street', city: 'Bengaluru' };
const id = 'b'.repeat(24);

beforeEach(() => {
  vi.resetAllMocks();
  mongoose.connection.transaction.mockImplementation((work) => work('session'));
  Customer.updateOne.mockResolvedValue({ matchedCount: 1 });
  CustomerAddress.countDocuments.mockReturnValue({ session: vi.fn().mockResolvedValue(0) });
  CustomerAddress.create.mockImplementation(async ([values]) => [{ id, ...values }]);
  CustomerAddress.findOne.mockReturnValue({ session: vi.fn().mockResolvedValue({ id, type: 'HOME' }) });
  CustomerAddress.findOneAndUpdate.mockResolvedValue({ id, ...body });
});

it('allows a fifth favorite and creates it inside the transaction', async () => {
  CustomerAddress.countDocuments.mockReturnValue({ session: vi.fn().mockResolvedValue(4) });
  const response = await request(app).post('/addresses').send(body);
  expect(response.status).toBe(201);
  expect(response.body.data.address.type).toBe('FAVORITE');
  expect(CustomerAddress.create).toHaveBeenCalledWith([expect.objectContaining(body)], { session: 'session' });
  expect(Customer.updateOne).toHaveBeenCalledWith({ _id: 'a'.repeat(24) },
    { $inc: { favoritePlacesRevision: 1 } }, { session: 'session' });
});

it('rejects a sixth favorite without creating an address', async () => {
  CustomerAddress.countDocuments.mockReturnValue({ session: vi.fn().mockResolvedValue(5) });
  const response = await request(app).post('/addresses').send(body);
  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('FAVORITE_LIMIT_REACHED');
  expect(CustomerAddress.create).not.toHaveBeenCalled();
});

it('still allows editing one of five existing favorites', async () => {
  CustomerAddress.findOne.mockReturnValue({ session: vi.fn().mockResolvedValue({ id, type: 'FAVORITE' }) });
  CustomerAddress.findOneAndUpdate.mockResolvedValue({ id, ...body });
  const response = await request(app).patch(`/addresses/${id}`).send(body);
  expect(response.status).toBe(200);
  expect(CustomerAddress.countDocuments).not.toHaveBeenCalled();
});

it('rejects converting Home into a sixth favorite', async () => {
  CustomerAddress.countDocuments.mockReturnValue({ session: vi.fn().mockResolvedValue(5) });
  const response = await request(app).patch(`/addresses/${id}`).send(body);
  expect(response.status).toBe(409);
  expect(CustomerAddress.findOneAndUpdate).not.toHaveBeenCalled();
});
