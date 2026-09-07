# VERTEX Google Play Console Preparation & Release Guide

This document establishes the official Google Play Console deployment specifications, store listing metadata, Data Safety questionnaire preparation, and launch prerequisites for the two separate VERTEX Android applications:
1. **VERTEX Customer** (`com.vertex.customer`)
2. **VERTEX Technician** (`com.vertex.technician`)

---

## 1. Application Separation & Identification

| Field | VERTEX Customer | VERTEX Technician |
| :--- | :--- | :--- |
| **App Title** | `VERTEX Customer` (or `VERTEX`) | `VERTEX Technician` (or `VERTEX Partner`) |
| **Package Name / Application ID** | `com.vertex.customer` | `com.vertex.technician` |
| **Target Build Flag** | `VITE_APP_TARGET=customer` | `VITE_APP_TARGET=technician` |
| **Capacitor Storage Group** | `VERTEXCustomerApp` | `VERTEXTechnicianApp` |
| **Custom URL Scheme** | `vertexcustomer://` | `vertextechnician://` |
| **App Category** | House & Home / Lifestyle | Productivity / Business |
| **Target Audience** | General Public (18+) | Authorized Service Professionals / Technicians (18+) |
| **Content Rating** | PEGI 3 / Everyone | PEGI 3 / Everyone |

---

## 2. Versioning Specification

- **Current Production Initial Baseline:**
  - `versionName`: `1.0.0`
  - `versionCode`: `1`
- Both applications support independently managed semantic versioning and incremental build codes via `scripts/prepare_mobile.ts` (e.g. `--version-name=1.0.1 --version-code=2`).

---

## 3. Store Listing Metadata

### A. VERTEX Customer (`com.vertex.customer`)

- **App Name (Title):** `VERTEX Customer` (15 / 30 characters)
- **Short Description:** `Expert home appliance repair, maintenance, and doorstep service on demand.` (75 / 80 characters)
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

- **Graphic Assets Requirements:**
  - **App Icon:** 512 x 512 px, 32-bit PNG, max 1024 KB.
  - **Feature Graphic:** 1024 x 500 px, JPG or 24-bit PNG (no alpha), max 15 MB.
  - **Phone Screenshots:** Minimum 4 screenshots (16:9 or 18:9 aspect ratio, min 1080px on shortest side) showing:
    1. Service Catalog & Search
    2. Timeslot & Address Selection
    3. Active Job Doorstep Tracking with OTP
    4. Tax Invoice & AMC Management
  - **7-inch & 10-inch Tablet Screenshots:** Recommended for tablet visibility.

- **Store Contact & Privacy:**
  - **Privacy Policy URL:** *MANUAL PREREQUISITE: Organization must provide real legal privacy URL before publishing.*
  - **Support URL:** *MANUAL PREREQUISITE: Organization must provide real customer support portal URL.*
  - **Support Email:** `support@vertexservices.in` (Placeholder — confirm official organization inbox).

---

### B. VERTEX Technician (`com.vertex.technician`)

- **App Name (Title):** `VERTEX Technician` (17 / 30 characters)
- **Short Description:** `Professional partner application for verified VERTEX appliance technicians.` (76 / 80 characters)
- **Full Description:**
```text
VERTEX Technician is the dedicated mobile work platform for certified appliance repair professionals partner-registered with the VERTEX network.

Manage your service appointments, navigate to customer doorsteps, log diagnostic findings, verify service completion with OTP, and track your daily payouts in real time.

Key Features:
- On-Duty / Off-Duty Toggle: Control your availability with a single tap.
- Smart Job Dispatch: Receive immediate notifications for service requests in your designated coverage zone.
- Doorstep Navigation: Integrated turn-by-turn routing to customer locations.
- Diagnostic Checklist: Comprehensive component testing workflow for all major appliance types.
- Spare Parts Requisition: Select genuine OEM parts directly from the inventory catalog.
- Secure Doorstep OTP: Complete jobs safely by verifying the customer's secure verification code.
- Job Completion Proof: Capture before-and-after equipment photos and digital customer sign-offs.
- Earnings & Performance: View daily job tallies, commissions, ratings, and incentive milestones.

Notice: Access to this application is strictly restricted to authorized, background-verified VERTEX technicians. New partners can contact partner onboarding at VERTEX headquarters.
```

- **Graphic Assets Requirements:**
  - **App Icon:** 512 x 512 px, 32-bit PNG, max 1024 KB (Technician branding).
  - **Feature Graphic:** 1024 x 500 px, JPG or 24-bit PNG, max 15 MB.
  - **Phone Screenshots:** Minimum 4 screenshots showing:
    1. Assigned Jobs List & Duty Switch
    2. Job Detail & Customer Route
    3. Diagnostic Checklist & Spare Parts Requisition
    4. Doorstep OTP Completion & Photographic Proof

