# VERTEX Production Environment & Release Configuration Guide

This document establishes the official production deployment standards, environment separation, build targets, security boundaries, and release checklists for all VERTEX platforms:
1. **VERTEX Customer Android** (`com.vertex.customer`)
2. **VERTEX Customer iOS** (`com.vertex.customer`)
3. **VERTEX Technician Android** (`com.vertex.technician`)
4. **VERTEX Technician iOS** (`com.vertex.technician`)
5. **VERTEX Admin Web** (`VITE_APP_TARGET=admin`)

---

## 1. Environment Separation Matrix

| Configuration Variable | Development | Staging | Production Release |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` | `staging` | `production` |
| `DEMO_LOGIN_ENABLED` | `true` | `false` | `false` |
| `VITE_DEMO_LOGIN_ENABLED`| `true` | `false` | `false` |
| `VITE_API_BASE_URL` | `""` (local proxy) | `https://staging-api.vertexservices.in` | Encrypted HTTPS backend URL* |
| `ALLOWED_ORIGINS` | `*` / local dev port | Staging domain | Production Web Domain(s)* |
| `VITE_APP_TARGET` | `all` | `customer` / `technician` / `admin` | `customer` / `technician` / `admin` |
| `DATABASE_URL` | Local / Dev Supabase | Staging Supabase | Production Supabase (SSL, pooled) |
| Server-Side JWT Secret | Local Dev Secret | Dedicated Staging Secret | High-entropy 256-bit Secret |
| Doorstep OTP Bypass (`4821`) | Allowed | **Blocked (400)** | **Blocked (400)** |
| Simulated OTP (`1234`) | Allowed | **Blocked (401)** | **Blocked (401)** |
| Quick Login / Persona | Allowed | **Blocked (403)** | **Blocked (403)** |

*\*Notice: Production API URL and Production Allowed Origins must be supplied before final release build.*

---

## 2. Server-Only vs. Client/Mobile Variable Separation

### Server-Side Environment Variables (Strictly Private)
- `DATABASE_URL`: PostgreSQL connection string with SSL. Must **never** be exposed to Vite or bundled into mobile assets.
- `JWT_SECRET`: High-entropy secret key used by Express to sign and verify session tokens.
- `PAYMENT_WEBHOOK_SECRET`: Secret key used for Razorpay HMAC-SHA256 signature verification.
- `RAZORPAY_KEY_SECRET`: Secret key for server-side payment capture and refund issuance.
- `FCM_SERVER_KEY` / `APNS_PRIVATE_KEY`: Private keys for dispatching push notifications.
- `ALLOWED_ORIGINS`: Comma-delimited list of authorized web browser origins.
- `PORT`: Server binding port (Default `3000`).
- `DEMO_LOGIN_ENABLED`: Server feature flag strictly disabling demo endpoints in production.

### Public Client-Side / Mobile Variables (Bundled via `VITE_*`)
- `VITE_APP_TARGET`: Target bundle selector (`customer`, `technician`, or `admin`).
- `VITE_DEMO_LOGIN_ENABLED`: Boolean string (`false` in production) to strip demo UI.
- `VITE_API_BASE_URL`: HTTPS API base domain for native mobile network communication.
- `VITE_RAZORPAY_KEY_ID`: Public Razorpay key ID for client checkout initialization.

---

## 3. Platform Architecture & Target Specifics

### A. VERTEX Customer Mobile (Android & iOS)
- **Application ID / Bundle ID:** `com.vertex.customer`
- **Display Name:** `VERTEX` (or `VERTEX Customer` where platform requires distinct label)
- **Build Target:** `VITE_APP_TARGET=customer`
- **Local Storage Preference Group:** `VERTEXCustomerApp` (Backed by Android EncryptedSharedPreferences / iOS Keychain)
- **URL Scheme:** `vertexcustomer://`
- **Permissions:**
  - Camera (`CAMERA` / `NSCameraUsageDescription`) for equipment and issue photos
  - Photos/Storage for uploading invoices, warranty cards, and appliance details
  - Fine/Coarse Location (When in use only for service address verification; background location strictly disabled)
  - Notifications (`POST_NOTIFICATIONS`) for technician dispatch and status tracking
- **Security:** ATS (`NSAllowsArbitraryLoads = false`), Android Network Security Config (`cleartextTrafficPermitted="false"`).

### B. VERTEX Technician Mobile (Android & iOS)
- **Application ID / Bundle ID:** `com.vertex.technician`
- **Display Name:** `VERTEX Partner` (or `VERTEX Technician` where platform requires distinct label)
- **Build Target:** `VITE_APP_TARGET=technician`
- **Local Storage Preference Group:** `VERTEXTechnicianApp` (Backed by Android EncryptedSharedPreferences / iOS Keychain)
- **URL Scheme:** `vertextechnician://`
- **Permissions:**
  - Camera (`CAMERA` / `NSCameraUsageDescription`) for mandatory doorstep job completion proof
  - Photos/Storage for diagnostic reports and checklist evidence
  - Precise Location (`ACCESS_FINE_LOCATION`) for real-time service navigation
  - Background Location (`ACCESS_BACKGROUND_LOCATION`) and Wake Lock (`WAKE_LOCK`) for active duty dispatch tracking
  - Notifications (`POST_NOTIFICATIONS`) for urgent job dispatch alerts
- **Security:** Strict isolation from Customer storage and Keychain groups; cross-technician access prohibited.

