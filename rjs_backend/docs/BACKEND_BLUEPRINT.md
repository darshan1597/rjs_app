# RJS Platform Backend Blueprint

Status: planning baseline for customer app, driver app, and admin dashboard  
Scope: architecture and contracts only; no backend implementation yet

## 1. Product boundaries

The RJS platform has four authenticated actor types:

1. Customer: searches, books, pays, tracks, cancels, and reviews trips.
2. Driver: registers, submits documents, receives assigned/nearby work, executes trips, and receives payouts.
3. Admin employee: operates only the modules and actions granted by the Super Admin.
4. Super Admin: manages employees, roles, permissions, platform configuration, and audit access.

The customer and driver mobile apps use the same backend, while the admin dashboard uses a separately protected `/admin` API surface.

## 2. Initial technical decisions

- Runtime: Node.js with Express.
- Database: MongoDB with Mongoose.
- API style: REST under `/api/v1`.
- Validation: request schemas at every public boundary.
- Authentication: short-lived access JWT plus rotating refresh token.
- Customer and driver login: mobile OTP.
- Admin login: email/password initially, with MFA designed as a follow-up requirement.
- Files: object storage for driver documents and images; MongoDB stores only metadata and object keys.
- Money: store in integer paise, never floating-point rupees.
- Time: store UTC timestamps; convert to local time in clients.
- Location: GeoJSON `Point` with `[longitude, latitude]` ordering.
- Sensitive actions: immutable audit entries.
- Deletes: prefer status changes/soft deletion for business records.

## 3. Authentication and identity

### 3.1 Customer

- Requests OTP using a normalized E.164 mobile number.
- Verifies OTP and receives access and refresh tokens.
- First successful verification creates a minimal customer profile.
- Profile completion is optional and can happen later.

### 3.2 Driver

- Uses mobile OTP authentication.
- Account state determines the next screen:
  - `registration_required`
  - `draft`
  - `submitted`
  - `under_review`
  - `changes_requested`
  - `approved`
  - `rejected`
  - `suspended`
- Only an approved, active driver with an approved active vehicle may go online.

### 3.3 Admin employee and Super Admin

- Uses email and password.
- Account must be active.
- Every protected endpoint declares a required permission.
- Super Admin bypass is explicit and logged; it is not represented as a wildcard string silently accepted everywhere.
- The first Super Admin is created through a one-time bootstrap command using deployment secrets.
- There is no public admin registration route.

### 3.4 Token/session rules

- Access token: approximately 15 minutes.
- Refresh token: longer lived, stored hashed in a session record.
- Refresh token rotation on every refresh.
- Revocation on logout, password reset, suspension, or employee deactivation.
- Store device name, platform, push token, IP metadata, and last-used timestamp per session.
- Rate-limit OTP requests, verification attempts, login attempts, and refresh endpoints.

## 4. Admin RBAC

### 4.1 Suggested employee roles

- Operations
- Driver Manager
- Customer Support
- Finance
- Package Manager
- Analyst/Viewer
- Custom role

Roles are editable permission bundles. The backend authorizes permissions, not role names.

### 4.2 Permission catalogue baseline

```text
dashboard.view

employees.view
employees.create
employees.update
employees.disable
employees.assign_roles

roles.view
roles.create
roles.update
roles.delete

customers.view
customers.update
customers.suspend

drivers.view
drivers.review
drivers.approve
drivers.request_changes
drivers.reject
drivers.suspend

vehicles.view
vehicles.review
vehicles.approve
vehicles.reject
vehicles.update_categories

bookings.view
bookings.assign
bookings.reassign
bookings.cancel
bookings.override_status

pricing.view
pricing.update

packages.view
packages.create
packages.update
packages.publish
packages.archive

payments.view
payments.refund
wallets.adjust

payouts.view
payouts.process
payouts.hold

support.view
support.assign
support.reply
support.resolve

reports.view
reports.export

settings.view
settings.update
audit_logs.view
```

High-risk permissions such as employee management, refunds, wallet adjustments, payout processing, pricing changes, and booking status overrides must always create audit logs.

## 5. MongoDB collections

### 5.1 `customers`

