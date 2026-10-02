import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ find: vi.fn(), findOne: vi.fn(), countDocuments: vi.fn() }));

vi.mock('../src/modules/tour-packages/tour-package.model.js', () => ({
  TourPackage: mocks,
}));

import { publicTourPackageRouter } from '../src/modules/tour-packages/public-tour-package.routes.js';

function app() {
  const instance = express();
  instance.use('/api/v1/tour-packages', publicTourPackageRouter);
  return instance;
}

beforeEach(() => vi.clearAllMocks());

it('lists only published packages and hides administrative fields', async () => {
  const item = { _id: 'package-1', title: 'Coorg', slug: 'coorg', status: 'PUBLISHED' };
  const lean = vi.fn().mockResolvedValue([item]);
  const limit = vi.fn(() => ({ lean }));
  const skip = vi.fn(() => ({ limit }));
  const sort = vi.fn(() => ({ skip }));
  const select = vi.fn(() => ({ sort }));
  mocks.find.mockReturnValue({ select });
  mocks.countDocuments.mockResolvedValue(1);

  const response = await request(app()).get('/api/v1/tour-packages?limit=8');

  expect(response.status).toBe(200);
  expect(mocks.find).toHaveBeenCalledWith({ status: 'PUBLISHED' });
  expect(select).toHaveBeenCalledWith('-createdBy -updatedBy -__v -status');
  expect(response.body.data.items).toEqual([item]);
});

it('looks up package details by slug and published status together', async () => {
  const item = { _id: 'package-1', title: 'Coorg', slug: 'coorg' };
  const lean = vi.fn().mockResolvedValue(item);
  const select = vi.fn(() => ({ lean }));
  mocks.findOne.mockReturnValue({ select });

  const response = await request(app()).get('/api/v1/tour-packages/coorg');

  expect(response.status).toBe(200);
  expect(mocks.findOne).toHaveBeenCalledWith({ slug: 'coorg', status: 'PUBLISHED' });
  expect(response.body.data.package).toEqual(item);
});
