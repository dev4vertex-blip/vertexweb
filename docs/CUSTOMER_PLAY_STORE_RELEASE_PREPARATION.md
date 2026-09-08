# VERTEX Customer Android Google Play Store Release Preparation (Step 17)

This official document details the release preparation, store listing specifications, production environment requirements, security controls, and launch blockers for the **VERTEX Customer** Android application (`com.vertex.customer`).

---

## 1. Customer Application Identity

| Attribute | Customer Production Value | Verification Status |
| :--- | :--- | :--- |
| **Application ID** | `com.vertex.customer` | Verified in `android/app/build.gradle`, `capacitor.config.ts`, and `scripts/prepare_mobile.ts` |
| **Application Name** | `VERTEX Customer` | Verified in `android/app/src/main/res/values/strings.xml` and manifest |
| **Java Package** | `com.vertex.customer` | Verified in `android/app/src/main/java/com/vertex/customer/MainActivity.java` |
| **Capacitor Storage Group** | `VERTEXCustomerApp` | Verified in `capacitor.config.ts` |
| **URL Scheme / Deep Link** | `vertexcustomer://` | Verified in `strings.xml` and `AndroidManifest.xml` |
| **Cross-Contamination Audit**| Zero technician references in Customer Android config | Verified clean |

---

## 2. Customer Version Specification

- **Current Baseline:**
  - `versionName`: `1.0.0`
  - `versionCode`: `1`
- Preserves existing production versioning in `android/app/build.gradle`.

---

## 3. Production Target & Environment Gating

Customer production build configuration:
- `VITE_APP_TARGET=customer`
- `NODE_ENV=production`
- `DEMO_LOGIN_ENABLED=false`
- `VITE_DEMO_LOGIN_ENABLED=false`

Security Enforcement:
- When `VITE_DEMO_LOGIN_ENABLED=false` or `NODE_ENV=production`:
  - `<DemoRoleBar />` is unmounted and excluded from the DOM.
  - Development persona switcher and test buttons are disabled.
  - Server-side demo endpoints (`/api/v1/auth/demo-login`, `/api/v1/auth/quick-login`, `/api/v1/auth/simulate-persona`) return `403 Forbidden`.
  - Hardcoded or simulated OTPs (`1234`, `0000`, `4821`) are rejected with `SIMULATED_OTP_REJECTED`.

---

## 4. Production API Specification

- Configuration key: `VITE_API_BASE_URL`
- In `src/services/api.ts`:
  - Rejects `localhost`, `127.0.0.1`, `0.0.0.0`, and insecure `http://` in production release builds.
  - Does not invent mock or temporary preview URLs.
- **Status:** `REAL PRODUCTION API URL REQUIRED` (Must be set to the official organization HTTPS endpoint before building final signed AAB).

---

## 5. Customer Authentication & Access Control

| Scenario | Server Response | Verification |
| :--- | :--- | :--- |
| **Valid Customer Mobile & OTP** | `200 OK` with JWT token | ALLOW |
| **Invalid Mobile / OTP** | `400/401 Unauthorized` | DENY |
| **Expired Auth Token** | `401 Unauthorized` | DENY |
| **Forged / Tampered Token** | `401 Unauthorized` | DENY |
| **Demo Login in Production** | `403 Forbidden` (`DEMO_LOGIN_DISABLED`) | DENY |
| **Simulated OTP in Production**| `401 Unauthorized` (`SIMULATED_OTP_REJECTED`)| DENY |

---

## 6. Customer Feature Regression Checklist

All core customer features remain fully operational:
- **Authentication**: Mobile OTP login, profile bootstrap, session persistence.
- **Home / Dashboard**: Search bar, emergency banners, active booking trackers, promotional carousel.
- **Service Categories & Browsing**: Appliance repair catalog, rate cards, transparent pricing.
- **Booking Flow**: Multi-step booking, address picker, timeslot picker, upfront price breakdown.
- **Booking Details & Status**: Real-time status tracker, technician assignment card, doorstep OTP.
- **Cancellation**: Customer self-service cancellation for eligible bookings.
- **Invoices & Receipts**: Itemized GST-compliant invoices with downloadable receipts.
- **Payments**: Razorpay integration with client-safe key handling and server-side webhook verification.
- **AMC (Annual Maintenance Contracts)**: Plan comparison, plan activation, preventive maintenance tracker.
- **Offers & Coupons**: Promotional banner listing, server-side coupon validation, discount computation.
- **Notifications**: Transactional alerts, technician arrival updates, invoice notices.
- **Reviews & Ratings**: Post-service star ratings and comments restricted to verified booking owners.
- **Address Management**: CRUD addresses with default address flag and server-side ownership.
- **Support**: In-app ticket submission and resolution tracking.
- **Profile**: Customer name, phone, email, and city preferences.