- `_id`
- `phone` (unique, normalized)
- `name`
- `email`
- `avatar`
- `status`: `active | suspended | deleted`
- `savedPlaces[]`: label, address, GeoJSON point, place provider ID
- `preferences`: language, notification settings
- `createdAt`, `updatedAt`, `lastLoginAt`

### 5.2 `drivers`

Matches the current seven-step registration UI.

- `_id`
- `phone` (unique)
- `fullName`
- `dateOfBirth`
- `gender`
- `email`
- `residentialAddress`
- `emergencyContact`
- `profilePhoto`
- `licence`: number, issueDate, expiryDate, issuingState, frontDocument, backDocument
- `registrationStatus`
- `reviewNotes[]`
- `operationalStatus`: `offline | available | reserved | on_trip | suspended`
- `currentLocation` (GeoJSON point)
- `locationUpdatedAt`
- `ratingSummary`: average and count
- `activeVehicleId`
- `createdAt`, `updatedAt`, `approvedAt`, `approvedBy`

### 5.3 `driver_documents`

- `_id`, `driverId`
- `type`: licence, Aadhaar/identity, police verification, address proof, profile photo, other
- `objectKey`, `mimeType`, `size`
- `status`: `pending | approved | rejected | expired`
- `expiryDate`
- `reviewedBy`, `reviewedAt`, `rejectionReason`
- timestamps

Document requirements should be configurable per vehicle category rather than hard-coded into the mobile app.

### 5.4 `driver_bank_accounts`

- `_id`, `driverId`
- `accountHolderName`
- encrypted account number plus masked display value
- `ifsc`
- optional `upiId`
- cancelled cheque/passbook document
- verification status and reviewer metadata
- `isPrimary`
- timestamps

### 5.5 `vehicle_categories`

Examples: auto, hatchback, sedan, SUV, 8-seater, tempo traveller, bus.

- `_id`, `code`, `displayName`
- `serviceTypes[]`
- `seatRange`
- `icon/image`
- `active`
- pricing eligibility/configuration references
- timestamps

### 5.6 `vehicles`

- `_id`, `ownerDriverId`
- `categoryId`
- `registrationNumber` (unique, normalized)
- `manufacturer`, `model`, `fuelType`, `seatingCapacity`, `manufacturingYear`
- `color`
- `photos[]`
- `documents[]`: RC, insurance, permit, fitness, pollution certificate, tax
- `verificationStatus`
- `operationalStatus`: `active | inactive | maintenance | suspended`
- timestamps and reviewer metadata

### 5.7 `bookings`

One unified booking collection with a `serviceType` discriminator:

- `instant_ride`
- `scheduled_ride`
- `city_round_trip`
- `rental`
- `tour_package`
- `custom_tour`

Core fields:

- `_id`, human-readable `bookingCode`
- `customerId`
- `serviceType`
- `status`
- pickup: address, GeoJSON point, provider place ID, notes
- destinations/stops[]
- schedule: requested pickup time, return time where applicable
- requested vehicle category and assigned vehicle/driver
- passenger count and customer notes
- service-specific details
- pricing snapshot
- payment status and method
- cancellation details
- timestamps for every lifecycle milestone
- created/updated timestamps

Service-specific data:

- Scheduled ride: waiting time and advance-booking details.
- City round trip: `book_now | schedule`, selected duration/custom duration.
- Rental: `hourly | daily | custom_km`, duration, included KM, selected package, add-ons.
- Tour: package ID/version, travel dates, itinerary snapshot, preferences.
- Custom tour: customer request, destinations, dates, people, notes, admin quotation.

### 5.8 `booking_status_events`

Append-only history:

- `bookingId`
- `fromStatus`, `toStatus`
- actor type and actor ID
- reason/metadata
- location where relevant
- timestamp

This is required for support investigations and accurate admin timelines.

### 5.9 `driver_assignments`

- `bookingId`, `driverId`, `vehicleId`
- source: automatic, manual admin, scheduled allocation
- offer/assignment status
- offeredAt, expiresAt, acceptedAt, declinedAt
- decline reason

Keeping assignments separate preserves the history of rejected, expired, and reassigned offers.

### 5.10 `pricing_rules`

- service type, city/zone, vehicle category
- base fare, per-KM, per-minute, waiting, minimum fare
- scheduling/rental/package modifiers
- cancellation rules
- taxes and platform fee
- effective period and version
- active/status metadata

