# RJS customer wallet

Implemented: authenticated balance and ledger, Razorpay top-ups, checkout verification, captured-payment webhook credits, completed-ride wallet payments, wallet-only ride refunds, controlled UPI withdrawals, and Super Admin review. The live wallet screen preserves the original blue balance card and does not restore the removed main/bonus/locked cards. Internally, however, every balance is classified as withdrawable real money or restricted ride credit.

## Pricing policy

5% discount on the entire final bill (including its existing waiting, parking, toll, and tax amounts). Compute in integer paise and round the discount to the nearest paise. The full discounted amount must be available; split wallet/gateway payments are not supported. Preserve the original fare snapshot, store the promotional discount separately, and show the actual paid amount and discount on the receipt/PDF. Example: ₹100 bill → ₹5 discount → ₹95 debit.

## Safety and operational requirements

- MongoDB replica set or sharded deployment is required. Balance, ledger, booking, payment record, and driver release are committed in one transaction. There is no unsafe standalone-database fallback.
- Credit only captured INR payments matching the stored Razorpay order and amount. Verify checkout signatures and existing webhook signatures. Duplicate callbacks/webhooks do not credit twice.
- Unique top-up retry keys, payment IDs, and ledger references; conditional debits prevent negative balances. Transaction conflicts retry through MongoDB/Mongoose.
- Razorpay top-ups and refunds originating from external payments are withdrawable. Manual/admin credits are restricted to rides. Ride payments spend restricted credit first. Refunds of mixed wallet payments restore the original withdrawable/restricted proportions, preventing promotional credit from becoming cash.
- Starting checkout or generating a driver QR reserves the gateway payment channel. Wallet cannot then pay the same ride. QR creation is now on-demand via the driver's Generate Payment QR button; existing rides with a generated QR/order must finish through Razorpay. A selected gateway channel remains selected even if checkout is canceled; retry the same gateway payment.
- Per-top-up amount ₹100–₹10,000 is an application policy, not a statement of RBI limits. Create/reconcile/pay requests share the existing 5/min/account payment-creation limiter. General authenticated limits apply too.
- Recent ledger returns 50 entries; pending payment recovery shows the latest 5 pending orders. Older entries remain in the database. Existing wallets are classified once by replaying their immutable ledger; older top-ups/refunds are treated as real money and older admin credits as restricted.
- Use Razorpay test mode for testing. Before real-money launch, review stored-value eligibility with Razorpay and qualified legal/accounting advisers, including whether the RJS driver/service structure qualifies as own-service credit, refund/cancellation terms, promotional tax treatment, and financial reconciliation. Do not assume this implementation alone satisfies regulatory requirements. See [RBI PPI FAQ](https://rbi.org.in/Commonman/English/Scripts/FAQs.aspx?Id=2812) and [Razorpay verification guidance](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/).

## Safe pending-payment cleanup

Gateway-confirmed failed attempts are eligible for soft archiving after 15 minutes from the latest attempt or checkout reopen. Orders with no payment attempts are eligible after 24 hours. Authorized, processing/unknown, refunded, incomplete responses, and gateway errors never trigger archiving. These are eligibility windows, not exact removal deadlines.

The backend runs a bounded sweep every minute (up to 20 orders), with database claims and a five-minute per-active-order check cooldown. Opening Wallet also checks up to three eligible entries. Archived unpaid orders are rechecked daily; signed captured-payment webhooks and explicit verification still work immediately. Gateway reconciliation requests have a 12-second timeout.

Archiving only hides the Check payment card: no top-up, ledger, or payment records are deleted and financial status stays PENDING. An explicit retry reopens the same order. Later verified captures credit the wallet once in the existing transaction and clear archive fields. Cleanup never deducts balance or grants credit based solely on an app failure/cancellation message.

## Admin wallet visibility

Operational employees and Super Admins have a Wallets page with customer search, balances, ledger entries, and pending, archived, or credited top-up attempts. The protected API uses `Cache-Control: no-store` and omits top-up retry keys.

Employees can submit credit/debit adjustment requests with a mandatory reason and unique request key. Only a Super Admin can approve or reject. Approval changes the wallet and creates an `ADMIN_CREDIT` or `ADMIN_DEBIT` ledger entry in one MongoDB transaction; debits cannot make balances negative. The adjustment record stores requester/reviewer identities, reasons, notes, IPs, user agents, timestamps, and before/after balances. Repeated submissions and approvals are idempotent. Balances are never overwritten directly.

## Ride refunds

An employee requests a full or partial refund against the original paid transaction, and a Super Admin reviews it with a required note. Approval reserves the amount atomically so concurrent requests cannot exceed the original payment.

- Every approved ride refund is credited to the customer's RJS Wallet in one MongoDB transaction. The ledger uses `REFUND_CREDIT`; RJS does not invoke Razorpay's original-payment refund API for new requests.
- Refunds from card/UPI/net-banking payments become withdrawable wallet money. Refunds from wallet payments restore the source composition recorded when that ride was paid.
- An approved wallet credit or wallet refund creates a single-use celebration event. The customer app atomically claims that event on app open/resume, so `₹X credited` is shown only once even across multiple devices.

## Withdrawals

Customers can request ₹100–₹10,000 to a validated UPI ID, but only from `withdrawablePaise`. Creating a request atomically removes the amount from spendable and withdrawable balance and creates a `WITHDRAWAL_HOLD` ledger entry. Duplicate requests use a customer-scoped idempotency key.

A Super Admin must approve or reject each request. Approval sends an idempotent RazorpayX UPI payout; rejection, definitive payout failure, cancellation, or reversal atomically returns the held amount with one `WITHDRAWAL_RELEASE` entry. Network-ambiguous payouts remain `PROCESSING` and are checked using the same payout idempotency key, avoiding duplicate transfers.

Production withdrawals require `RAZORPAYX_KEY_ID`, `RAZORPAYX_KEY_SECRET`, `RAZORPAYX_ACCOUNT_NUMBER`, and `RAZORPAYX_WEBHOOK_SECRET`, server IP allowlisting, RazorpayX activation, and a webhook at `/api/v1/payments/razorpayx/webhook`. Subscribe to payout status events. Do not enable the customer-facing production feature until KYC, terms, fraud controls, limits, reconciliation, privacy, and regulatory requirements have been reviewed with Razorpay and qualified Indian legal/accounting advisers.

## Super Admin finance reporting

The Super Admin Finance page separates gross paid-ride revenue, completed refunds, net ride revenue, pending ride receivables, pending refund requests, wallet top-up cash, wallet-paid ride revenue, current wallet liability, held withdrawals, and approved manual credits/debits. Wallet liability includes both spendable balances and withdrawal holds until payouts complete.

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
9. Approve a card/UPI ride refund: confirm it credits the wallet as withdrawable money and displays the celebration only once.
10. Approve an RJS Wallet refund: confirm its source proportions are restored and the ledger has one `REFUND_CREDIT`.
11. Request a withdrawal larger than withdrawable balance but smaller than total balance: it must fail because restricted credit cannot be withdrawn.
12. Reject or simulate a failed withdrawal: confirm the hold is returned exactly once. For RazorpayX test mode, approve a valid request and verify payout webhook completion, UTR, and duplicate-webhook handling.

Automated unit/API tests are under tests/wallet*.test.js. `node scripts/check-wallet-transactions.js` runs actual MongoDB concurrency and rollback checks in a uniquely named temporary database and removes only that database afterward; it does not use the application's data database.
