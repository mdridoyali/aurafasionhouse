# Aura Fashion House — Bug-fix release

## Scope
Existing UI layout, styles, routes, payment methods and features are retained. No live database or external services were accessed or modified. This is a source-code release, not a production-tested deployment.

## Changes
- Orders dashboard: safely renders missing address/payment/exchange fields, validates the orders response, handles fetch errors, clears loading state, and aborts superseded filter requests. Missing data is displayed as unknown or a dash, never inferred. This addresses plausible rendering failures after HTTP 200; the precise original exception remains unconfirmed without the browser stack trace and original response.
- Invoice: handles absent address, payment details, status history, items and exchange arrays.
- Payment verification: prevents invalid verification of COD, closed/restored orders and payments that are not pending; manual payments must be verified before shipping/delivery.
- Order status: prevents reopening cancelled/returned/restored orders and invalid transitions from delivered orders. Returns are restricted to shipped/delivered orders.
- Exchange: rejects concurrent duplicate pending requests for the same SKU; prevents approvals on non-delivered/restored orders and rolls back if the original variant is missing.
- Stock restoration: fails transactionally rather than silently marking missing-variant stock as restored. A missing variant must be reconciled by staff before retrying.
- Search: escapes regex metacharacters and bounds search input length.
- Order IDs: increases random suffix from 4 to 16 hexadecimal characters; existing IDs are unchanged.
- Login: validates internal redirect path.
- API errors: known business-rule errors remain user-readable; unexpected errors return a generic message rather than exposing internal details.
- Environment: excludes actual credentials, adds a placeholder-only `.env.example`, and ignores environment files. No Git history or dependency/build cache is included.

## Validation
- TypeScript compiler (tsc --noEmit --incremental false): PASS.
- ESLint: PASS.
- Existing RBAC permission matrix: PASS.
- Next.js production build: BLOCKED. Uploaded dependencies contain Windows SWC, while the review environment requires Linux SWC. Package registry access was unavailable. No live/browser end-to-end tests were run.

## Remaining review items
- Confirm delivery-zone definition and address validation policy (free-form address fields cannot prove the location).
- Confirm whether cancelled orders should restore coupon redemption eligibility and how refunds should be recorded; these policies have not been changed.
- Distributed rate limiting and Cloudinary upload enforcement require deployment/service configuration; they have not been changed.
- Test the exact failing order records and the full order lifecycle against a safe test database; stock restoration after a previously approved exchange needs further reconciliation rules for quantities/variants.
- The dashboard retains the original pagination behavior. This release does not claim all bugs are fixed.

## Local setup
1. Back up your original project and database. Extract this ZIP to a new folder.
2. Copy your existing `.env.local` into the new project locally (prefer newly rotated credentials). Never commit it. `.env.example` documents the expected variables.
3. Use Node.js 22.18+ or a compatible newer LTS. Run `npm ci`, then `npm run dev`.
4. Visit `/dashboard/orders` after staff login; test existing and new orders in a test environment. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
5. If the same error occurs, capture the browser DevTools Console exception and sanitized Network response for `/api/orders?scope=staff` (remove all customer data and secrets).
6. If credentials were previously committed, rotate them and remove them from tracked files/history as appropriate. A new ZIP does not clean an existing remote Git history.