Every booking stores the applied pricing snapshot so historical fares do not change when rules are edited.

### 5.11 `tour_packages` and `rental_packages`

Tour packages include title, media, destinations, itinerary, duration, distance, inclusions/exclusions, vehicle eligibility, price rules, publish status, and version.

Rental packages include rental type, duration, included KM, eligible vehicle categories, price, extra-hour/KM rates, add-ons, city/zone, publish status, and version.

### 5.12 `payments`, `wallets`, and `wallet_transactions`

- Payment records track provider order/payment/refund IDs, amounts in paise, status, booking, method, and idempotency key.
- Customer wallet stores aggregate balances only.
- Wallet transactions form an immutable ledger for credit, debit, bonus, lock, unlock, expiry, refund, and manual adjustment.
- Admin manual adjustments require a reason, permission, and audit entry.

### 5.13 `driver_earnings` and `payouts`

- Per-booking earning ledger: gross fare, driver share, incentive, deductions, taxes, net amount.
- Payout batch/item records: payable period, bank account snapshot, amount, provider reference, status, failure reason.

The driver fare/earning must remain hidden before completion, matching the current product decision.

### 5.14 Other collections

- `admin_accounts`
- `roles`
- `admin_sessions`
- `auth_sessions`
- `otp_challenges`
- `notifications`
- `device_tokens`
- `support_tickets`
- `reviews`
- `promo_codes`
- `audit_logs`
- `platform_settings`

## 6. Booking state machine

### 6.1 Main states

```text
draft
quote_pending
quoted
payment_pending
scheduled
searching_driver
driver_assigned
driver_en_route
driver_arrived
otp_verified
in_progress
completed
cancelled_by_customer
cancelled_by_driver
cancelled_by_admin
expired
no_show
```

Not every service uses every state. Tour/custom package bookings can use `quote_pending` and `quoted`; scheduled bookings can remain `scheduled` until dispatch starts.

### 6.2 Normal instant ride transitions

```text
draft
  -> payment_pending/searching_driver
  -> driver_assigned
  -> driver_en_route
  -> driver_arrived
  -> otp_verified
  -> in_progress
  -> completed
```

Cancellation and expiry transitions are allowed only from defined states. The server—not the Flutter apps—owns transition validation.

### 6.3 Important invariants

- A driver cannot accept two active bookings.
- A vehicle cannot serve two overlapping bookings.
- Only the assigned driver can advance driver-controlled states.
- OTP verification is required before `in_progress` unless an audited admin override exists.
- Destination can be hidden from the driver until OTP/trip start according to service policy.
- Driver fare/earnings are revealed only after completion.
- Completion captures final distance/time and freezes financial calculations.
- Repeated requests use idempotency keys to prevent duplicate bookings/payments/state changes.

## 7. API surface for the first versions

All routes are prefixed with `/api/v1`.

### 7.1 Authentication

```text
POST /auth/customer/otp/request
POST /auth/customer/otp/verify
POST /auth/driver/otp/request
POST /auth/driver/otp/verify
POST /auth/refresh
POST /auth/logout

POST /admin/auth/login
POST /admin/auth/refresh
POST /admin/auth/logout
GET  /admin/auth/me
```

### 7.2 Driver registration and review

```text
GET   /drivers/me
PATCH /drivers/me/profile
PUT   /drivers/me/licence
POST  /drivers/me/documents/upload-url
POST  /drivers/me/vehicles
PATCH /drivers/me/vehicles/:vehicleId
PUT   /drivers/me/bank-account
POST  /drivers/me/registration/submit
GET   /drivers/me/registration/status

GET   /admin/drivers
GET   /admin/drivers/:driverId
POST  /admin/drivers/:driverId/approve
POST  /admin/drivers/:driverId/request-changes
POST  /admin/drivers/:driverId/reject
POST  /admin/drivers/:driverId/suspend
```

### 7.3 Admin employees and permissions

```text
GET    /admin/employees
POST   /admin/employees
GET    /admin/employees/:employeeId
PATCH  /admin/employees/:employeeId
POST   /admin/employees/:employeeId/disable
PUT    /admin/employees/:employeeId/roles

GET    /admin/roles
POST   /admin/roles
PATCH  /admin/roles/:roleId
DELETE /admin/roles/:roleId
GET    /admin/permissions
GET    /admin/audit-logs
```