- **Store Contact & Privacy:**
  - **Privacy Policy URL:** *MANUAL PREREQUISITE: Organization must provide real legal privacy URL before publishing.*
  - **Support URL:** *MANUAL PREREQUISITE: Partner support desk URL required.*
  - **Support Email:** `partner-support@vertexservices.in` (Placeholder — confirm official inbox).

---

## 4. Data Safety Questionnaire Inventory

Based strictly on the verified application codebase, the following data types are collected and used:

### A. VERTEX Customer App (`com.vertex.customer`)

| Data Type | Collected? | Shared? | Purpose | Ephemeral / Stored | User Can Request Deletion? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Name** | Yes | No | Account management, service fulfillment | Stored in database | Yes |
| **Phone Number** | Yes | No | Account authentication (OTP), technician communication | Stored in database | Yes |
| **Email Address** | Yes | No | Account management, tax invoice delivery | Stored in database | Yes |
| **Physical Address** | Yes | No (sent to assigned technician only) | Doorstep service delivery | Stored in database | Yes |
| **Approximate / Precise Location** | Yes | No | Address pin verification at booking time | Ephemeral (used at checkout) | Yes |
| **Purchase History / Invoices** | Yes | No | Service record, billing, tax compliance | Stored in database | Yes |
| **Payment Info** | Yes | Processed by Razorpay | Payment processing (tokenized, no raw card numbers stored) | Processed by gateway | N/A |
| **Photos / Images** | Yes (Optional) | No | User-uploaded appliance defect photos | Stored securely | Yes |
| **App Interactions / Crash Logs** | Yes | No | Service analytics, bug fixing | Stored (sanitized) | Yes |

*Note: All data is encrypted in transit using HTTPS (TLS 1.3). No data is sold to third parties.*

---

### B. VERTEX Technician App (`com.vertex.technician`)

| Data Type | Collected? | Shared? | Purpose | Ephemeral / Stored | User Can Request Deletion? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Name & Partner ID** | Yes | No | Partner identity, customer dispatch card | Stored in database | Yes |
| **Phone Number** | Yes | No | Dispatch coordination, authentication | Stored in database | Yes |
| **Precise Location** | Yes | Shared with customer when job is active | Real-time doorstep ETA & route navigation | Ephemeral / On-duty tracking | Yes |
| **Background Location** | Yes | No | Fleet dispatch optimization during on-duty hours | Active shifts only | Yes |
| **Job Photos / Evidence** | Yes | Shared with customer & admin | Quality assurance, warranty proof | Stored in database | Yes |
| **Diagnostic Reports** | Yes | Shared with admin & customer invoice | Service records, warranty validation | Stored in database | Yes |
| **Financial / Payout Info** | Yes | No | Partner compensation & incentive payouts | Stored in database | Yes |

---

## 5. Android Permissions Audit

### Customer Application (`com.vertex.customer`)
- `android.permission.INTERNET`: Required for REST API communication.
- `android.permission.ACCESS_NETWORK_STATE`: Required for offline state detection.
- `android.permission.CAMERA`: Required for taking photos of damaged appliances during booking.
- `android.permission.READ_MEDIA_IMAGES`: Required for uploading appliance photos/warranty cards (Android 13+ scoped media).
- `android.permission.ACCESS_FINE_LOCATION`: Required for selecting doorstep service delivery address.
- `android.permission.ACCESS_COARSE_LOCATION`: Required for neighborhood selection.
- `android.permission.POST_NOTIFICATIONS`: Required for booking confirmations, technician arrival alerts, and invoice alerts (Android 13+).
- **Explicitly Excluded:** `ACCESS_BACKGROUND_LOCATION` is **STRICTLY EXCLUDED** from the Customer application.

### Technician Application (`com.vertex.technician`)
- `android.permission.INTERNET`: Required for REST API communication.
- `android.permission.ACCESS_NETWORK_STATE`: Required for connectivity detection.
- `android.permission.CAMERA`: Required for mandatory doorstep job completion evidence.
- `android.permission.READ_MEDIA_IMAGES`: Required for attaching diagnostic photos.
- `android.permission.ACCESS_FINE_LOCATION`: Required for navigation to customer doorstep.
- `android.permission.ACCESS_COARSE_LOCATION`: Required for service zone assignment.
- `android.permission.ACCESS_BACKGROUND_LOCATION`: Required for continuous ETA updates while technician travels to doorstep.
- `android.permission.WAKE_LOCK`: Required to maintain connectivity during active on-duty travel.
- `android.permission.POST_NOTIFICATIONS`: Required for immediate job dispatch broadcasts.

