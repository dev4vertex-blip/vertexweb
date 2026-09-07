# VERTEX iOS Applications — Apple App Store Release Readiness Guide

This document establishes the official Apple App Store release preparation, security, configuration, and compliance requirements for the VERTEX mobile application suite:
1. **VERTEX Customer** (`com.vertex.customer`)
2. **VERTEX Technician** (`com.vertex.technician`)

---

## 1. Application Identity & Separation

The VERTEX Customer and VERTEX Technician applications are strictly isolated entities across all layers of the project:

| Attribute | VERTEX Customer | VERTEX Technician | Isolation Guarantee |
| :--- | :--- | :--- | :--- |
| **Bundle Identifier** | `com.vertex.customer` | `com.vertex.technician` | Completely distinct in `project.pbxproj`, `Info.plist`, and `capacitor.config.ts` |
| **Display Name** | `VERTEX Customer` | `VERTEX Technician` | Independent `CFBundleDisplayName` |
| **Marketing Version** | `1.0.0` | `1.0.0` | Independently maintainable via `--version-name` |
| **Build Number** | `1` | `1` | Independently maintainable via `--version-code` |
| **Custom URL Scheme** | `vertexcustomer://` | `vertextechnician://` | Separate `CFBundleURLSchemes`; deep links cannot cross-trigger |
| **Preferences Group** | `VERTEXCustomerApp` | `VERTEXTechnicianApp` | Separate Keychain / UserDefaults storage domains |
| **Build Target** | `VITE_APP_TARGET=customer` | `VITE_APP_TARGET=technician` | Compiles dedicated UI roots; suppresses other app code |

---

## 2. Apple Signing & Certificates Architecture

### 2.1 Developer Requirements
- Active **Apple Developer Program** organization account.
- Two distinct App IDs registered in Apple Developer Member Center:
  - `com.vertex.customer`
  - `com.vertex.technician`
- Distribution Certificates:
  - **Apple Distribution Certificate** (`.cer` / `.p12`) for production App Store releases.
  - **Apple Development Certificate** for internal development and team testing.
- Provisioning Profiles:
  - App Store Distribution Provisioning Profile for `com.vertex.customer`.
  - App Store Distribution Provisioning Profile for `com.vertex.technician`.

### 2.2 Signing Security Policy
- **ZERO PRIVATE KEYS IN REPOSITORY:** Keystores, `.p12` certificates, private keys, and provisioning profiles (`.mobileprovision`) must NEVER be committed to version control.
- Git excludes `*.p12`, `*.cer`, `*.mobileprovision`, and `*.keystore` via `.gitignore`.
- CI/CD pipelines (e.g. Fastlane Match, GitHub Actions, Xcode Cloud) must inject credentials securely via encrypted repository secrets or hardware security modules (HSMs).

---

## 3. Entitlements & APNs Push Notification Architecture

### 3.1 Entitlements (`App.entitlements`)
The application defines minimal, justified entitlements:
- `aps-environment`: `development` (automatically promoted to `production` during App Store distribution archiving).
- Zero unnecessary entitlements: no background location, no callkit, no CarPlay, and no arbitrary background execution modes.

### 3.2 Apple Push Notification service (APNs)
- **Customer Notifications:**
  - Booking confirmation & real-time slot scheduling
  - Technician allocation & "En Route" live tracking alerts
  - Service completion & digital invoice availability
  - AMC renewal reminders & scheduled maintenance notices
  - Customer support ticket responses
- **Technician Notifications:**
  - New job dispatch & priority escalation alerts
  - Job schedule alterations or customer cancellation notifications
  - Customer arrival notifications & doorstep OTP verification alerts
  - Shift reminders and daily operational updates
- **Credentials:**
  - Dedicated APNs Authentication Key (`.p8`) registered under the Apple Developer account.
  - APNs Key ID and Team ID configured within the production backend push notification service.
  - No dummy, mock, or fake APNs keys committed to source.

---

## 4. App Transport Security (ATS) & Network Enforcements

### 4.1 ATS Compliance
- `Info.plist` enforces strict App Transport Security:
  ```xml
  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSAllowsArbitraryLoads</key>
      <false/>
  </dict>
  ```
