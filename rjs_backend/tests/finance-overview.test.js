import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  paymentAggregate: vi.fn(), refundAggregate: vi.fn(), refundFind: vi.fn(), bookingAggregate: vi.fn(),
  walletAggregate: vi.fn(), topupAggregate: vi.fn(), adjustmentAggregate: vi.fn(), adjustmentFind: vi.fn(),
  withdrawalAggregate: vi.fn(),
}));
const listQuery = (items = []) => ({ sort: () => ({ limit: () => ({
  populate: () => ({ populate: () => ({ populate: () => ({ lean: async () => items }), lean: async () => items }), lean: async () => items }),
}) }) });
vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: { aggregate: mocks.bookingAggregate } }));
vi.mock('../src/modules/payments/payment.model.js', () => ({
  Payment: { aggregate: mocks.paymentAggregate }, Refund: { aggregate: mocks.refundAggregate, find: mocks.refundFind },
}));
vi.mock('../src/modules/wallets/wallet.model.js', () => ({
  Wallet: { aggregate: mocks.walletAggregate }, WalletTopup: { aggregate: mocks.topupAggregate },
  WalletAdjustment: { aggregate: mocks.adjustmentAggregate, find: mocks.adjustmentFind },
  WalletWithdrawal: { aggregate: mocks.withdrawalAggregate },
}));
import { getFinanceOverview, periodStart } from '../src/modules/finance/finance.service.js';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.paymentAggregate.mockResolvedValueOnce([{ totalPaise: 100000, count: 4 }])
    .mockResolvedValueOnce([{ totalPaise: 70000, count: 3 }]).mockResolvedValueOnce([{ totalPaise: 30000, count: 1 }]);
  mocks.refundAggregate.mockResolvedValueOnce([{ totalPaise: 15000, count: 1 }])
    .mockResolvedValueOnce([{ totalPaise: 5000, count: 2 }]);
  mocks.topupAggregate.mockResolvedValue([{ totalPaise: 40000, count: 2 }]);
  mocks.walletAggregate.mockResolvedValue([{ totalPaise: 25000, count: 3 }]);
  mocks.bookingAggregate.mockResolvedValue([{ totalPaise: 12000, count: 2 }]);
  mocks.adjustmentAggregate.mockResolvedValueOnce([{ totalPaise: 3000, count: 1 }])
    .mockResolvedValueOnce([{ totalPaise: 1000, count: 1 }]);
  mocks.withdrawalAggregate.mockResolvedValue([{ totalPaise: 4000, count: 2 }]);
  mocks.refundFind.mockReturnValue(listQuery());
  mocks.adjustmentFind.mockReturnValue(listQuery());
});

it('keeps revenue, refunds, wallet cash and liabilities separate', async () => {
  const result = await getFinanceOverview('all');
  expect(result.summary).toEqual({
    grossRideRevenuePaise: 100000, completedRefundsPaise: 15000, netRideRevenuePaise: 85000,
    gatewayRideRevenuePaise: 70000, walletRideRevenuePaise: 30000, walletTopupCollectionsPaise: 40000,
    walletLiabilityPaise: 29000, spendableWalletBalancePaise: 25000, heldWithdrawalsPaise: 4000,
    heldWithdrawalsCount: 2, pendingCustomerPaymentsPaise: 12000, pendingCustomerPaymentsCount: 2,
    pendingRefundsPaise: 5000, pendingRefundsCount: 2, manualCreditsPaise: 3000, manualDebitsPaise: 1000,
  });
});

it('uses India midnight for today and can report a negative period net', async () => {
  expect(periodStart('today', new Date('2026-09-19T02:00:00Z')).toISOString()).toBe('2026-09-18T18:30:00.000Z');
  mocks.paymentAggregate.mockReset().mockResolvedValue([]);
  const result = await getFinanceOverview('today');
  expect(result.summary.netRideRevenuePaise).toBe(-15000);
  expect(mocks.paymentAggregate.mock.calls[0][0][0].$match.paidAt.$gte).toBeInstanceOf(Date);
});
