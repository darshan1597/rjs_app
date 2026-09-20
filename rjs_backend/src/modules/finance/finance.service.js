import { Booking } from '../bookings/booking.model.js';
import { Payment, Refund } from '../payments/payment.model.js';
import { Wallet, WalletAdjustment, WalletTopup, WalletWithdrawal } from '../wallets/wallet.model.js';

const INDIA_OFFSET_MS = 330 * 60 * 1000;
function periodStart(period, now = new Date()) {
  if (period === 'all') return null;
  const india = new Date(now.getTime() + INDIA_OFFSET_MS);
  if (period === 'today') return new Date(Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate()) - INDIA_OFFSET_MS);
  if (period === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(Date.UTC(india.getUTCFullYear(), 0, 1) - INDIA_OFFSET_MS);
}
const dated = (match, field, start) => start ? { ...match, [field]: { $gte: start } } : match;
async function sumRupees(Model, match, field = 'amount') {
  const rows = await Model.aggregate([{ $match: match }, { $group: { _id: null,
    totalPaise: { $sum: { $round: [{ $multiply: [{ $ifNull: [`$${field}`, 0] }, 100] }, 0] } }, count: { $sum: 1 } } }]);
  return { paise: rows[0]?.totalPaise ?? 0, count: rows[0]?.count ?? 0 };
}
async function sumPaise(Model, match, field) {
  const rows = await Model.aggregate([{ $match: match }, { $group: { _id: null,
    totalPaise: { $sum: { $ifNull: [`$${field}`, 0] } }, count: { $sum: 1 } } }]);
  return { paise: rows[0]?.totalPaise ?? 0, count: rows[0]?.count ?? 0 };
}

async function getFinanceOverview(period) {
  const start = periodStart(period);
  const paidStatuses = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'];
  const [rideRevenue, gatewayRideRevenue, walletRideRevenue, completedRefunds, walletTopups,
    walletLiability, pendingPayments, pendingRefunds, manualCredits, manualDebits,
    heldWithdrawals, recentRefunds, recentAdjustments] = await Promise.all([
    sumRupees(Payment, dated({ status: { $in: paidStatuses } }, 'paidAt', start)),
    sumRupees(Payment, dated({ status: { $in: paidStatuses }, method: { $ne: 'WALLET' } }, 'paidAt', start)),
    sumRupees(Payment, dated({ status: { $in: paidStatuses }, method: 'WALLET' }, 'paidAt', start)),
    sumRupees(Refund, dated({ status: 'COMPLETED' }, 'completedAt', start), 'eligibleAmount'),
    sumPaise(WalletTopup, dated({ status: 'CREDITED' }, 'updatedAt', start), 'amountPaise'),
    sumPaise(Wallet, {}, 'balancePaise'),
    sumRupees(Booking, { status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' }, 'totalAmount'),
    sumRupees(Refund, { status: { $in: ['PENDING', 'APPROVED', 'PROCESSING', 'FAILED'] } }, 'eligibleAmount'),
    sumPaise(WalletAdjustment, dated({ status: 'APPROVED', type: 'CREDIT' }, 'reviewedAt', start), 'amountPaise'),
    sumPaise(WalletAdjustment, dated({ status: 'APPROVED', type: 'DEBIT' }, 'reviewedAt', start), 'amountPaise'),
    sumPaise(WalletWithdrawal, { status: { $in: ['PENDING', 'PROCESSING'] } }, 'amountPaise'),
    Refund.find().sort({ createdAt: -1 }).limit(10).populate('reviewedBy', 'name email').lean(),
    WalletAdjustment.find().sort({ createdAt: -1 }).limit(10).populate('customerId', 'name phone')
      .populate('requestedBy', 'name').populate('reviewedBy', 'name').lean(),
  ]);
  return {
    period,
    summary: {
      grossRideRevenuePaise: rideRevenue.paise,
      completedRefundsPaise: completedRefunds.paise,
      netRideRevenuePaise: rideRevenue.paise - completedRefunds.paise,
      gatewayRideRevenuePaise: gatewayRideRevenue.paise,
      walletRideRevenuePaise: walletRideRevenue.paise,
      walletTopupCollectionsPaise: walletTopups.paise,
      walletLiabilityPaise: walletLiability.paise + heldWithdrawals.paise,
      spendableWalletBalancePaise: walletLiability.paise,
      heldWithdrawalsPaise: heldWithdrawals.paise,
      heldWithdrawalsCount: heldWithdrawals.count,
      pendingCustomerPaymentsPaise: pendingPayments.paise,
      pendingCustomerPaymentsCount: pendingPayments.count,
      pendingRefundsPaise: pendingRefunds.paise,
      pendingRefundsCount: pendingRefunds.count,
      manualCreditsPaise: manualCredits.paise,
      manualDebitsPaise: manualDebits.paise,
    },
    recentRefunds, recentAdjustments,
  };
}

export { getFinanceOverview, periodStart };
