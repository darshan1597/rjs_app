// Uses a new isolated database, never the configured application's database.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Wallet, WalletTopup, WalletLedger } from '../src/modules/wallets/wallet.model.js';
import { Booking } from '../src/modules/bookings/booking.model.js';
import { Payment } from '../src/modules/payments/payment.model.js';
import { Driver } from '../src/modules/drivers/driver.model.js';
import { creditTopup, payRideWithWallet } from '../src/modules/wallets/wallet.service.js';
const testDatabase = `rjs_wallet_test_${crypto.randomBytes(8).toString('hex')}`;
let ownsDatabase = false;
try {
  await mongoose.connect(env.MONGODB_URL, { dbName: testDatabase, autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 10000 });
  assert.match(mongoose.connection.name, /^rjs_wallet_test_[a-f0-9]{16}$/);
  assert.equal(mongoose.connection.name, testDatabase);
  assert.equal((await mongoose.connection.db.listCollections().toArray()).length, 0);
  ownsDatabase = true;
  for (const model of [Wallet, WalletTopup, WalletLedger, Booking, Payment, Driver]) {
    await model.createCollection();
    await model.createIndexes();
  }
  const customerId = new mongoose.Types.ObjectId();
  const driverId = new mongoose.Types.ObjectId();
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
  console.log('Wallet database checks passed: duplicate credits/payments, competing debits, full rollback, driver release, wallet/gateway race, and late archived payment credited once.');
} finally {
  if (ownsDatabase && mongoose.connection.name === testDatabase && /^rjs_wallet_test_[a-f0-9]{16}$/.test(testDatabase)) {
    await mongoose.connection.db.dropDatabase();
    console.log('Removed the isolated temporary wallet test database.');
  }
  await mongoose.disconnect();
}