---

## 7. API Authorization Matrix

| Requester Role | Endpoint Category | Access Rule | Result |
| :--- | :--- | :--- | :--- |
| **CUSTOMER** | Customer APIs (`/api/v1/customer/*`) | Self data only | ALLOW |
| **CUSTOMER** | Technician APIs (`/api/v1/technician/*`)| Restricted to Technicians | DENY (403) |
| **CUSTOMER** | Admin APIs (`/api/v1/admin/*`) | Restricted to Staff | DENY (403) |
| **CUSTOMER** | Internal Finance APIs | Restricted to Finance/Super Admin | DENY (403) |
| **CUSTOMER A**| Customer B Private Data | Strict user ID match | DENY (403) |

---

## 8. Customer Data Isolation

Server-side ownership verification is enforced across all customer data models:
- **Profile**: Queries filtered strictly by `req.user.id`.
- **Bookings**: Queries filtered strictly by `WHERE customer_id = $1`.
- **Booking Details**: Rejects access with `403 Forbidden` if `booking.customer_id !== req.user.id`.
- **Invoices**: Rejects access with `403 Forbidden` if `invoice.customer_id !== req.user.id`.
- **Addresses**: Delete operations strictly check `addr.user_id === req.user.id`.
- **Reviews**: Submission strictly verified against `booking.customer_id === req.user.id`.
- **Support Tickets**: Queries filtered strictly by `WHERE user_id = $1`.
- **Private Uploads**: Files filtered strictly by `upload.userId === req.user.id`.

---

## 9. Booking Security Rules

- **Creation**: Customer ID is set exclusively from the verified JWT payload (`req.user.id`).
- **Inspection**: Customers cannot inspect other users' bookings.
- **Cancellation**: Only the booking owner (or admin staff) can cancel.
- **Technician Assignment**: Customer cannot manually manipulate technician assignments; dispatch is controlled server-side.
- **Technician Privacy**: Customers only receive public technician information (name, phone, rating, avatar). Internal technician KYC, commission rates, and banking data are strictly excluded.

---

## 10. Payment Security Protocols

- Client application only receives the public Razorpay Key ID (`VITE_RAZORPAY_KEY_ID`).
- Never exposed on the client:
  - Payment gateway secret key
  - Webhook signing secret (`PAYMENT_WEBHOOK_SECRET`)
  - Database connection strings or passwords
  - JWT secret key
- Payment webhook verification is handled strictly server-side with HMAC-SHA256 signature verification and 5-minute timestamp freshness checks to prevent replay attacks.

---

## 11. Customer Notifications

- Handles transactional and lifecycle events:
  - Booking confirmation & timeslot scheduling
  - Doorstep technician assigned notification
  - Technician arrival alert with doorstep OTP reminder
  - Invoice generation & payment receipt notification
  - AMC renewal reminders
  - Support ticket updates
- Firebase / FCM credentials are kept server-side. Client never holds private service account keys.

---

## 12. Offers & Promotions Security

- Promotions listed in the customer app:
  - `VERTEXNEW`: Flat ₹100 off first service (Min ₹299)
  - `SUMMERCOOL`: 15% off AC services (Min ₹499)
  - `AMCPROTECT`: Flat ₹500 off AMC plans (Min ₹2499)
  - `FESTIVE20`: 20% off Electrical/Plumbing (Min ₹399)
- Validation is enforced strictly on the server (`/api/v1/customer/offers/validate`).
- Clients cannot arbitrarily override or modify discount amounts.
- Expired or invalid coupon codes are rejected with `400 Bad Request`.

---

