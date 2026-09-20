import mongoose from 'mongoose';
import { vi } from 'vitest';
vi.mock('../src/modules/wallets/wallet.model.js', () => ({
  Wallet: { init: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn() },
  WalletTopup: { init: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn() },
  WalletLedger: { init: vi.fn(), create: vi.fn(), find: vi.fn(), bulkWrite: vi.fn() },
}));
vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: { findOne: vi.fn() } }));
vi.mock('../src/modules/payments/payment.model.js', () => ({ Payment: { init: vi.fn(), create: vi.fn() } }));
vi.mock('../src/modules/drivers/driver.model.js', () => ({ Driver: { updateOne: vi.fn() } }));
import { Wallet, WalletTopup, WalletLedger } from '../src/modules/wallets/wallet.model.js';
import { Booking } from '../src/modules/bookings/booking.model.js';
import { Payment } from '../src/modules/payments/payment.model.js';
import { creditTopup, payRideWithWallet, walletQuote } from '../src/modules/wallets/wallet.service.js';
let booking;
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(mongoose.connection, 'transaction').mockImplementation((operation) => operation('session'));
  const wallet = { _id: 'wallet', balancePaise: 100000, withdrawablePaise: 100000, restrictedPaise: 0, balanceVersion: 2 };
  Wallet.findOneAndUpdate.mockResolvedValue(wallet);
  Wallet.findOne.mockReturnValue({ session: async () => wallet });
  booking = { id: 'ride', _id: 'ride', totalAmount: 100, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING',
    customer: { name: 'Test', phone: '6666666666' }, statusHistory: [], save: vi.fn() };
  Booking.findOne.mockReturnValue({ session: async () => booking });
});
afterEach(() => vi.restoreAllMocks());
it('calculates 5% in integer paise', () => {
  expect(walletQuote(100)).toEqual({ grossPaise: 10000, discountPaise: 500, payablePaise: 9500 });
  expect(walletQuote(123.45)).toEqual({ grossPaise: 12345, discountPaise: 617, payablePaise: 11728 });
});
it.each([NaN, Infinity, -1, 0])('rejects an invalid bill %s', (amount) => expect(() => walletQuote(amount)).toThrow());
it('never credits a non-wallet gateway order', async () => {
  WalletTopup.findOne.mockResolvedValue(null);
  expect(await creditTopup({ order_id: 'other' })).toBe(false);
  expect(WalletLedger.create).not.toHaveBeenCalled();
});
it.each([
  { status: 'authorized', currency: 'INR', amount: 10000 },
  { status: 'captured', currency: 'USD', amount: 10000 },
  { status: 'captured', currency: 'INR', amount: 9999 },
])('rejects invalid top-ups: %j', async (payment) => {
  WalletTopup.findOne.mockResolvedValue({ amountPaise: 10000 });
  await expect(creditTopup({ order_id: 'order', ...payment })).rejects.toMatchObject({ code: 'TOPUP_NOT_CAPTURED' });
  expect(WalletLedger.create).not.toHaveBeenCalled();
});
it('credits a top-up once when callback and webhook repeat', async () => {
  WalletTopup.findOne.mockResolvedValue({ id: 'topup', _id: 'topup', customerId: 'customer', amountPaise: 10000 });
  WalletTopup.findOneAndUpdate.mockResolvedValueOnce({}).mockResolvedValueOnce(null);
  const payment = { id: 'pay', order_id: 'order', status: 'captured', currency: 'INR', amount: 10000 };
  await creditTopup(payment);
  await creditTopup(payment);
  expect(WalletLedger.create).toHaveBeenCalledTimes(1);
  expect(WalletLedger.create).toHaveBeenCalledWith([expect.objectContaining({ reference: 'topup:topup', amountPaise: 10000 })], { session: 'session' });
});
it('pays the discounted bill and makes repeats idempotent', async () => {
  await payRideWithWallet('customer', 'ride');
  await payRideWithWallet('customer', 'ride');
  expect(booking.walletPaidAmount).toBe(95);
  expect(booking.walletDiscountAmount).toBe(5);
  expect(booking.status).toBe('COMPLETED');
  expect(Payment.create).toHaveBeenCalledTimes(1);
  expect(Wallet.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: 'wallet', balancePaise: { $gte: 9500 }, restrictedPaise: { $gte: 0 }, withdrawablePaise: { $gte: 9500 } },
    { $inc: { balancePaise: -9500, restrictedPaise: -0, withdrawablePaise: -9500 } },
    { new: true, session: 'session' },
  );
  expect(Payment.create).toHaveBeenCalledWith([expect.objectContaining({
    walletWithdrawablePaidPaise: 9500, walletRestrictedPaidPaise: 0,
  })], { session: 'session' });
});
it('enforces booking ownership', async () => {
  Booking.findOne.mockReturnValue({ session: async () => null });
  await expect(payRideWithWallet('other', 'ride')).rejects.toMatchObject({ code: 'PAYMENT_NOT_AVAILABLE' });
  expect(Booking.findOne).toHaveBeenCalledWith({ _id: 'ride', customerId: 'other' });
});
it('does not debit an unfinished ride', async () => {
  booking.status = 'IN_PROGRESS';
  await expect(payRideWithWallet('customer', 'ride')).rejects.toMatchObject({ code: 'PAYMENT_NOT_AVAILABLE' });
  expect(Payment.create).not.toHaveBeenCalled();
});
it.each(['paymentChannel', 'razorpayOrderId', 'razorpayQrCodeId'])('blocks an active gateway payment: %s', async (field) => {
  booking[field] = field === 'paymentChannel' ? 'RAZORPAY' : 'gateway';
  await expect(payRideWithWallet('customer', 'ride')).rejects.toMatchObject({ code: 'PAYMENT_ALREADY_STARTED' });
  expect(Payment.create).not.toHaveBeenCalled();
});
it('does not complete a ride with insufficient balance', async () => {
  Wallet.findOne.mockReturnValue({ session: async () => null });
  await expect(payRideWithWallet('customer', 'ride')).rejects.toMatchObject({ code: 'INSUFFICIENT_WALLET_BALANCE' });
  expect(booking.save).not.toHaveBeenCalled();
  expect(WalletLedger.create).not.toHaveBeenCalled();
});
