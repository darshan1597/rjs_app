import { AppError } from '../../common/errors/app-error.js';
import { Booking } from '../bookings/booking.model.js';
import { Payment, Refund } from '../payments/payment.model.js';
import { SupportTicket } from '../support/support-ticket.model.js';
import {
  Wallet, WalletAdjustment, WalletTopup, WalletWithdrawal,
} from '../wallets/wallet.model.js';
import { CustomerAddress } from './customer-address.model.js';
import { CustomerReminder } from './customer-reminder.model.js';
import { Customer, CustomerSession } from './customer.model.js';

const activeRideStatuses = [
  'NEW', 'SEARCHING_DRIVER', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'ASSIGNMENT_PENDING',
  'ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING',
];

export async function accountDeletionBlocker(customerId) {
  const [activeRide, wallet, pendingTopup, pendingWithdrawal, pendingRefund, pendingAdjustment] = await Promise.all([
    Booking.exists({ customerId, status: { $in: activeRideStatuses } }),
    Wallet.findOne({ customerId }).select('balancePaise').lean(),
    WalletTopup.exists({ customerId, status: 'PENDING', archivedAt: { $exists: false } }),
    WalletWithdrawal.exists({ customerId, status: { $in: ['PENDING', 'PROCESSING'] } }),
    Refund.exists({ customerId, status: { $in: ['PENDING', 'APPROVED', 'PROCESSING', 'FAILED'] } }),
    WalletAdjustment.exists({ customerId, status: 'PENDING' }),
  ]);
  if (activeRide) return 'Finish or cancel your active ride before deleting your account.';
  if (Number(wallet?.balancePaise || 0) > 0) return 'Use or withdraw your remaining wallet balance before deleting your account.';
  if (pendingTopup) return 'A wallet top-up is still being verified. Please resolve it before deleting your account.';
  if (pendingWithdrawal) return 'A wallet withdrawal is still being processed. Please wait for it to finish.';
  if (pendingRefund) return 'A refund is still being processed. Please wait for it to finish.';
  if (pendingAdjustment) return 'A wallet adjustment is awaiting review. Please wait for it to finish.';
  return null;
}

export async function deleteCustomerAccount(customer) {
  const blocker = await accountDeletionBlocker(customer._id);
  if (blocker) throw new AppError(409, 'ACCOUNT_DELETION_BLOCKED', blocker);

  const originalPhone = customer.phone;
  const originalEmail = customer.email;
  const now = new Date();
  const anonymousPhone = `deleted-${customer._id}`;
  const deleted = await Customer.findOneAndUpdate(
    { _id: customer._id, status: 'ACTIVE' },
    {
      $set: {
        status: 'DELETED', deletedAt: now, phone: anonymousPhone, name: 'Deleted Customer',
        profileCompleted: false, notificationsReadAt: now,
        notificationPreferences: { pushEnabled: false, rideUpdates: false, offers: false },
      },
      $unset: { email: 1 },
    },
    { new: true },
  );
  if (!deleted) throw new AppError(409, 'ACCOUNT_UNAVAILABLE', 'This account is no longer active');

  await Promise.all([
    CustomerSession.updateMany(
      { customerId: customer._id },
      { $set: { revokedAt: now }, $unset: { pushToken: 1, pushPlatform: 1 } },
    ),
    CustomerAddress.deleteMany({ customerId: customer._id }),
    CustomerReminder.updateMany(
      { customerId: customer._id, status: { $in: ['PENDING', 'CLAIMED'] } },
      { $set: { status: 'OBSOLETE' } },
    ),
    Booking.updateMany(
      { customerId: customer._id },
      { $set: { 'customer.name': 'Deleted Customer', 'customer.phone': anonymousPhone } },
    ),
    Payment.updateMany(
      { bookingId: { $in: await Booking.distinct('_id', { customerId: customer._id }) } },
      { $set: { customerName: 'Deleted Customer', customerPhone: anonymousPhone } },
    ),
    Refund.updateMany({ customerId: customer._id }, { $set: { customerName: 'Deleted Customer' } }),
    SupportTicket.updateMany(
      {
        requesterType: 'CUSTOMER',
        $or: [
          { requesterPhone: originalPhone },
          ...(originalEmail ? [{ requesterEmail: originalEmail }] : []),
        ],
      },
      {
        $set: { requesterName: 'Deleted Customer', 'messages.$[message].senderName': 'Deleted Customer' },
        $unset: { requesterPhone: 1, requesterEmail: 1 },
      },
      { arrayFilters: [{ 'message.senderType': 'CUSTOMER' }] },
    ),
  ]);
  return { deleted: true, deletedAt: now };
}
