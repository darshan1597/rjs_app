import { Wallet, WalletLedger } from './wallet.model.js';

const debitRestrictedFirst = (state, amount) => {
  const restricted = Math.min(state.restricted, amount);
  const withdrawable = Math.min(state.withdrawable, amount - restricted);
  return { withdrawableDeltaPaise: -withdrawable, restrictedDeltaPaise: -restricted };
};

// Existing wallets predate balance buckets. Replay their immutable ledger once,
// spending restricted credit first, then persist the classification.
async function ensureWalletBalances(customerId) {
  let wallet = await Wallet.findOneAndUpdate(
    { customerId },
    { $setOnInsert: { balancePaise: 0, withdrawablePaise: 0, restrictedPaise: 0, balanceVersion: 2 } },
    { upsert: true, new: true },
  );
  if (wallet.balanceVersion === 2) return wallet;
  const ledger = await WalletLedger.find({ customerId }).sort({ createdAt: 1, _id: 1 }).lean();
  const state = { withdrawable: 0, restricted: 0 };
  const writes = [];
  for (const entry of ledger) {
    let deltas;
    if (entry.withdrawableDeltaPaise || entry.restrictedDeltaPaise) {
      deltas = { withdrawableDeltaPaise: entry.withdrawableDeltaPaise || 0, restrictedDeltaPaise: entry.restrictedDeltaPaise || 0 };
    } else if (entry.type === 'TOPUP' || entry.type === 'REFUND_CREDIT' || entry.type === 'WITHDRAWAL_RELEASE') {
      deltas = { withdrawableDeltaPaise: entry.amountPaise, restrictedDeltaPaise: 0 };
    } else if (entry.type === 'ADMIN_CREDIT') {
      deltas = { withdrawableDeltaPaise: 0, restrictedDeltaPaise: entry.amountPaise };
    } else {
      deltas = debitRestrictedFirst(state, entry.amountPaise);
    }
    state.withdrawable += deltas.withdrawableDeltaPaise;
    state.restricted += deltas.restrictedDeltaPaise;
    writes.push({ updateOne: { filter: { _id: entry._id }, update: { $set: deltas } } });
  }
  const difference = wallet.balancePaise - state.withdrawable - state.restricted;
  if (difference > 0) state.withdrawable += difference;
  if (difference < 0) {
    let excess = -difference;
    const restricted = Math.min(state.restricted, excess);
    state.restricted -= restricted;
    excess -= restricted;
    state.withdrawable = Math.max(0, state.withdrawable - excess);
  }
  if (writes.length) await WalletLedger.bulkWrite(writes);
  wallet = await Wallet.findOneAndUpdate(
    { customerId, balanceVersion: { $ne: 2 } },
    { $set: { withdrawablePaise: state.withdrawable, restrictedPaise: state.restricted, balanceVersion: 2 } },
    { new: true },
  ) || await Wallet.findOne({ customerId });
  return wallet;
}

export { ensureWalletBalances };
