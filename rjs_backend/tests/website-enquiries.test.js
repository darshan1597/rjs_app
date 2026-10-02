import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ create: vi.fn(), findOne: vi.fn() }));

vi.mock('../src/modules/website-enquiries/website-enquiry.model.js', () => ({
  WebsiteEnquiry: { create: mocks.create },
}));
vi.mock('../src/modules/tour-packages/tour-package.model.js', () => ({
  TourPackage: { findOne: mocks.findOne },
}));

import { errorHandler } from '../src/common/middleware/error-handler.js';
import { publicWebsiteEnquiryRouter } from '../src/modules/website-enquiries/public-website-enquiry.routes.js';

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/v1/website-enquiries', publicWebsiteEnquiryRouter);
  instance.use(errorHandler);
  return instance;
}

const requestBody = {
  name: 'Anita Rao',
  phone: '+91 98765 43210',
  email: 'anita@example.com',
  travelType: 'Local ride',
  message: 'Please call me about a Bengaluru booking.',
  website: '',
};

beforeEach(() => vi.clearAllMocks());

it('stores a general website enquiry and exposes only its reference', async () => {
  mocks.create.mockResolvedValue({ enquiryNumber: 'WEB-123', status: 'NEW' });

  const response = await request(app()).post('/api/v1/website-enquiries').send(requestBody);

  expect(response.status).toBe(201);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
    customer: { name: requestBody.name, phone: requestBody.phone, email: requestBody.email },
    source: 'CONTACT',
  }));
  expect(response.body.data).toEqual({ enquiryNumber: 'WEB-123', status: 'NEW' });
  expect(response.body.data.customer).toBeUndefined();
});

it('uses the published package record for package enquiry details', async () => {
  const packageId = '507f1f77bcf86cd799439011';
  const tourPackage = { _id: packageId, title: 'Coorg Escape', slug: 'coorg-escape', price: 12500, durationLabel: '3 Days' };
  const lean = vi.fn().mockResolvedValue(tourPackage);
  const select = vi.fn(() => ({ lean }));
  mocks.findOne.mockReturnValue({ select });
  mocks.create.mockResolvedValue({ enquiryNumber: 'WEB-456', status: 'NEW' });

  const response = await request(app()).post('/api/v1/website-enquiries').send({ ...requestBody, packageId });

  expect(response.status).toBe(201);
  expect(mocks.findOne).toHaveBeenCalledWith({ _id: packageId, status: 'PUBLISHED' });
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
    source: 'TOUR_PACKAGE',
    packageId,
    packageSnapshot: expect.objectContaining({ title: tourPackage.title, price: tourPackage.price }),
  }));
});

it('rejects malformed submissions before writing them', async () => {
  const response = await request(app()).post('/api/v1/website-enquiries').send({ ...requestBody, message: 'short' });

  expect(response.status).toBe(422);
  expect(mocks.create).not.toHaveBeenCalled();
});
