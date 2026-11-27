# AURA Fashion House — Minimal Commerce (Next.js 16 + MongoDB + Firebase + Cloudinary)

A complete, mobile-first full-stack e-commerce platform for **AURA Fashion House (Bangladesh)** built inside a single **Next.js 16 App Router** TypeScript project.

## Features

- **Storefront (BDT ৳):** Responsive 2-column mobile / 4-column desktop product grid, hover 2nd-image swap, interactive colour swatches & size pills, search with popular search chips, mega menu, URL-persisted filters & sorting, size guide modal, fabric/GSM specs, verified-buyer reviews, wishlist, order tracking, WhatsApp chat & scroll-to-top buttons, mobile bottom nav.
- **Cart & Checkout (Bangladesh Delivery & Payments):**
  - Guest `localStorage` cart merged into MongoDB cart upon sign-in.
  - **Cash on Delivery (COD)**, **bKash**, and **Nagad** (modular `PaymentProcessor` architecture).
  - **Delivery charges:** **৳80 Inside Dhaka**, **৳160 Outside Dhaka** (server-authoritative & editable by staff in Store Settings).
  - Coupons (percent/fixed, min order, expiry, total & per-user limits), idempotency key to prevent duplicate orders.
- **Atomic Inventory & Transactions:**
  - Order creation atomically reserves/decreases variant stock inside a MongoDB transaction (`$gte` guard; zero overselling).
  - Order cancellation (`pending`/`confirmed` for customers; `< delivered` for staff) and payment rejection atomically restore stock **exactly once** (`stockRestored` guard).
  - Delivered orders support wrong-size exchange requests; staff approval swaps variant stock atomically and logs `StockMovement`.
- **Role-Based Dashboards (`user`, `moderator`, `admin`):**
  - **Customer (`/account`):** Order history, timeline, cancel order, printable invoice, address book, wishlist, reviews.
  - **Staff (`/dashboard`):** Recharts sales & order analytics, Product CRUD (Cloudinary multi-image upload, reorder, delete, variants), Categories/Brands, Inventory & Stock Log, Order & bKash/Nagad Payment Verification, Coupons & Banners, Review Moderation, Contact Messages, Store Settings.
  - **Admin Only (`/dashboard/users`):** Role management (`user` / `moderator` / `admin`) with audit log; last remaining admin can never be removed or demoted.

---

## Setup Guide (Where to Find Every Environment Variable)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 1. MongoDB Atlas (`MONGODB_URI`)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free M0 cluster (replica set enabled by default, required for MongoDB transactions).
2. Under **Database Access**, create a database user with Read/Write permissions.
3. Under **Network Access**, allow your server IP (or `0.0.0.0/0` during development).
4. Click **Connect → Drivers** and paste the connection string into `MONGODB_URI`.

### 2. Firebase Auth & Admin SDK
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication → Sign-in method**: turn on **Email/Password** and **Google**.
3. Under **Project Settings → General → Your apps (Web app)**, copy:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Under **Project Settings → Service accounts**, click **Generate new private key** and copy:
   - `FIREBASE_PROJECT_ID` (`project_id`)
   - `FIREBASE_CLIENT_EMAIL` (`client_email`)
   - `FIREBASE_PRIVATE_KEY` (`private_key` — keep `\n` escaped inside quotes)

### 3. Cloudinary (`CLOUDINARY_*`)
1. Sign up at [Cloudinary](https://cloudinary.com/).
2. On the **Programmable Media Dashboard**, copy:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### 4. Bootstrap Initial Admin & Site URL
- `INITIAL_ADMIN_EMAIL`: Set to the email you will sign up with. Once that email is verified in Firebase and you log in, the server promotes that user to `admin` automatically.
- `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` locally, or your production domain (e.g. `https://aurafashion.com.bd`).

---

## Local Development

```bash
npm install
npm run seed      # Seeds categories, sample AURA products, hero banner, coupon AURA10, and ৳80/৳160 delivery settings
npm run dev
```

## Verification Commands

```bash
npm run lint
npm run typecheck
npm run build
node scripts/verify-business-rules.ts
```

## Testing Key Concurrency & Security Scenarios

1. **Concurrent purchase of the last item:** Create a variant with `stock: 1`, send two simultaneous `POST /api/orders` requests with different `idempotencyKey`s — MongoDB transaction `$gte` condition guarantees exactly one succeeds and the second fails cleanly with insufficient stock.
2. **Double cancel:** Call `POST /api/orders/:id/cancel` twice concurrently — the atomic `stockRestored: false -> true` guard ensures stock is restored only once.
3. **Moderator role escalation:** Sign in as a `moderator` and attempt `PATCH /api/admin/users/:id/role` — server returns `403 Forbidden`.
4. **Deployment:** Deploy to Vercel (or Node 20.9+ host), add all `.env.local` variables to your hosting environment, and run `npm run build && npm start`.
