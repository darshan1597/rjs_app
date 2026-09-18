# Traffic controls and launch checklist

## Implemented account limits

Each authenticated customer and driver has independent one-minute group counters:

| Group | Requests/minute |
| --- | ---: |
| Tracking | 180 |
| Driver GPS uploads | 60 |
| Ride/payment actions | 60 |
| Other authenticated requests | 120 |

Endpoint counters are additional, not replacements for the group counters:

| Endpoint scope | Requests/minute/account | Routes |
| --- | ---: | --- |
| Location search | 30 | Customer maps autocomplete, place details, reverse geocode |
| Fare/route estimate | 20 | Customer vehicle catalog and maps route |
| Booking creation | 5 | POST customer/bookings |
| Booking cancellation | 5 | POST customer/bookings/:id/cancel |
| Driver accept/reject | 20 combined | POST driver/trips/:id/accept or reject |
| Payment creation | 5 | Customer payment-order or driver payment-qr |

Payment verification is not charged to payment creation; it still uses the actions group.
Scopes are keyed by server-verified account ids, not supplied user ids or unverified tokens.
Apps honor the scope and Retry-After header so an endpoint cooldown does not pause unrelated actions.
The 6,000/minute/IP emergency guard and existing OTP/admin protections remain.
Razorpay webhooks bypass that IP guard but require signature verification.

## Booking/payment retries

New customer booking screens send a random idempotency key and retain it while retrying unchanged details in the same screen. Changed details get a new key. The backend stores the key and payload hash, replays the existing booking, and rejects conflicting payloads with HTTP 409. Older clients without a key do not gain this protection. Screen restart does not retain the client key.

Verify the MongoDB unique partial index on customerId + bookingRequestKey exists before launch. Use an explicit index migration in production when autoIndex is disabled. Do not remove existing bookings to create this index; older documents have no retry key and are excluded.

Saved Razorpay orders are reused. Concurrent order creation is coalesced within one process. This is not a distributed lock or a guarantee across a crash between gateway creation and database persistence. Before multi-instance deployment, add distributed locking/reconciliation for order and QR creation.

## Monitoring

GET /api/v1/admin/monitoring requires a super-admin access token. It reports request counts, 429 counts, 4xx/5xx outcomes, and average/maximum latency by fixed scope. Counters reset on restart and represent this backend process only. Structured rate_limit_exceeded log events include scope and retry time, not phone numbers, OTPs, tokens, or payment secrets.

Before launch, ship logs/metrics to durable monitoring and configure alerts for 429 spikes, 5xx rates, latency, missing payment webhook confirmations, and external API errors. A monitoring dashboard and automated alerts are not implemented yet.

## Google Cloud manual configuration

These account settings have NOT been changed by code:

1. Use separate keys for the backend, customer Android app, and driver Android app.
2. Restrict Android keys to the actual package names and signing certificate SHA-1 values (include appropriate debug certificates for testing and release certificates for production).
3. Restrict the backend key to the required Google APIs and production egress IPs when stable IPs are available. Do not apply Android restrictions to a backend key.
4. Enable only the Google APIs used by each key.
5. Review each enabled API's available quotas and set limits from expected traffic plus operational headroom. Backend per-account limits do not cap aggregate Google usage across all accounts.
6. Configure billing budgets and notifications. Budget alerts are notifications, not a hard spending cap. Lower API quotas can affect legitimate rides, so monitor before tightening them.
7. Test autocomplete, place lookup, reverse geocoding, routes, and Android map rendering after restrictions change.

Official guidance: https://developers.google.com/maps/api-security-best-practices and https://developers.google.com/maps/billing-and-pricing/manage-costs

## Remaining production work

- Shared rate-limit counters (for example Redis) across all backend instances; current stores are process-memory.
- Restrict TRUST_PROXY to verified proxy addresses/subnets; do not blindly trust forwarded headers. With a tunnel, many users may share a proxy IP.
- Concurrent-customer/driver load tests, including tracking and critical actions after an endpoint is throttled.
- Tune starting limits from measurements; they are not a capacity guarantee.
- Durable metrics, alert delivery, gateway reconciliation, and restart-safe client booking retry persistence.
