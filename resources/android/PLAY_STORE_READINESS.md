# VERTEX Android — Google Play Store & Play App Signing Readiness Guide

## 1. Overview
This document outlines the release engineering and signing architecture for the two independent VERTEX Android applications:
- **VERTEX Customer App** (`com.vertex.customer`)
- **VERTEX Technician App** (`com.vertex.technician`)

Both applications are configured to produce **Android App Bundles (.aab)** for distribution via the Google Play Store, utilizing **Google Play App Signing**.

---

## 2. Release Signing Architecture & Requirements

### A. Google Play App Signing Workflow
Google Play requires new applications to be published as Android App Bundles (`.aab`). With Google Play App Signing:
1. **Google manages the app signing key**: Google secures the master key used to sign the final device-specific APKs delivered to end users.
2. **Developer generates an Upload Key**: You sign the `.aab` file with an **Upload Keystore** before uploading it to the Google Play Console.
3. Google verifies the upload signature and re-signs the distribution APKs with the master app signing key.

### B. Upload Keystore Generation (Manual / Operator Step)
The operator or release engineer creates independent keystores for Customer and Technician (or a shared upload key with distinct aliases):
```bash
# Example command to generate upload key (run locally on secure machine, DO NOT commit):
keytool -genkey -v -keystore vertex-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias vertex-upload
```
*CRITICAL: Never generate or store keystores in public or unencrypted repositories.*

### C. Keystore Backup Requirement
- If an upload key is lost, Google Play Console account owners can request a reset from Google Play Support, but keeping secure backups prevents release delays.
- Keystores should be archived in an enterprise secret manager (e.g. Google Secret Manager, HashiCorp Vault, AWS Secrets Manager) or an encrypted offline backup.
- Maintain separate records for:
  - Keystore binary file
  - Keystore password
  - Key alias
  - Key password

### D. CI/CD Environment Variable Specification
In your CI/CD pipeline (e.g. GitHub Actions, Cloud Build, GitLab CI), configure these non-code secrets:
- `ANDROID_KEYSTORE_PATH` (or `KEYSTORE_PATH`): Filepath to the decrypted keystore
- `ANDROID_KEYSTORE_PASSWORD` (or `KEYSTORE_PASSWORD`): Keystore password
- `ANDROID_KEY_ALIAS` (or `KEY_ALIAS`): Key alias name
- `ANDROID_KEY_PASSWORD` (or `KEY_PASSWORD`): Key password

The Gradle build configuration in `android/app/build.gradle` automatically binds to these environment variables dynamically:
```groovy
signingConfigs {
    release {
        def keystorePath = System.getenv("ANDROID_KEYSTORE_PATH") ?: System.getenv("KEYSTORE_PATH")
        if (keystorePath != null && file(keystorePath).exists()) {
            storeFile file(keystorePath)
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: System.getenv("KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("KEY_PASSWORD")
        }
    }
}
```
If these variables are unset, Gradle produces an unsigned release bundle for inspection without exposing credentials.

---

## 3. Independent Application Identifiers & Versioning

| Application | Package ID | Display Name | Current versionName | Current versionCode |
| :--- | :--- | :--- | :--- | :--- |
| **VERTEX Customer** | `com.vertex.customer` | VERTEX Customer | `1.0.0` | `1` |
| **VERTEX Technician** | `com.vertex.technician` | VERTEX Technician | `1.0.0` | `1` |

Versioning is managed independently through `scripts/prepare_mobile.ts`:
```bash
# To prepare Customer with custom version:
npx tsx scripts/prepare_mobile.ts --target=customer --platform=android --version-name=1.0.1 --version-code=2

# To prepare Technician with custom version:
npx tsx scripts/prepare_mobile.ts --target=technician --platform=android --version-name=1.0.2 --version-code=3
```

---

## 4. Release Build Commands (AAB & APK)

To build release packages for Google Play Store distribution:

```bash
# 1. Prepare Customer Android project
npm run customer:android

# 2. Build Android App Bundle (AAB) for Google Play
cd android && ./gradlew :app:bundleRelease

# Output AAB location:
# android/app/build/outputs/bundle/release/app-release.aab

# Alternatively, for testing on local devices via APK:
cd android && ./gradlew :app:assembleRelease
# Output APK location:
# android/app/build/outputs/apk/release/app-release-unsigned.apk (or signed)
```

For Technician:
```bash
# 1. Prepare Technician Android project
npm run technician:android

# 2. Build Android App Bundle (AAB)
cd android && ./gradlew :app:bundleRelease
```

---

## 5. Security & Compliance Checklist for Google Play

- **Zero Cleartext HTTP**: `android/app/src/main/res/xml/network_security_config.xml` enforces `cleartextTrafficPermitted="false"`.
- **Permissions Audit**: Only `android.permission.INTERNET` and `android.permission.ACCESS_NETWORK_STATE` are declared in `AndroidManifest.xml`. No sensitive or background location permissions are requested.
- **Exported Activities & Components**: `MainActivity` specifies `android:exported="true"` with standard `MAIN` / `LAUNCHER` intent filter; internal `FileProvider` specifies `android:exported="false"`.
- **Demo & Test Bypass Gate**: In production release bundles (`NODE_ENV=production`, `DEMO_LOGIN_ENABLED=false`), demo logins, quick logins, simulated OTPs, and doorstep OTP bypasses are rejected with 401/403/400 errors.
