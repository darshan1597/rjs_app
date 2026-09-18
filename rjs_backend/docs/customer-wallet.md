# RJS customer wallet

Implemented: authenticated balance and recent ledger, Razorpay top-ups, checkout verification, captured-payment webhook credits, manual API reconciliation, and completed-ride wallet payments. No withdrawals, transfers, or fictional cashback. The live wallet screen preserves the original blue balance card, illustrations, transaction rows, and gift offer panel with dynamic data. The main/bonus/locked breakdown and four quick-action tiles were removed at the user's request. Add Money remains in the blue card, history uses View All, and the banner's View Offers opens the actual 5% discount.

## Pricing policy

5% discount on the entire final bill (including its existing waiting, parking, toll, and tax amounts). Compute in integer paise and round the discount to the nearest paise. The full discounted amount must be available; split wallet/gateway payments are not supported. Preserve the original fare snapshot, store the promotional discount separately, and show the actual paid amount and discount on the receipt/PDF. Example: ₹100 bill → ₹5 discount → ₹95 debit.

## Safety and operational requirements

- MongoDB replica set or sharded deployment is required. Balance, ledger, booking, payment record, and driver release are committed in one transaction. There is no unsafe standalone-database fallback.
- Credit only captured INR payments matching the stored Razorpay order and amount. Verify checkout signatures and existing webhook signatures. Duplicate callbacks/webhooks do not credit twice.
- Unique top-up retry keys, payment IDs, and ledger references; conditional debits prevent negative balances. Transaction conflicts retry through MongoDB/Mongoose.
- Starting checkout or generating a driver QR reserves the gateway payment channel. Wallet cannot then pay the same ride. QR creation is now on-demand via the driver's Generate Payment QR button; existing rides with a generated QR/order must finish through Razorpay. A selected gateway channel remains selected even if checkout is canceled; retry the same gateway payment.
- Per-top-up amount ₹100–₹10,000 is an application policy, not a statement of RBI limits. Create/reconcile/pay requests share the existing 5/min/account payment-creation limiter. General authenticated limits apply too.
- Recent ledger returns 50 entries; pending payment recovery shows the latest 5 pending orders. Older entries remain in the database. No historical mock balance is migrated.
- Use Razorpay test mode for testing. Before real-money launch, review stored-value eligibility with Razorpay and qualified legal/accounting advisers, including whether the RJS driver/service structure qualifies as own-service credit, refund/cancellation terms, promotional tax treatment, and financial reconciliation. Do not assume this implementation alone satisfies regulatory requirements. See [RBI PPI FAQ](https://rbi.org.in/Commonman/English/Scripts/FAQs.aspx?Id=2812) and [Razorpay verification guidance](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/).
- Wallet admin adjustments/refunds, alerts, production refund operations, and withdrawals/transfers are not implemented in this version.

## Safe pending-payment cleanup

Gateway-confirmed failed attempts are eligible for soft archiving after 15 minutes from the latest attempt or checkout reopen. Orders with no payment attempts are eligible after 24 hours. Authorized, processing/unknown, refunded, incomplete responses, and gateway errors never trigger archiving. These are eligibility windows, not exact removal deadlines.

The backend runs a bounded sweep every minute (up to 20 orders), with database claims and a five-minute per-active-order check cooldown. Opening Wallet also checks up to three eligible entries. Archived unpaid orders are rechecked daily; signed captured-payment webhooks and explicit verification still work immediately. Gateway reconciliation requests have a 12-second timeout.

Archiving only hides the Check payment card: no top-up, ledger, or payment records are deleted and financial status stays PENDING. An explicit retry reopens the same order. Later verified captures credit the wallet once in the existing transaction and clear archive fields. Cleanup never deducts balance or grants credit based solely on an app failure/cancellation message.

## Test checklist

Restart backend and rebuild customer/driver apps. Keep the webhook tunnel running with payment.captured enabled.

1. Open Wallet: new accounts start at zero; no mock transactions.
2. Add ₹100 through Razorpay test checkout; check ₹100 credited once and one ledger entry.
3. Cancel/decline checkout: balance unchanged. Check payment does not credit an uncaptured payment.
4. Close the app during checkout; after a successful capture, reopen and refresh or use Check payment. Do not pay again merely because the response was lost.
5. Complete a fresh ride, choose Pay with Wallet before checkout/QR: verify bill, 5% saving, debit, completed status, driver release, history, receipt and PDF.
6. Insufficient balance: no debit/completion; add money or use Razorpay.
7. Retry payment: only one debit. Another customer's wallet/ride/top-up cannot be accessed.
8. Generate driver QR/start checkout first: wallet is unavailable; finish gateway payment without discount.

Automated unit/API tests are under tests/wallet*.test.js. `node scripts/check-wallet-transactions.js` runs actual MongoDB concurrency and rollback checks in a uniquely named temporary database and removes only that database afterward; it does not use the application's data database.