---

## 6. Android App Bundle (AAB) & Gradle Release Commands

The Android project is pre-configured with Gradle to generate Google Play App Bundles (`.aab`) and standalone test APKs (`.apk`).

### Customer App
```bash
# 1. Sync Customer bundle
npm run customer:sync

# 2. Build Release AAB (Android App Bundle for Play Store)
cd android && ./gradlew :app:bundleRelease

# 3. Build Release APK (For QA / device testing)
cd android && ./gradlew :app:assembleRelease
```

### Technician App
```bash
# 1. Sync Technician bundle
npm run technician:sync

# 2. Build Release AAB (Android App Bundle for Play Store)
cd android && ./gradlew :app:bundleRelease

# 3. Build Release APK (For QA / field fleet testing)
cd android && ./gradlew :app:assembleRelease
```

---

## 7. Android Release Signing Configuration

The Gradle build looks up release signing credentials via system environment variables:
- `ANDROID_KEYSTORE_PATH` (or `KEYSTORE_PATH`)
- `ANDROID_KEYSTORE_PASSWORD` (or `KEYSTORE_PASSWORD`)
- `ANDROID_KEY_ALIAS` (or `KEY_ALIAS`)
- `ANDROID_KEY_PASSWORD` (or `KEY_PASSWORD`)

If these environment variables are not set or the keystore file does not exist, Gradle cleanly produces an **unsigned** release bundle (`app-release-unsigned.aab`). 

**Status:** `BUILD CONFIGURATION READY` (Unsigned release builds verified).
**Prerequisite:** `ANDROID PRODUCTION SIGNING REQUIRED` (Production release keystore must be supplied before store upload).

---

## 8. Network Security & Production HTTPS

- `android/app/src/main/res/xml/network_security_config.xml` enforces:
  ```xml
  <network-security-config>
      <base-config cleartextTrafficPermitted="false">
          <trust-anchors>
              <certificates src="system" />
          </trust-anchors>
      </base-config>
  </network-security-config>
  ```
- All cleartext HTTP is blocked.
- Production API requests use TLS 1.2 / 1.3.
- In `src/services/api.ts`, `getApiBaseUrl()` strictly rejects localhost, loopback IPs, and HTTP in production builds.

---

## 9. Google Play Console Release Blockers Checklist

| Item | Status | Action Required |
| :--- | :--- | :--- |
| **Google Play Developer Account** | ❌ PENDING | Register and verify organization account on Google Play Console. |
| **Production Application IDs** | ✅ VERIFIED | Customer: `com.vertex.customer`, Technician: `com.vertex.technician`. |
| **Android Signing Keystores** | ❌ PENDING | Generate production `.jks` release keystore and configure CI/CD secrets. |
| **Production API URL** | ❌ PENDING | REAL PRODUCTION API URL REQUIRED (Provide verified HTTPS backend endpoint). |
| **Firebase FCM Configuration** | ❌ PENDING | PRODUCTION FIREBASE CONFIGURATION REQUIRED (Download real `google-services.json`). |
| **Privacy Policy URL** | ❌ PENDING | Deploy real legal Privacy Policy page and provide URL for Play Console. |
| **Support URL / Email** | ❌ PENDING | Deploy support portal or configure official customer support email. |
| **App Icons (512x512 PNG)** | ⚠️ PLACEHOLDER READY | FINAL PRODUCTION ICON ASSET REQUIRED (Generate final polished brand icons). |
| **Feature Graphics (1024x500)**| ❌ PENDING | Create 1024x500 marketing feature banner for each application. |
| **Phone Screenshots (Min 4)** | ❌ PENDING | Capture high-resolution screenshots of key user journeys on device. |
| **Data Safety Questionnaire** | ✅ DOCUMENTED | Inventory prepared in Section 4; complete form in Play Console. |
| **Content Rating (IARC)** | ✅ PREPARED | Complete IARC questionnaire in Play Console (PEGI 3 / Everyone). |
| **Target Audience** | ✅ PREPARED | Declare 18+ target audience in Play Console for both apps. |
| **App Categories** | ✅ PREPARED | Customer: House & Home; Technician: Productivity. |
| **Production AAB Generation** | ✅ VERIFIED | `bundleRelease` build configuration validated. |
| **Final Device Testing** | ❌ PENDING | Conduct end-to-end device testing on release candidate APKs. |
