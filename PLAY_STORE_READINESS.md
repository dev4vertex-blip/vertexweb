# VERTEX Google Play Console Preparation & Release Guide

See full guide in `docs/PLAY_STORE_READINESS.md`.

## Summary Matrix

| Field | VERTEX Customer | VERTEX Technician |
| :--- | :--- | :--- |
| **Package Name** | `com.vertex.customer` | `com.vertex.technician` |
| **App Title** | `VERTEX Customer` | `VERTEX Technician` |
| **Build Target** | `VITE_APP_TARGET=customer` | `VITE_APP_TARGET=technician` |
| **Storage Group** | `VERTEXCustomerApp` | `VERTEXTechnicianApp` |
| **URL Scheme** | `vertexcustomer://` | `vertextechnician://` |
| **Version** | `1.0.0` (Code: 1) | `1.0.0` (Code: 1) |
| **AAB Command** | `cd android && ./gradlew :app:bundleRelease` | `cd android && ./gradlew :app:bundleRelease` |
| **APK Command** | `cd android && ./gradlew :app:assembleRelease` | `cd android && ./gradlew :app:assembleRelease` |

## Required Manual Prerequisites
- REAL PRODUCTION API URL REQUIRED
- ANDROID PRODUCTION SIGNING REQUIRED
- PRODUCTION FIREBASE CONFIGURATION REQUIRED
- FINAL PRODUCTION ICON ASSET REQUIRED
- FINAL PRODUCTION SPLASH ARTWORK REQUIRED
- Manual Play Console setup: Privacy Policy URL, Support URL, Feature Graphics, Screenshots.