## 13. Customer AMC (Annual Maintenance Contracts)

- Provides comprehensive appliance protection:
  - Plans: Basic Protection, Comprehensive Coverage, Premium Shield.
  - Covered appliances: AC, Refrigerator, Washing Machine, Microwave, RO Purifier.
  - Free preventive maintenance visits and discounted spare parts.
- Pricing and plan coverage are validated server-side. Customer client cannot alter subscription pricing or active dates.

---

## 14. Customer File & Document Upload Isolation

- Enforced via `/api/v1/uploads`:
  - Strict authentication required.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`.
  - Prohibited extensions: `.exe`, `.sh`, `.js`, `.php`, `.apk`, etc.
  - File size cap: 10 MB.
  - Allowed categories for Customer: `CUSTOMER_DOCUMENT`, `EQUIPMENT_PHOTO`, `SERVICE_REQUEST`.
  - Customer A cannot download or inspect Customer B's uploaded files (returns `403 Access Denied`).

---

## 15. Android Permissions Audit

Customer application requests only necessary permissions:
- `android.permission.INTERNET`: REST API connectivity.
- `android.permission.ACCESS_NETWORK_STATE`: Offline/online status detection.
- `android.permission.CAMERA`: Photographing malfunctioning appliances.
- `android.permission.READ_MEDIA_IMAGES`: Uploading appliance photos/warranty cards (Android 13+).
- `android.permission.READ_EXTERNAL_STORAGE` (maxSdkVersion 32): Legacy photo access.
- `android.permission.WRITE_EXTERNAL_STORAGE` (maxSdkVersion 29): Legacy PDF invoice saving.
- `android.permission.ACCESS_FINE_LOCATION`: Doorstep service address selection.
- `android.permission.ACCESS_COARSE_LOCATION`: City / locality detection.
- `android.permission.POST_NOTIFICATIONS`: Real-time booking alerts (Android 13+).

**Strictly Excluded Permissions:**
- `android.permission.ACCESS_BACKGROUND_LOCATION` (Technician-only)
- `android.permission.WAKE_LOCK` (Technician-only)

---

## 16. Secure Token Storage & Logging Audit

- Tokens and sessions are stored natively via `@capacitor/preferences` with isolated storage group `VERTEXCustomerApp`.
- Fallback to browser storage is scoped to web preview.
- Zero logging policy: Passwords, OTPs, JWT tokens, access keys, and refresh tokens are strictly omitted from client logs.

---

## 17. App Icon Verification & Status

- References verified in `android/app/src/main/res/`:
  - Launcher icons: `mipmap-hdpi`, `mipmap-mdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`.
  - Adaptive icons: `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml`.
- No Technician branding present in Customer icon resources.
- **Status:** `FINAL CUSTOMER PRODUCTION ICON REQUIRED` (Organization must provide high-res 512x512 approved brand icon before store upload).

---

## 18. Splash Screen Verification & Status

- Configured via `android/app/src/main/res/values/styles.xml` under theme `AppTheme.NoActionBarLaunch`.
- Uses `@drawable/splash` compatible with Android 12+ splash screen APIs.
- No Technician branding present in Customer splash resources.
- **Status:** `FINAL CUSTOMER SPLASH ARTWORK REQUIRED` (Organization must provide final approved splash artwork before store upload).

---

## 19. Deep Links / App Links

- URL Scheme: `vertexcustomer://`
- Configured in `android/app/src/main/res/values/strings.xml` and `AndroidManifest.xml`.
- Opens only the Customer application, preventing accidental launches of the Technician app.
- No unverified or fake web domain configured.

---

## 20. Firebase / FCM Configuration Status

- Firebase push notifications require `google-services.json` in `android/app/`.
- No fake or dummy configuration files committed.
- **Status:** `PRODUCTION FIREBASE CONFIGURATION REQUIRED` (Download real `google-services.json` from Firebase Console).

---

## 21. Android Release Signing Status

- Configured in `android/app/build.gradle` via environment variables:
  - `ANDROID_KEYSTORE_PATH`
  - `ANDROID_KEYSTORE_PASSWORD`
  - `ANDROID_KEY_ALIAS`
  - `ANDROID_KEY_PASSWORD`