### 7.4 Booking baseline

```text
POST /bookings/estimate
POST /bookings
GET  /bookings
GET  /bookings/:bookingId
POST /bookings/:bookingId/cancel
POST /bookings/:bookingId/payment

GET  /drivers/me/assignments
POST /driver-assignments/:assignmentId/accept
POST /driver-assignments/:assignmentId/decline
POST /bookings/:bookingId/en-route
POST /bookings/:bookingId/arrived
POST /bookings/:bookingId/verify-otp
POST /bookings/:bookingId/start
POST /bookings/:bookingId/complete
```

## 8. Recommended backend module structure

```text
rjs_backend/
  docs/
  src/
    app.js
    server.js
    config/
    database/
    common/
      errors/
      middleware/
      security/
      validation/
      utils/
    modules/
      auth/
      customers/
      drivers/
      vehicles/
      admins/
      roles/
      bookings/
      assignments/
      pricing/
      packages/
      payments/
      wallets/
      payouts/
      notifications/
      support/
      reviews/
      audit/
    jobs/
    integrations/
  scripts/
  tests/
```

Each module should own its model, validation, service/business rules, controller, and routes. Controllers remain thin; state transitions and permissions belong in services/middleware.

## 9. Implementation phases

### Phase 0: project foundation

- Express/Mongoose project scaffolding
- environment validation
- database connection
- API response/error conventions
- request validation
- logging, security headers, CORS, rate limiting
- unit/integration test setup

### Phase 1: authentication and RBAC

- customer and driver OTP challenge flow using a development OTP provider
- access/refresh sessions
- admin login
- Super Admin bootstrap command
- employee, role, permission, and audit modules

### Phase 2: driver onboarding vertical slice

- driver registration draft and document metadata
- vehicle and bank details
- submission/review states
- admin employee driver-review APIs
- approve/request changes/reject workflow
- connect the existing driver registration UI

### Phase 3: booking vertical slice

- vehicle categories and pricing baseline
- customer booking creation
- driver assignment
- accept, arrive, OTP, start, and complete
- customer and driver booking histories
- admin booking monitoring

### Phase 4: scheduled, round-trip, and rentals

- scheduled dispatch
- city round-trip duration rules
- rental packages, add-ons, and car selection

### Phase 5: tours and custom packages

- package catalogue/versioning
- custom package enquiry and admin quotation
- booking checkout

### Phase 6: money and operations

- payment provider integration
- wallet ledger
- refunds
- driver earnings and payouts
- support tickets and notifications

## 10. First milestone acceptance criteria

The first implementation milestone is complete when:

1. A bootstrap command safely creates the first Super Admin.
2. The Super Admin can log in and create an employee.
3. The Super Admin can create/assign a role with driver-review permissions.
4. An employee without permission is denied by the API.
5. An authorized office employee can create and submit a driver registration.
6. An authorized manager can approve, reject, or request changes.
7. The driver app receives the correct registration status after login.
8. All sensitive admin operations produce audit entries.
9. Automated integration tests cover the authorization and review workflow.

## 11. Confirmed launch decisions

- Launch city: Bengaluru.
- Database: MongoDB Atlas.
- Development OTP: fixed `123456` outside production.
- Initial Super Admin: Darshan (`darshanradha1597@gmail.com`).
- Driver onboarding: office-assisted only. Drivers cannot self-register.
- Bus and tempo traveller ownership: both driver-owned and company/fleet-owned.
- The current driver registration wizard is a UI reference for the admin registration workflow; it must not be publicly accessible from driver authentication.

## 12. Decisions to confirm before their implementation phase

These choices affect schema or external integrations and should be decided before their phase starts:

- File/object storage provider.
- Payment gateway and wallet regulatory scope.
- Mapping/geocoding/routing provider.
- Whether drivers can own multiple vehicles and switch active vehicles.
- Customer cancellation and driver no-show policy.
- Admin MFA requirement at launch.
- Data retention periods for location history, OTP challenges, documents, and audit logs.

## 13. Immediate next action

Review and confirm the decisions in section 11. Then scaffold Phase 0 and Phase 1 only. Do not build booking controllers before authentication, permission checks, audit logging, and the booking state-transition contract are established.
