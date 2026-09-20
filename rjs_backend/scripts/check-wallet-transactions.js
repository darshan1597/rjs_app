// Uses a new isolated database, never the configured application's database.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Wallet, WalletTopup, WalletLedger, WalletAdjustment, WalletEvent, WalletWithdrawal } from '../src/modules/wallets/wallet.model.js';
import { Booking } from '../src/modules/bookings/booking.model.js';
import { Payment, Refund } from '../src/modules/payments/payment.model.js';
import { Driver } from '../src/modules/drivers/driver.model.js';
import { Customer } from '../src/modules/customers/customer.model.js';
import { AdminAccount } from '../src/modules/admins/admin-account.model.js';
import { creditTopup, payRideWithWallet } from '../src/modules/wallets/wallet.service.js';
import { listAdminWallets, getAdminWalletDetails, requestWalletAdjustment, reviewWalletAdjustment } from '../src/modules/wallets/admin-wallet.service.js';
import { createRefundRequest, reviewRefund } from '../src/modules/payments/payment.service.js';
import { releaseWithdrawal, requestWithdrawal } from '../src/modules/wallets/wallet-withdrawal.service.js';
const testDatabase = `rjs_wallet_test_${crypto.randomBytes(8).toString('hex')}`;
let ownsDatabase = false;
try {
  await mongoose.connect(env.MONGODB_URL, { dbName: testDatabase, autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 10000 });
  assert.match(mongoose.connection.name, /^rjs_wallet_test_[a-f0-9]{16}$/);
  assert.equal(mongoose.connection.name, testDatabase);
  assert.equal((await mongoose.connection.db.listCollections().toArray()).length, 0);
  ownsDatabase = true;
  for (const model of [Wallet, WalletTopup, WalletLedger, WalletAdjustment, WalletEvent, WalletWithdrawal, Booking, Payment, Refund, Driver, Customer, AdminAccount]) {
    await model.createCollection();
    await model.createIndexes();
  }
  const customerId = new mongoose.Types.ObjectId();
  const driverId = new mongoose.Types.ObjectId();
  await Customer.create({ _id: customerId, phone: '9999999998', name: 'Wallet Admin Test' });
  await Driver.collection.insertOne({ _id: driverId, operationalStatus: 'ON_TRIP' });
  const topup = await WalletTopup.create({ customerId, amountPaise: 10000, retryKey: 'test-retry-key-1234', orderId: 'order_test' });
  const captured = { id: 'pay_test', order_id: topup.orderId, amount: 10000, currency: 'INR', status: 'captured' };
  await Promise.all(Array.from({ length: 10 }, () => creditTopup(captured)));
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, 10000);
  assert.equal(await WalletLedger.countDocuments({ type: 'TOPUP' }), 1);
  async function ride(amount) {
    return Booking.create({ bookingNumber: `RJS-TEST-${crypto.randomBytes(8).toString('hex')}`, customerId,
      customer: { name: 'Wallet integration test', phone: '9999999999' }, serviceType: 'IMMEDIATE_RIDE', timing: 'IMMEDIATE',
      pickup: { address: 'Test pickup' }, requestedVehicleType: 'SEDAN', scheduledStartAt: new Date(), scheduledEndAt: new Date(),
      assignmentMode: 'AUTOMATIC', currentDriverId: driverId, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING', totalAmount: amount });
  }
  const first = await ride(100);
  await Promise.all(Array.from({ length: 10 }, () => payRideWithWallet(customerId, first.id)));
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, 500);
  assert.equal(await WalletLedger.countDocuments({ type: 'RIDE_PAYMENT' }), 1);
  assert.equal(await Payment.countDocuments({ bookingId: first.id }), 1);
  assert.equal((await Driver.findById(driverId)).operationalStatus, 'ONLINE');
  const second = await ride(4), third = await ride(4);
  const simultaneous = await Promise.allSettled([payRideWithWallet(customerId, second.id), payRideWithWallet(customerId, third.id)]);
  assert.equal(simultaneous.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(simultaneous.find((item) => item.status === 'rejected').reason.code, 'INSUFFICIENT_WALLET_BALANCE');
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, 120);
  const rollbackRide = await ride(1);
  const originalCreate = Payment.create;
  try {
    Payment.create = async () => { throw new Error('Injected payment-record failure'); };
    await assert.rejects(payRideWithWallet(customerId, rollbackRide.id), /Injected/);
  } finally { Payment.create = originalCreate; }
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, 120);
  assert.equal((await Booking.findById(rollbackRide.id)).paymentStatus, 'PENDING');
  assert.equal(await WalletLedger.countDocuments({ reference: `ride:${rollbackRide.id}` }), 0);
  const racingRide = await ride(1);
  const race = await Promise.allSettled([
    payRideWithWallet(customerId, racingRide.id),
    Booking.findOneAndUpdate({ _id: racingRide._id, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING', paymentChannel: { $ne: 'WALLET' } },
      { $set: { paymentChannel: 'RAZORPAY' } }, { new: true }),
  ]);
  const afterRace = await Booking.findById(racingRide.id);
  const walletBalance = (await Wallet.findOne({ customerId })).balancePaise;
  if (afterRace.paymentChannel === 'WALLET') {
    assert.equal(walletBalance, 25);
    assert.equal(race[1].value, null);
  } else {
    assert.equal(afterRace.paymentChannel, 'RAZORPAY');
    assert.equal(walletBalance, 120);
    assert.equal(race[0].reason.code, 'PAYMENT_ALREADY_STARTED');
  }
  const lateTopup = await WalletTopup.create({ customerId, amountPaise: 10000, retryKey: 'late-retry-key-1234',
    orderId: 'order_late', archivedAt: new Date(), archiveReason: 'ABANDONED' });
  await Promise.all(Array.from({ length: 10 }, () => creditTopup({ id: 'pay_late', order_id: lateTopup.orderId,
    amount: 10000, currency: 'INR', status: 'captured' })));
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, walletBalance + 10000);
  const creditedLate = await WalletTopup.findById(lateTopup.id);
  assert.equal(creditedLate.status, 'CREDITED');
  assert.equal(creditedLate.archivedAt, undefined);
  assert.equal(creditedLate.archiveReason, undefined);
  assert.equal(await WalletLedger.countDocuments({ reference: `topup:${lateTopup.id}` }), 1);
  const adminList = await listAdminWallets({ page: 1, limit: 10, search: 'Wallet Admin' });
  assert.equal(adminList.items.length, 1);
  assert.equal(adminList.items[0]._id.toString(), customerId.toString());
  assert.equal(adminList.items[0].balancePaise, walletBalance + 10000);
  assert.equal(adminList.summary.customerWallets, 1);
  const adminDetails = await getAdminWalletDetails(customerId.toString(), 50);
  assert.equal(adminDetails.wallet.balancePaise, walletBalance + 10000);
  assert.equal(adminDetails.ledger.length, 4);
  assert.equal(adminDetails.topups.length, 2);
  const employee = await AdminAccount.create({ name: 'Wallet Employee', email: 'wallet-employee@test.invalid',
    passwordHash: 'test-only', accountType: 'EMPLOYEE', mustChangePassword: false });
  const superAdmin = await AdminAccount.create({ name: 'Wallet Super Admin', email: 'wallet-admin@test.invalid',
    passwordHash: 'test-only', accountType: 'SUPER_ADMIN' });
  const requestInput = { customerId: customerId.toString(), requestedBy: employee.id, type: 'CREDIT', amountPaise: 250,
    reason: 'Verified support correction', idempotencyKey: 'adjustment-retry-key-1234' };
  const adjustment = await requestWalletAdjustment(requestInput);
  const replayed = await requestWalletAdjustment(requestInput);
  assert.equal(replayed.id, adjustment.id);
  const approvals = await Promise.all(Array.from({ length: 5 }, () => reviewWalletAdjustment({ adjustmentId: adjustment.id,
    reviewerId: superAdmin.id, decision: 'APPROVED', note: 'Evidence checked by supervisor' })));
  assert.equal(approvals.filter((x) => x.changed).length, 1);
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, walletBalance + 10250);
  assert.equal(await WalletLedger.countDocuments({ reference: `adjustment:${adjustment.id}` }), 1);
  const debit = await requestWalletAdjustment({ ...requestInput, type: 'DEBIT', amountPaise: 100,
    idempotencyKey: 'adjustment-debit-key-1234', reason: 'Reverse verified duplicate credit' });
  const reviewedDebit = await reviewWalletAdjustment({ adjustmentId: debit.id, reviewerId: superAdmin.id,
    decision: 'APPROVED', note: 'Duplicate credit verified' });
  assert.equal(reviewedDebit.adjustment.balanceBeforePaise, walletBalance + 10250);
  assert.equal(reviewedDebit.adjustment.balanceAfterPaise, walletBalance + 10150);
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, walletBalance + 10150);
  const walletPayment = await Payment.findOne({ bookingId: first.id });
  const refund = await createRefundRequest(walletPayment.id, { amount: 1, reason: 'Verified partial wallet ride refund',
    requestKey: 'wallet-refund-key-1234' }, employee.id);
  await Promise.all(Array.from({ length: 5 }, () => reviewRefund(refund.id, {
    decision: 'APPROVED', note: 'Approved against original wallet-paid ride' }, superAdmin.id)));
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, walletBalance + 10250);
  assert.equal((await Refund.findById(refund.id)).status, 'COMPLETED');
  assert.equal((await Payment.findById(walletPayment.id)).status, 'PARTIALLY_REFUNDED');
  assert.equal(await WalletLedger.countDocuments({ reference: `refund:${refund.id}` }), 1);
  assert.equal(await WalletEvent.countDocuments({ sourceType: 'REFUND', sourceId: refund._id }), 1);
  const gatewayRide = await ride(10);
  gatewayRide.status = 'COMPLETED'; gatewayRide.paymentStatus = 'PAID'; gatewayRide.paymentMethod = 'CARD';
  await gatewayRide.save();
  const gatewayPayment = await Payment.create({ bookingId: gatewayRide._id, transactionId: 'pay_external_refund_test',
    razorpayPaymentId: 'pay_external_refund_test', method: 'CARD', methodDisplay: 'card', amount: 10,
    status: 'PAID', paidAt: new Date(), customerName: gatewayRide.customer.name,
    customerPhone: gatewayRide.customer.phone, bookingType: gatewayRide.serviceType });
  const gatewayRefund = await createRefundRequest(gatewayPayment.id, { amount: 2,
    reason: 'Move external payment refund into RJS wallet', requestKey: 'gateway-to-wallet-refund-1234' }, employee.id);
  await reviewRefund(gatewayRefund.id, { decision: 'APPROVED', note: 'Approved as wallet refund' }, superAdmin.id);
  const creditedGatewayRefund = await Refund.findById(gatewayRefund.id);
  assert.equal(creditedGatewayRefund.channel, 'WALLET');
  assert.equal(creditedGatewayRefund.withdrawableAmountPaise, 200);
  assert.equal(creditedGatewayRefund.restrictedAmountPaise, 0);
  const beforeWithdrawal = await Wallet.findOne({ customerId });
  assert.equal(beforeWithdrawal.balancePaise, beforeWithdrawal.withdrawablePaise + beforeWithdrawal.restrictedPaise);
  assert.equal(beforeWithdrawal.restrictedPaise, 150);
  await assert.rejects(requestWithdrawal({ customerId, amountPaise: beforeWithdrawal.withdrawablePaise + 100,
    vpa: 'wallet.test@upi', idempotencyKey: 'withdraw-too-large-key-1234' }),
  (error) => error.code === 'INSUFFICIENT_WITHDRAWABLE_BALANCE');
  const withdrawalInput = { customerId, amountPaise: 10000, vpa: 'wallet.test@upi', idempotencyKey: 'withdraw-safe-key-1234' };
  const withdrawalRequests = await Promise.all(Array.from({ length: 5 }, () => requestWithdrawal(withdrawalInput)));
  const withdrawalId = withdrawalRequests[0].id;
  assert.equal(new Set(withdrawalRequests.map((item) => item.id)).size, 1);
  assert.equal(await WalletLedger.countDocuments({ reference: `withdrawal:${withdrawalId}:hold` }), 1);
  assert.equal((await Wallet.findOne({ customerId })).withdrawablePaise, beforeWithdrawal.withdrawablePaise - 10000);
  await Promise.all(Array.from({ length: 5 }, () => releaseWithdrawal(withdrawalId, 'FAILED', 'Injected payout failure')));
  assert.equal(await WalletLedger.countDocuments({ reference: `withdrawal:${withdrawalId}:release` }), 1);
  const afterRelease = await Wallet.findOne({ customerId });
  assert.equal(afterRelease.balancePaise, beforeWithdrawal.balancePaise);
  assert.equal(afterRelease.withdrawablePaise, beforeWithdrawal.withdrawablePaise);
  assert.equal((await WalletWithdrawal.findById(withdrawalId)).status, 'FAILED');
  const excessive = await requestWalletAdjustment({ ...requestInput, type: 'DEBIT', amountPaise: walletBalance + 20000,
    idempotencyKey: 'adjustment-large-key-1234', reason: 'Intentional insufficient balance test' });
  await assert.rejects(reviewWalletAdjustment({ adjustmentId: excessive.id, reviewerId: superAdmin.id,
    decision: 'APPROVED', note: 'Test insufficient protection' }), (error) => error.code === 'INSUFFICIENT_WALLET_BALANCE');
  assert.equal((await WalletAdjustment.findById(excessive.id)).status, 'PENDING');
  assert.equal((await Wallet.findOne({ customerId })).balancePaise, walletBalance + 10450);
  console.log('Wallet database checks passed: payment concurrency, rollback, balance buckets, refund credits, restricted-fund protection, and duplicate-safe withdrawal hold/release.');
} finally {
  if (ownsDatabase && mongoose.connection.name === testDatabase && /^rjs_wallet_test_[a-f0-9]{16}$/.test(testDatabase)) {
    await mongoose.connection.db.dropDatabase();
    console.log('Removed the isolated temporary wallet test database.');
  }
  await mongoose.disconnect();
}