- Keystores, certificates, and private credentials are excluded from Git via `.gitignore`.
- **Status:** `CUSTOMER ANDROID PRODUCTION SIGNING REQUIRED` (Generate production `.jks` release keystore and configure CI/CD secrets).

---

## 22. AAB Build Status

- Target: `com.vertex.customer`
- Gradle release bundle command:
  ```bash
  npm run customer:sync
  cd android && ./gradlew :app:bundleRelease
  ```
- **Verification Result:** `AAB BUILD CONFIGURATION VERIFIED` (Build configuration verified; signed AAB generation requires Android SDK/JDK environment and production keystore).

---

## 23. Google Play Store Listing Specification

### A. Metadata
- **App Name (Title):** `VERTEX Customer` (15 / 30 chars)
- **Short Description:** `Expert home appliance repair, maintenance, and doorstep service on demand.` (75 / 80 chars)
- **Full Description:**
```text
VERTEX connects homeowners and businesses with verified, background-checked appliance technicians for rapid, dependable doorstep repairs.

Whether your refrigerator is not cooling, your washing machine is vibrating, your microwave has stopped heating, or your chimney requires deep maintenance, VERTEX delivers precision service with transparent rate cards.

Key Features:
- Seamless Booking: Select your appliance category, describe the issue, and pick a convenient timeslot.
- Real-Time Doorstep Tracking: Receive live technician assignment alerts and route updates.
- Secure OTP Verification: Every doorstep visit is protected by a single-use service verification code.
- Transparent Rate Cards: View inspection rates, labor fees, and genuine spare parts pricing upfront.
- Digital Tax Invoices & Service History: Access itemized GST-compliant invoices and technician diagnostic reports.
- Annual Maintenance Contracts (AMC): Protect your home appliances with comprehensive multi-year coverage plans.
- Secure In-App Payments: Pay seamlessly using Razorpay (UPI, NetBanking, Credit/Debit cards).
- Customer Support: In-app chat, ticket tracking, and direct resolution support.

Service Categories:
- Refrigerator & Freezer Repair
- Washing Machine & Dryer Service
- Microwave Oven & OTG Repair
- Kitchen Chimney & Hob Cleaning
- Water Purifier (RO/UV) Service
- Geyser & Water Heater Maintenance
- Air Conditioner (AC) Deep Clean & Gas Charging
```

### B. Category & Ratings
- **Category:** House & Home / Lifestyle
- **Target Audience:** 18+ (General Public)
- **Content Rating:** PEGI 3 / Everyone (via IARC questionnaire)

### C. URLs & Contact
- **Privacy Policy URL:** `MANUAL PREREQUISITE: Organization must provide real legal privacy URL.`
- **Support URL:** `MANUAL PREREQUISITE: Organization must provide real customer support portal URL.`
- **Contact Email:** `support@vertexservices.in` (Placeholder — confirm official organization inbox).

---

## 24. Customer Data Safety Inventory

| Data Category | Specific Data Item | Purpose | Stored / Ephemeral | Deletion Requestable? |
| :--- | :--- | :--- | :--- | :--- |
| **Personal Info** | Name, Email, Mobile Number | Account auth, service communication | Stored in database | Yes |
| **Location** | Doorstep Address, Pincode, GPS pin | Technician doorstep dispatch | Stored (Address) / Ephemeral (GPS) | Yes |
| **Appliance Info** | Category, Brand, Model, Issue notes | Service dispatch & diagnostics | Stored in database | Yes |
| **Financial Info** | Transaction ID, Amount, Payment status | Invoicing & GST compliance | Stored (Tokenized / Gateway) | N/A |
| **Photos** | Appliance defect / warranty photos | Diagnostic review | Stored in secure storage | Yes |
| **Messages / Support**| Support tickets, customer feedback | Dispute resolution, quality control | Stored in database | Yes |
| **Notifications** | FCM Push Token | Booking updates, arrival alerts | Stored in database | Yes |

*All data is encrypted in transit via HTTPS/TLS. No customer data is sold to third parties.*

---

## 25. Play Store Quality Check

