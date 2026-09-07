# VERTEX Mobile Application Brand Assets & Production Resources

This directory contains the production identity and asset staging structure for:
1. **VERTEX Customer App** (`resources/customer/`)
   - Package ID: `com.vertex.customer`
   - iOS Bundle ID: `com.vertex.customer`
   - App Name: `VERTEX Customer`

2. **VERTEX Technician App** (`resources/technician/`)
   - Package ID: `com.vertex.technician`
   - iOS Bundle ID: `com.vertex.technician`
   - App Name: `VERTEX Technician`

## Asset Requirements for App Store & Play Store Submissions

### 1. App Launcher Icons
- **Android**:
  - Adaptive Icon Foreground: 432x432 px (108dp viewport)
  - Adaptive Icon Background: Solid color or 432x432 px drawable
  - Legacy Icons:
    - mdpi: 48x48 px
    - hdpi: 72x72 px
    - xhdpi: 96x96 px
    - xxhdpi: 144x144 px
    - xxxhdpi: 192x192 px
- **iOS**:
  - Universal App Icon: 1024x1024 px PNG (non-alpha, 24-bit RGB)

### 2. Launch / Splash Screens
- **Android**:
  - Portrait: 320x480, 480x800, 720x1280, 960x1600, 1280x1920 px
  - Landscape: 480x320, 800x480, 1280x720, 1600x960, 1920x1280 px
- **iOS**:
  - Universal Launch Image: 2732x2732 px PNG centered mark

## Production Asset Supply Status
Final production icon asset must be supplied.
Final production splash asset must be supplied.
Placeholders are currently configured in native targets to prevent broken build references.
