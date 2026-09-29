import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: { exists: vi.fn() } }));
vi.mock('../src/modules/payments/payment.model.js', () => ({
  Payment: {}, Refund: { exists: vi.fn() },
}));
vi.mock('../src/modules/support/support-ticket.model.js', () => ({ SupportTicket: {} }));
vi.mock('../src/modules/wallets/wallet.model.js', () => ({
  Wallet: { findOne: vi.fn() },
  WalletAdjustment: { exists: vi.fn() },
  WalletTopup: { exists: vi.fn() },
  WalletWithdrawal: { exists: vi.fn() },
}));
vi.mock('../src/modules/customers/customer-address.model.js', () => ({ CustomerAddress: {} }));
vi.mock('../src/modules/customers/customer-reminder.model.js', () => ({ CustomerReminder: {} }));
vi.mock('../src/modules/customers/customer.model.js', () => ({ Customer: {}, CustomerSession: {} }));

import { Booking } from '../src/modules/bookings/booking.model.js';
import { Refund } from '../src/modules/payments/payment.model.js';
import {
  Wallet, WalletAdjustment, WalletTopup, WalletWithdrawal,
} from '../src/modules/wallets/wallet.model.js';
import { accountDeletionBlocker } from '../src/modules/customers/customer-account.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  Booking.exists.mockResolvedValue(null);
  Wallet.findOne.mockReturnValue({ select: () => ({ lean: async () => null }) });
  WalletTopup.exists.mockResolvedValue(null);
  WalletWithdrawal.exists.mockResolvedValue(null);
  Refund.exists.mockResolvedValue(null);
  WalletAdjustment.exists.mockResolvedValue(null);
});

it('allows account deletion only when rides and finances are settled', async () => {
  await expect(accountDeletionBlocker('customer')).resolves.toBeNull();
});

it('explains active-ride and wallet-balance blockers', async () => {
  Booking.exists.mockResolvedValueOnce({ _id: 'ride' });
  await expect(accountDeletionBlocker('customer')).resolves.toContain('active ride');
  Booking.exists.mockResolvedValue(null);
  Wallet.findOne.mockReturnValueOnce({ select: () => ({ lean: async () => ({ balancePaise: 100 }) }) });
  await expect(accountDeletionBlocker('customer')).resolves.toContain('wallet balance');
});