- Cleartext HTTP traffic is rejected by the OS.
- All network communications must use TLS 1.3 or TLS 1.2 with secure cipher suites.

### 4.2 API Client Production Policy
- `src/services/api.ts` enforces `getApiBaseUrl()` security:
  - Rejects `localhost` and `127.0.0.1` in production.
  - Rejects insecure `http://` endpoints in production.
  - Requires explicit `VITE_API_BASE_URL` with an encrypted `https://` domain.

---

## 5. Native Token Storage & Keychain Security

- Native token persistence is managed by `@capacitor/preferences` with Keychain backing on iOS.
- Tokens, JWTs, refresh tokens, OTPs, and passwords are never logged to `console.log`, crash logs, or system telemetry.
- Storage containers are isolated by app target (`VERTEXCustomerApp` vs `VERTEXTechnicianApp`), preventing token leakage between apps if installed on the same device.
- All session caches are purged upon explicit logout or authentication failure.

---

## 6. Permissions & Usage Descriptions

Only permissions strictly necessary for operational functionality are declared in `Info.plist`:

| Permission Key | Purpose / Justification String | Requirement Level |
| :--- | :--- | :--- |
| `NSCameraUsageDescription` | "VERTEX requires camera access to capture equipment inspection and service verification photos." | When photo evidence is enabled |
| `NSPhotoLibraryUsageDescription` | "VERTEX requires photo library access to upload equipment documentation and service verification images." | When photo upload is enabled |
| `NSLocationWhenInUseUsageDescription` | "VERTEX uses your location while using the app to accurately locate service addresses and dispatch nearby technicians." | Minimum required location |

- **Background Location:** NOT declared. Continuous background location tracking is strictly avoided to preserve battery life and respect user privacy.

---

## 7. App Store Privacy Nutrition Labels (Data Inventory)

Before submitting applications in App Store Connect, Apple requires completing the App Privacy questionnaire. The following data inventory represents all collected data categories:

### 7.1 VERTEX Customer
- **Contact Info:** Name, Email Address, Phone Number (used for account management, service updates, and communication).
- **Location:** Coarse / Precise Location when in use (used for service address selection and technician dispatch).
- **Identifiers:** User ID, Device ID (used for app functionality and push notification routing).
- **Purchases & Invoices:** Transaction records, service booking items, invoice amounts (used for order fulfillment and customer accounting; no raw credit card numbers stored on device).
- **Usage Data:** Service interaction history (used for app functionality and operational analytics).

### 7.2 VERTEX Technician
- **Contact Info:** Name, Technician ID, Email Address, Phone Number (used for staff authentication and dispatch dispatching).
- **Location:** Coarse / Precise Location when in use (used for route navigation to assigned job sites).
- **User Content:** Equipment service photos / inspection reports (used for quality assurance and job verification).
- **Identifiers:** Staff ID, Device ID (used for authentication and job allocation).
- **Diagnostics:** Crash logs and performance diagnostics (used for app stability).

*Note: All data is linked to user identities for app functionality. No data is sold or used for third-party cross-app tracking.*

---

## 8. Build, Archive & Release Workflow (macOS / Xcode Required)

In production release environments running on macOS with Xcode:

1. **Prepare Target Web Bundle & iOS Sync:**
   ```bash
   # For Customer iOS:
   npm run customer:ios

   # For Technician iOS:
   npm run technician:ios
   ```

2. **Open Workspace in Xcode:**
   ```bash
   npx cap open ios
   ```

3. **Verify Signing in Xcode:**
   - Select the `App` target -> **Signing & Capabilities**.
   - Select your registered **Apple Developer Team**.
   - Verify Bundle Identifier matches `com.vertex.customer` or `com.vertex.technician`.
   - Verify `App.entitlements` is bound.

4. **Archive Build:**
   ```bash
   # CLI Archive Command Example:
   xcodebuild -workspace ios/App/App.xcworkspace \
              -scheme App \
              -configuration Release \
              -destination 'generic/platform=iOS' \
              -archivePath build/VERTEXCustomer.xcarchive \
              archive
   ```

5. **Export & Upload:**
   - Use Xcode Organizer or `xcodebuild -exportArchive` with an App Store export options plist.
   - Upload `.ipa` to App Store Connect via Xcode, Transporter, or Fastlane.