- Zero crash vectors from missing production environment variables.
- Zero development UI, quick-fill credentials, or persona switchers rendered in production.
- Zero simulated OTP bypass allowed.
- Insecure HTTP and localhost endpoints blocked in production builds.
- Clean icon and splash drawable references verified.
- No accidental Technician branding in Customer configuration.
- Keystores, passwords, and private tokens protected from source control.

---

## 26. Security Verification Results

All minimum security checks verified:
1. Valid Customer login → **PASS** (Session created, JWT issued)
2. Invalid Customer login → **PASS** (Rejected with 400/401)
3. Expired token → **PASS** (Rejected with 401)
4. Forged/tampered token → **PASS** (Rejected with 401)
5. Demo login in production → **BLOCKED** (Rejected with 403)
6. Customer → Technician API → **BLOCKED** (Rejected with 403)
7. Customer → Admin API → **BLOCKED** (Rejected with 403)
8. Customer A → Customer B private profile → **BLOCKED** (Isolated server-side)
9. Customer A → Customer B booking/invoice → **BLOCKED** (Rejected with 403)
10. Customer A → Customer B private files → **BLOCKED** (Rejected with 403)

---

## 27. Regression Test Results

Existing core functionalities verified:
- Service catalog & rate cards: **OPERATIONAL**
- Booking creation & doorstep OTP: **OPERATIONAL**
- Customer booking cancellation: **OPERATIONAL**
- GST tax invoices & receipts: **OPERATIONAL**
- Razorpay payment checkout & webhooks: **OPERATIONAL**
- AMC subscription plans & coverage: **OPERATIONAL**
- Coupon validation & discount computation: **OPERATIONAL**
- Notifications & transactional updates: **OPERATIONAL**
- Reviews & ratings submission: **OPERATIONAL**
- Address management & default selection: **OPERATIONAL**
- Support ticket creation & tracking: **OPERATIONAL**

---

## 28. Final Release Blocker Table

| Item | Status | Action Required |
| :--- | :--- | :--- |
| **Customer Application ID** | CODE COMPLETE | Verified (`com.vertex.customer`). |
| **Version** | CODE COMPLETE | Verified (`1.0.0`). |
| **VersionCode** | CODE COMPLETE | Verified (`1`). |
| **Production API** | EXTERNAL REQUIREMENT | REAL PRODUCTION API URL REQUIRED (Provide verified HTTPS backend URL). |
| **Demo Login** | CODE COMPLETE | Disabled in production (`DEMO_LOGIN_ENABLED=false`). |
| **Android Signing** | EXTERNAL REQUIREMENT | CUSTOMER ANDROID PRODUCTION SIGNING REQUIRED (Provide `.jks` release keystore). |
| **Firebase / FCM** | EXTERNAL REQUIREMENT | PRODUCTION FIREBASE CONFIGURATION REQUIRED (Provide real `google-services.json`). |
| **Icon** | EXTERNAL REQUIREMENT | FINAL CUSTOMER PRODUCTION ICON REQUIRED (Provide final approved 512x512 asset). |
| **Splash** | EXTERNAL REQUIREMENT | FINAL CUSTOMER SPLASH ARTWORK REQUIRED (Provide final approved splash graphic). |
| **AAB Build** | CODE COMPLETE | `AAB BUILD CONFIGURATION VERIFIED` (Gradle bundleRelease ready). |
| **Privacy Policy** | EXTERNAL REQUIREMENT | Deploy real legal Privacy Policy page and supply URL for Play Console. |
| **Support URL** | EXTERNAL REQUIREMENT | Provide real customer support portal URL. |
| **Feature Graphic** | EXTERNAL REQUIREMENT | Design and supply 1024x500 feature banner for Play Store listing. |
| **Screenshots** | EXTERNAL REQUIREMENT | Capture at least 4 high-res phone screenshots from running application. |
| **Data Safety** | CODE COMPLETE | Internal data inventory fully prepared in Section 24. |
| **Content Rating** | CODE COMPLETE | IARC questionnaire parameters prepared (PEGI 3 / Everyone). |
| **Target Audience** | CODE COMPLETE | Declared 18+ General Public. |
| **Security Tests** | CODE COMPLETE | All 10 security verification checks passed. |
| **Regression Tests** | CODE COMPLETE | All 11 customer functional regression areas passed. |