### C. VERTEX Admin Web Portal (Web Only)
- **Deployment Format:** Web SPA served by Node/Express production server (`dist/server.cjs`).
- **Build Target:** `VITE_APP_TARGET=admin`
- **Packaging Restriction:** **Do not package Admin Web as a mobile application.** Admin Web is strictly a web application.
- **Authentication & RBAC:** Enforced server-side with role-based access control (`SUPER_ADMIN`, `MANAGER`, `SALES`, `FINANCE`).

---

## 4. Payment Gateway Integration Security

- **Gateway:** Razorpay (Production mode).
- **Currency:** Indian Rupee (`INR`).
- **Client Configuration:** Only `VITE_RAZORPAY_KEY_ID` (e.g. `rzp_live_...`) is provided to frontend.
- **Server Configuration:** `RAZORPAY_KEY_SECRET` remains server-side only.
- **Webhook Endpoint:** `/api/v1/webhooks/razorpay` and `/api/v1/webhooks/payment`
  - **HMAC-SHA256 Signature Verification:** Verified against raw payload using `PAYMENT_WEBHOOK_SECRET`.
  - **Timestamp Freshness:** Rejects requests where timestamp discrepancy exceeds 300 seconds (5 minutes) to protect against replay attacks.
  - **Idempotency Protection:** Event IDs (`eventId`) are deduplicated and tracked to prevent double fulfillment.

---

## 5. Notification Architecture

- **Push Notifications (Mobile):**
  - Android: Firebase Cloud Messaging (FCM) using `google-services.json`.
  - iOS: Apple Push Notification Service (APNs) using Apple Developer `.p8` key with Team ID and Key ID.
- **SMS Gateway:** Transactional SMS provider (e.g., Twilio, Gupshup, Fast2SMS) for doorstep OTP delivery and technician arrival notices.
- **Transactional Email:** SMTP / SendGrid for customer tax invoices and booking confirmations.
- *Notice: Production notification credentials must be registered in the deployment environment.*

---

## 6. File Upload Security & Access Control

- **Endpoint:** `POST /api/v1/uploads` & `GET /api/v1/uploads/:id`
- **Authentication:** Enforced via `authenticateUser` middleware; unauthenticated requests receive `401 Unauthorized`.
- **MIME Whitelist:** `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`.
- **Banned Extensions:** Executable and script formats (`.exe`, `.sh`, `.bat`, `.js`, `.php`, `.html`, etc.) are rejected with `400 Bad Request`.
- **Size Limit:** Enforced maximum of 10MB per file; larger payloads receive `400 Bad Request`.
- **Tenant & Role Isolation:**
  - Customers can only upload under `CUSTOMER_DOCUMENT`, `EQUIPMENT_PHOTO`, `SERVICE_REQUEST`.
  - Technicians can only upload under `JOB_PHOTO`, `DIAGNOSTIC_REPORT`, `CHECKLIST_ATTACHMENT`.
  - Cross-customer access is forbidden (`403 Forbidden`).
  - Cross-technician access is forbidden (`403 Forbidden`). Customer cannot access technician private diagnostics.

---

## 7. Build & Release Commands

### Admin Web Portal (Production Server + Static SPA)
```bash
# Build Admin Web bundle and Node backend bundle
npm run build:admin

# Start Production Server
npm start
```

### Customer Mobile Applications
```bash
# Prepare and sync customer native projects
npm run customer:sync

# Build Android App Bundle (AAB for Google Play Store)
cd android && ./gradlew :app:bundleRelease

# Build Android APK (Direct installation / Testing)
cd android && ./gradlew :app:assembleRelease

# iOS Release Archive (Must run on macOS with Xcode installed)
npm run customer:ios
open ios/App/App.xcworkspace
# In Xcode: Select 'Any iOS Device (arm64)' -> Product -> Archive -> Distribute App -> App Store Connect
```

### Technician Mobile Applications
```bash
# Prepare and sync technician native projects
npm run technician:sync

# Build Android App Bundle (AAB for Google Play Store)
cd android && ./gradlew :app:bundleRelease

# Build Android APK (Direct installation / Fleet deployment)
cd android && ./gradlew :app:assembleRelease

# iOS Release Archive (Must run on macOS with Xcode installed)
npm run technician:ios
open ios/App/App.xcworkspace
# In Xcode: Select 'Any iOS Device (arm64)' -> Product -> Archive -> Distribute App -> App Store Connect
```

---

## 8. Launch Prerequisites & External Assets (Release Blockers)

The following external assets, credentials, and production resources must be provided by the organization before live distribution:

1. **Production Domain & Allowed Origins:**
   - Real production HTTPS domain for backend API (`VITE_API_BASE_URL`).
   - Allowed CORS origins (`ALLOWED_ORIGINS`) configured for the Admin Web production domain.
2. **Google Play Console:**
   - Production Google Play Developer Account.
   - Google Play Console Service Account JSON for automated deployment.
   - Android Release Keystore (`.keystore` / `.jks`) with secure aliases and passwords.
3. **Apple Developer Program:**
   - Paid Apple Developer Program membership.
   - Apple Developer Team ID and App Store Connect credentials.
   - Apple Distribution Certificate & App Store Provisioning Profiles for `com.vertex.customer` and `com.vertex.technician`.
4. **Firebase & APNs Push Infrastructure:**
   - Production `google-services.json` (Android FCM).
   - Production Apple APNs Push Key (`.p8`) with Key ID and Team ID.
5. **Payment Gateway (Razorpay):**
   - Razorpay Live Key ID & Secret (`rzp_live_...`).
   - Razorpay Webhook Secret configured in the merchant dashboard.
6. **SMS & Email Gateways:**
   - Production SMS DLT-approved templates and gateway API token for transactional OTPs.
   - Production transactional email SMTP credentials for invoice delivery.
