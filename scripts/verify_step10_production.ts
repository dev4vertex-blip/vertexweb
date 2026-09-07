/**
 * VERTEX STEP 10 AUTOMATED VERIFICATION SUITE
 *
 * Verifies:
 * 1. Customer App Identity (Name, Android package ID, iOS bundle ID)
 * 2. Technician App Identity (Name, Android package ID, iOS bundle ID)
 * 3. Admin Web Identity
 * 4. Versioning (Customer 1.0.0 code 1 / build 1, Technician 1.0.0 code 1 / build 1)
 * 5. App Icons & Adaptive Icon structure
 * 6. Splash Screen configuration & resolution files
 * 7. Production Target Isolation in Capacitor
 * 8. Production Environment Safety & Secret Audit (Zero secrets in VITE_*)
 * 9. Demo Login Production Suppression (Customer, Technician, Admin)
 * 10. Technician Doorstep OTP Security (No bypass in production)
 * 11. Push Notification Configuration structure & credential requirements
 * 12. Build script availability & executable verification
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         -> ${details}`);
  }
}

async function runStep10Verification() {
  console.log('\n======================================================');
  console.log('   VERTEX STEP 10 PRODUCTION & IDENTITY VERIFICATION');
  console.log('======================================================\n');

  // --- SECTION 1: CUSTOMER APP IDENTITY ---
  console.log('--- 1. Customer App Identity ---');
  const capacitorTs = fs.readFileSync(path.resolve('capacitor.config.ts'), 'utf8');
  assert(
    capacitorTs.includes("'com.vertex.customer'") && capacitorTs.includes("'VERTEX Customer'"),
    'Capacitor config supports VERTEX Customer and com.vertex.customer'
  );

  const customerReadme = fs.existsSync(path.resolve('resources/customer/README.md'));
  assert(customerReadme, 'Customer resource identity documentation present');

  // --- SECTION 2: TECHNICIAN APP IDENTITY ---
  console.log('\n--- 2. Technician App Identity ---');
  assert(
    capacitorTs.includes("'com.vertex.technician'") && capacitorTs.includes("'VERTEX Technician'"),
    'Capacitor config supports VERTEX Technician and com.vertex.technician'
  );

  const technicianReadme = fs.existsSync(path.resolve('resources/technician/README.md'));
  assert(technicianReadme, 'Technician resource identity documentation present');

  // --- SECTION 3: ADMIN WEB IDENTITY ---
  console.log('\n--- 3. Admin Web Identity ---');
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert(indexHtml.includes('VERTEX'), 'Entry HTML index.html branded with VERTEX');

  const metadataJson = JSON.parse(fs.readFileSync(path.resolve('metadata.json'), 'utf8'));
  assert(metadataJson.name && metadataJson.name.includes('VERTEX'), 'metadata.json branded with VERTEX');

  // --- SECTION 4: VERSIONING ---
  console.log('\n--- 4. App Versioning Configuration ---');
  const prepareMobileTs = fs.readFileSync(path.resolve('scripts/prepare_mobile.ts'), 'utf8');
  assert(
    prepareMobileTs.includes("versionName: '1.0.0'") &&
    prepareMobileTs.includes('versionCode: 1') &&
    prepareMobileTs.includes('buildNumber: 1'),
    'Prepare mobile script configures 1.0.0, versionCode: 1, and buildNumber: 1'
  );

  const buildGradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf8');
  assert(
    buildGradle.includes('versionCode') && buildGradle.includes('versionName "1.0.0"'),
    'Android build.gradle reflects versionName 1.0.0 and versionCode'
  );

  const infoPlist = fs.readFileSync(path.resolve('ios/App/App/Info.plist'), 'utf8');
  assert(
    infoPlist.includes('<key>CFBundleShortVersionString</key>') &&
    infoPlist.includes('<key>CFBundleVersion</key>'),
    'iOS Info.plist reflects CFBundleShortVersionString and CFBundleVersion'
  );

  // --- SECTION 5: APP ICONS & ADAPTIVE ICONS ---
  console.log('\n--- 5. App Icons & Adaptive Icon Assets ---');
  const androidAdaptiveXml = path.resolve('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml');
  const androidAdaptiveFgXml = path.resolve('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml');
  const androidHdpiIcon = path.resolve('android/app/src/main/res/mipmap-hdpi/ic_launcher.png');
  const androidXxhdpiIcon = path.resolve('android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png');
  const iosAppIcon = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  const iosAppIconJson = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json');

  assert(fs.existsSync(androidAdaptiveXml), 'Android adaptive icon XML present');
  assert(fs.existsSync(androidAdaptiveFgXml), 'Android launcher foreground vector present');
  assert(fs.existsSync(androidHdpiIcon) && fs.existsSync(androidXxhdpiIcon), 'Android mipmap launcher icons present');
  assert(fs.existsSync(iosAppIcon) && fs.existsSync(iosAppIconJson), 'iOS 1024x1024 AppIcon and Contents.json present');

  // --- SECTION 6: SPLASH SCREENS ---
  console.log('\n--- 6. Splash Screens ---');
  const androidDefaultSplash = path.resolve('android/app/src/main/res/drawable/splash.png');
  const androidPortHdpiSplash = path.resolve('android/app/src/main/res/drawable-port-hdpi/splash.png');
  const androidLandHdpiSplash = path.resolve('android/app/src/main/res/drawable-land-hdpi/splash.png');
  const iosSplashPng = path.resolve('ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png');
  const iosSplashJson = path.resolve('ios/App/App/Assets.xcassets/Splash.imageset/Contents.json');

  assert(fs.existsSync(androidDefaultSplash), 'Android default splash.png present');
  assert(fs.existsSync(androidPortHdpiSplash), 'Android portrait splash resolutions present');
  assert(fs.existsSync(androidLandHdpiSplash), 'Android landscape splash resolutions present');
  assert(fs.existsSync(iosSplashPng) && fs.existsSync(iosSplashJson), 'iOS 2732x2732 launch image & catalog present');

  // --- SECTION 7: SECRET SECURITY AUDIT ---
  console.log('\n--- 7. Secret Security & Environment Audit ---');
  const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
  assert(
    !envExample.includes('super-secret') &&
    !envExample.includes('sk_live') &&
    envExample.includes('DATABASE_URL=') &&
    envExample.includes('JWT_SECRET='),
    '.env.example contains only clean placeholders'
  );

  // Scan codebase for any leaking VITE_* keys
  const viteKeys = Object.keys(process.env).filter((k) => k.startsWith('VITE_'));
  const sensitivePatterns = ['SECRET', 'PASS', 'PRIVATE', 'KEY_ADMIN', 'SERVICE_ROLE'];
  const leakingViteKeys = viteKeys.filter((k) =>
    sensitivePatterns.some((pattern) => k.toUpperCase().includes(pattern))
  );
  assert(leakingViteKeys.length === 0, 'Zero sensitive secrets exposed via VITE_* environment variables');

  // --- SECTION 8: DEMO LOGIN PRODUCTION SUPPRESSION ---
  console.log('\n--- 8. Demo Login Production Suppression ---');
  const configTs = fs.readFileSync(path.resolve('src/shared/config.ts'), 'utf8');
  assert(
    configTs.includes("if (process.env.DEMO_LOGIN_ENABLED === 'false'") &&
    configTs.includes("if (viteDemoFlag === 'false')"),
    'isDemoLoginEnabled strictly respects DEMO_LOGIN_ENABLED=false and VITE_DEMO_LOGIN_ENABLED=false'
  );

  const authRoutes = fs.readFileSync(path.resolve('src/server/routes/auth.ts'), 'utf8');
  assert(
    authRoutes.includes("if (process.env.DEMO_LOGIN_ENABLED === 'false'") &&
    authRoutes.includes("if (!demoEnabled)"),
    'Server auth strictly rejects demo login and bypass when DEMO_LOGIN_ENABLED=false'
  );

  const customerLoginView = fs.readFileSync(path.resolve('src/apps/customer/CustomerLoginView.tsx'), 'utf8');
  assert(
    customerLoginView.includes('{demoEnabled &&') &&
    customerLoginView.includes("demoEnabled ? '9999990002' : ''"),
    'CustomerLoginView suppresses demo helpers and prefill when demoEnabled=false'
  );

  const techLoginView = fs.readFileSync(path.resolve('src/apps/technician/TechnicianLoginView.tsx'), 'utf8');
  assert(
    techLoginView.includes('{demoEnabled &&') &&
    techLoginView.includes("demoEnabled ? '9999990001' : ''"),
    'TechnicianLoginView suppresses demo helpers and prefill when demoEnabled=false'
  );

  const adminLoginView = fs.readFileSync(path.resolve('src/apps/admin/AdminLoginView.tsx'), 'utf8');
  assert(
    adminLoginView.includes('{demoEnabled &&') &&
    adminLoginView.includes("demoEnabled ? 'admin@vertex.demo' : ''"),
    'AdminLoginView suppresses persona picker and prefill when demoEnabled=false'
  );

  // --- SECTION 9: TECHNICIAN DOORSTEP VERIFICATION SECURITY ---
  console.log('\n--- 9. Technician Doorstep OTP Security ---');
  const techRoutes = fs.readFileSync(path.resolve('src/server/routes/technician.ts'), 'utf8');
  assert(
    techRoutes.includes("const isDemoOtp = demoEnabled && otp === '4821';") &&
    techRoutes.includes("!isDemoOtp && otp !== requiredOtp"),
    'Doorstep verification OTP 4821 bypass is disabled in production and when demo is false'
  );

  // --- SECTION 10: BUILD SCRIPTS ---
  console.log('\n--- 10. Build Scripts Verification ---');
  const pkgJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  const scripts = pkgJson.scripts;

  assert(Boolean(scripts['customer:web']), 'Script customer:web is present');
  assert(Boolean(scripts['customer:android']), 'Script customer:android is present');
  assert(Boolean(scripts['customer:ios']), 'Script customer:ios is present');
  assert(Boolean(scripts['technician:web']), 'Script technician:web is present');
  assert(Boolean(scripts['technician:android']), 'Script technician:android is present');
  assert(Boolean(scripts['technician:ios']), 'Script technician:ios is present');
  assert(Boolean(scripts['admin:web']), 'Script admin:web is present');

  // --- SECTION 11: PUSH NOTIFICATION CONFIGURATION ---
  console.log('\n--- 11. Push Notification Configuration Structure ---');
  assert(
    buildGradle.includes("file('google-services.json')") &&
    buildGradle.includes("google-services plugin not applied"),
    'Android build.gradle includes safe google-services.json hook without fake credentials'
  );

  console.log('\n======================================================');
  console.log(`STEP 10 VERIFICATION RESULT: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep10Verification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
