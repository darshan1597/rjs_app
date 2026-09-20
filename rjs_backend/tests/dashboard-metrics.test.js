import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  countCalls: [], aggregateCalls: [],
  adminCount: vi.fn(), auditCount: vi.fn(), auditFind: vi.fn(),
}));

vi.mock('mongoose', () => ({ default: { connection: { db: { collection: (name) => ({
  countDocuments: async (filter) => {
    mocks.countCalls.push({ name, filter });
    if (name === 'drivers') return 7;
    if (filter.status) return 4;
    if (filter.completedAt) return 3;
    return 2;
  },
  aggregate: (pipeline) => ({ toArray: async () => {
    mocks.aggregateCalls.push({ name, pipeline });
    if (name === 'payments' && pipeline[1]?.$group?._id === null) return [{ total: 99 }];
    return [];
  } }),
  find: () => ({ sort: () => ({ limit: () => ({ project: () => ({ toArray: async () => [] }) }) }) }),
}) } } } }));
vi.mock('../src/modules/admins/admin-account.model.js', () => ({ AdminAccount: { countDocuments: mocks.adminCount } }));
vi.mock('../src/modules/audit/audit-log.model.js', () => ({ AuditLog: { countDocuments: mocks.auditCount, find: mocks.auditFind } }));

import { getEmployeeDashboard, indiaDayBounds } from '../src/modules/dashboard/employee-dashboard.service.js';
import { getAdminDashboard } from '../src/modules/dashboard/admin-dashboard.service.js';

beforeEach(() => {
  mocks.countCalls.length = 0;
  mocks.aggregateCalls.length = 0;
  mocks.adminCount.mockReset().mockResolvedValue(5);
  mocks.auditCount.mockReset().mockResolvedValue(8);
  mocks.auditFind.mockReset().mockReturnValue({ populate: () => ({ sort: () => ({ limit: async () => [] }) }) });
});

describe('dashboard metric definitions', () => {
  it('uses India calendar-day boundaries independently of server timezone', () => {
    const { start, end } = indiaDayBounds(new Date('2026-09-18T20:00:00.000Z'));
    expect(start.toISOString()).toBe('2026-09-18T18:30:00.000Z');
    expect(end.toISOString()).toBe('2026-09-19T18:30:00.000Z');
  });

  it('counts current ride/driver statuses and paid-at revenue for employees', async () => {
    const result = await getEmployeeDashboard();
    expect(result.metrics).toMatchObject({ todayBookings: 2, liveTrips: 4, pendingDrivers: 7, completedToday: 3, todayRevenue: 99 });
    expect(mocks.countCalls).toContainEqual({ name: 'bookings', filter: { status: { $in: ['DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] } } });
    expect(mocks.countCalls).toContainEqual({ name: 'drivers', filter: { status: 'PENDING' } });
    const revenue = mocks.aggregateCalls.find((call) => call.name === 'payments');
    expect(revenue.pipeline[0].$match).toMatchObject({ status: { $in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] }, paidAt: { $gte: expect.any(Date), $lt: expect.any(Date) } });
  });

  it('uses PAID payment records for Super Admin revenue', async () => {
    const result = await getAdminDashboard();
    expect(result.metrics.totalRevenue).toBe(99);
    const paymentCalls = mocks.aggregateCalls.filter((call) => call.name === 'payments');
    expect(paymentCalls[0].pipeline[0].$match).toEqual({ status: { $in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] } });
    expect(paymentCalls[1].pipeline[0].$match).toMatchObject({ status: { $in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] }, paidAt: { $gte: expect.any(Date) } });
  });
});
