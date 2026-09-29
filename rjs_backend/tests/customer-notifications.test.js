import express from 'express';
import request from 'supertest';
import { beforeEach, expect, it, vi } from 'vitest';

const customer = {
  _id: 'customer',
  notificationsReadAt: null,
  save: vi.fn(),
};

vi.mock('../src/modules/customers/customer-auth.middleware.js', () => ({
  authenticateCustomer: (req, res, next) => {
    req.customer = customer;
    next();
  },
}));
vi.mock('../src/modules/bookings/booking.model.js', () => ({
  Booking: { find: vi.fn() },
}));
vi.mock('../src/modules/customers/customer.model.js', () => ({
  CustomerSession: { updateMany: vi.fn(), updateOne: vi.fn() },
}));
vi.mock('../src/modules/customers/customer-reminder.model.js', () => ({
  CustomerReminder: { find: vi.fn() },
}));

import { Booking } from '../src/modules/bookings/booking.model.js';
import { CustomerSession } from '../src/modules/customers/customer.model.js';
import { CustomerReminder } from '../src/modules/customers/customer-reminder.model.js';
import { customerNotificationRouter } from '../src/modules/customers/customer-notification.routes.js';

const app = express();
app.use(express.json());
app.use('/notifications', customerNotificationRouter);

beforeEach(() => {
  vi.clearAllMocks();
  customer.notificationsReadAt = null;
  customer.save.mockResolvedValue(customer);
  CustomerReminder.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) });
});

it('builds the customer inbox from real booking status history', async () => {
  const changedAt = new Date();
  Booking.find.mockReturnValue({
    select: () => ({
      sort: () => ({
        limit: () => ({
          lean: async () => [{
            _id: 'booking',
            bookingNumber: 'RJS12345678',
            createdAt: changedAt,
            statusHistory: [{ _id: 'event', status: 'DRIVER_EN_ROUTE', changedAt }],
          }],
        }),
      }),
    }),
  });
  const response = await request(app).get('/notifications');
  expect(response.status).toBe(200);
  expect(response.body.data.unreadCount).toBe(1);
  expect(response.body.data.notifications[0]).toMatchObject({
    status: 'DRIVER_EN_ROUTE',
    bookingNumber: 'RJS12345678',
    readAt: null,
  });
});

it('persists mark-all-read for the authenticated customer', async () => {
  const response = await request(app).post('/notifications/read-all').send({});
  expect(response.status).toBe(200);
  expect(customer.notificationsReadAt).toBeInstanceOf(Date);
  expect(customer.save).toHaveBeenCalledOnce();
});

it('registers and unregisters the current device token', async () => {
  CustomerSession.updateMany.mockResolvedValue({ modifiedCount: 0 });
  CustomerSession.updateOne.mockResolvedValue({ modifiedCount: 1 });
  expect((await request(app).put('/notifications/device').send({
    token: 'customer-device-token-with-enough-length',
    platform: 'android',
  })).status).toBe(200);
  expect(CustomerSession.updateOne).toHaveBeenCalledWith(
    expect.objectContaining({ customerId: 'customer' }),
    { $set: expect.objectContaining({ pushPlatform: 'android' }) },
  );
  expect((await request(app).delete('/notifications/device')).status).toBe(200);
  expect(CustomerSession.updateOne).toHaveBeenLastCalledWith(
    expect.objectContaining({ customerId: 'customer' }),
    { $unset: { pushToken: 1, pushPlatform: 1 } },
  );
});
