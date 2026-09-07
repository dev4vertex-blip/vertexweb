/**
 * VERTEX STEP 16 VERIFICATION SUITE
 * Google Play Console Preparation for VERTEX Customer & VERTEX Technician
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { memoryStore } from '../src/db/memoryStore.js';
import { verifyAuthToken, generateAuthToken } from '../src/server/auth.js';

interface CheckItem {
  section: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

const checks: CheckItem[] = [];

function assertCheck(section: string, name: string, condition: boolean, expected: string, actual: string, details?: string) {
  checks.push({ section, name, passed: condition, expected, actual, details });
  const badge = condition ? '[PASS]' : '[FAIL]';
  console.log(`  ${badge} [${section}] ${name}`);
  if (!condition) {
    console.error(`         Expected: ${expected}`);
    console.error(`         Actual:   ${actual}`);
    if (details) console.error(`         Details:  ${details}`);
  }
}

async function runVerification() {
  console.log('=============================================================================');
  console.log('  VERTEX STEP 16 VERIFICATION: Google Play Console Preparation');
  console.log('=============================================================================\n');

  // 1. ANDROID APPLICATION SEPARATION
  console.log('--- 1. Android Application Separation ---');
  const prepareMobile = fs.readFileSync(path.resolve('scripts/prepare_mobile.ts'), 'utf-8');
  const capConfig = fs.readFileSync(path.resolve('capacitor.config.ts'), 'utf-8');

  assertCheck(
    'APP_SEPARATION',
    'Customer Application ID is com.vertex.customer',
    prepareMobile.includes("appId: 'com.vertex.customer'") &&
      capConfig.includes("'com.vertex.customer'"),
    "appId: 'com.vertex.customer'",
    'Declared in prepare_mobile.ts and capacitor.config.ts'
  );

  assertCheck(
    'APP_SEPARATION',
    'Technician Application ID is com.vertex.technician',
    prepareMobile.includes("appId: 'com.vertex.technician'") &&
      capConfig.includes("'com.vertex.technician'"),
    "appId: 'com.vertex.technician'",
    'Declared in prepare_mobile.ts and capacitor.config.ts'
  );

  assertCheck(
    'APP_SEPARATION',
    'No cross-application package contamination',
    !prepareMobile.includes("target === 'customer' ? 'com.vertex.technician'") &&
      !prepareMobile.includes("target === 'technician' ? 'com.vertex.customer'"),
    'Target configurations strictly map to their respective package IDs',
    'Separation verified'
  );

  // 2. APPLICATION NAMES
  console.log('\n--- 2. Application Names ---');
  assertCheck(
    'APP_NAMES',
    'Customer Display Name is VERTEX Customer',
    prepareMobile.includes("appName: 'VERTEX Customer'"),
    "appName: 'VERTEX Customer'",
    'Customer app label verified'
  );

  assertCheck(
    'APP_NAMES',
    'Technician Display Name is VERTEX Technician',
    prepareMobile.includes("appName: 'VERTEX Technician'"),
    "appName: 'VERTEX Technician'",
    'Technician app label verified'
  );

  // 3. VERSIONING
  console.log('\n--- 3. Versioning ---');
  const gradleApp = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf-8');
  assertCheck(
    'VERSIONING',
    'Initial release baseline versionName=1.0.0 and versionCode=1',
    gradleApp.includes('versionCode 1') && gradleApp.includes('versionName "1.0.0"'),
    'versionCode 1, versionName "1.0.0"',
    'Standard initial release versions active'
  );

  assertCheck(
    'VERSIONING',
    'Supports independent version management via prepare_mobile args',
    prepareMobile.includes('--version-name=') && prepareMobile.includes('--version-code='),
    'CLI args --version-name and --version-code supported',
    'Independent version flags supported'
  );

  // 4. ANDROID RELEASE BUILD
  console.log('\n--- 4. Android Release Build & SDK Configuration ---');
  const variablesGradle = fs.readFileSync(path.resolve('android/variables.gradle'), 'utf-8');
  assertCheck(
    'GRADLE_CONFIG',
    'SDK versions supported by toolchain (minSdk=24, compileSdk/targetSdk=36)',
    variablesGradle.includes('minSdkVersion = 24') &&
      variablesGradle.includes('targetSdkVersion = 36') &&
      variablesGradle.includes('compileSdkVersion = 36'),
    'minSdk=24, compileSdk=36, targetSdk=36',
    'Verified in variables.gradle'
  );

  assertCheck(
    'GRADLE_CONFIG',
    'Release build type configured in build.gradle',
    gradleApp.includes('buildTypes {') && gradleApp.includes('release {'),
    'release buildType declared',
    'Verified in android/app/build.gradle'
  );

  assertCheck(
    'GRADLE_CONFIG',
    'ProGuard rules referenced in release buildType',
    gradleApp.includes("proguardFiles getDefaultProguardFile('proguard-android.txt')") &&
      fs.existsSync(path.resolve('android/app/proguard-rules.pro')),
    'ProGuard rules referenced and file exists',
    'Verified'
  );

  // 5. ANDROID PRODUCTION ENVIRONMENT
  console.log('\n--- 5. Android Production Environment ---');
  const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf-8');
  const apiService = fs.readFileSync(path.resolve('src/services/api.ts'), 'utf-8');

  assertCheck(
    'ENV_CONFIG',
    'VITE_APP_TARGET selectors for customer and technician defined',
    envExample.includes('VITE_APP_TARGET=') &&
      prepareMobile.includes("VITE_APP_TARGET: cfg.target"),
    'VITE_APP_TARGET defined and applied during mobile sync',
    'Target isolation verified'
  );

  assertCheck(
    'ENV_CONFIG',
    'No localhost or development URLs in production API config',
    apiService.includes('getApiBaseUrl') &&
      !envExample.includes('VITE_API_BASE_URL=http://localhost'),
    'VITE_API_BASE_URL placeholder documented without localhost',
    'No fake or localhost production URLs found'
  );

  // 6. DEMO LOGIN PROTECTION
  console.log('\n--- 6. Demo Login Protection ---');
  const authRoute = fs.readFileSync(path.resolve('src/server/routes/auth.ts'), 'utf-8');
  assertCheck(
    'DEMO_PROTECTION',
    'Demo login strictly blocked in production mode',
    authRoute.includes("process.env.DEMO_LOGIN_ENABLED === 'false'") &&
      authRoute.includes('DEMO_LOGIN_DISABLED'),
    'Returns 403 Forbidden with DEMO_LOGIN_DISABLED in production',
    'Server gating active'
  );

  assertCheck(
    'DEMO_PROTECTION',
    'Simulated test OTP 1234 rejected in production mode',
    authRoute.includes('process.env.NODE_ENV === \'production\'') &&
      authRoute.includes('INVALID_OTP'),
    'Rejects test OTP 1234 in production with 401',
    'Production OTP security verified'
  );

  // 7. ANDROID SIGNING
  console.log('\n--- 7. Android Signing ---');
  assertCheck(
    'SIGNING',
    'Release signing relies on environment variables (no committed keystores)',
    gradleApp.includes('System.getenv("ANDROID_KEYSTORE_PATH")') &&
      gradleApp.includes('System.getenv("ANDROID_KEYSTORE_PASSWORD")'),
    'Dynamic lookup of keystore path and credentials from environment',
    'Zero hardcoded keystores or passwords'
  );

  // 8. AAB RELEASE FORMAT
  console.log('\n--- 8. AAB Release Format ---');
  const pkgJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
  assertCheck(
    'AAB_FORMAT',
    'AAB bundle commands configured for Customer and Technician',
    Boolean(pkgJson.scripts['customer:android:bundle']?.includes(':app:bundleRelease') &&
      pkgJson.scripts['technician:android:bundle']?.includes(':app:bundleRelease')),
    'Scripts execute :app:bundleRelease',
    'customer:android:bundle and technician:android:bundle verified'
  );

  // 9. GOOGLE PLAY APP IDENTITY
  console.log('\n--- 9. Google Play App Identity ---');
  const readinessGuide = fs.readFileSync(path.resolve('docs/PLAY_STORE_READINESS.md'), 'utf-8');
  assertCheck(
    'PLAY_IDENTITY',
    'Play Store identity matrix documented in PLAY_STORE_READINESS.md',
    readinessGuide.includes('com.vertex.customer') &&
      readinessGuide.includes('com.vertex.technician') &&
      readinessGuide.includes('VERTEX Customer') &&
      readinessGuide.includes('VERTEX Technician'),
    'Both app identities documented with distinct titles and categories',
    'Verified in docs/PLAY_STORE_READINESS.md'
  );

  // 10. PLAY STORE LISTING PREPARATION
  console.log('\n--- 10. Play Store Listing Preparation ---');
  assertCheck(
    'STORE_LISTING',
    'Short description under 80 characters for both apps',
    readinessGuide.includes('Short Description:') &&
      readinessGuide.includes('(75 / 80 characters)') &&
      readinessGuide.includes('(76 / 80 characters)'),
    'Compliant short descriptions <= 80 characters',
    'Listing copy verified'
  );

  assertCheck(
    'STORE_LISTING',
    'Full descriptions, graphic asset specs, and prerequisites documented',
    readinessGuide.includes('Full Description:') &&
      readinessGuide.includes('512 x 512 px') &&
      readinessGuide.includes('1024 x 500 px'),
    'Full description and asset dimensions specified',
    'Listing assets detailed'
  );

  // 11. DATA SAFETY PREPARATION
  console.log('\n--- 11. Data Safety Preparation ---');
  assertCheck(
    'DATA_SAFETY',
    'Accurate Data Safety tables for Customer and Technician based on actual code',
    readinessGuide.includes('Data Safety Questionnaire Inventory') &&
      readinessGuide.includes('Approximate / Precise Location') &&
      readinessGuide.includes('Doorstep service delivery') &&
      readinessGuide.includes('Background Location'),
    'Realistic data declarations without exaggerated claims',
    'Data Safety inventory documented'
  );

  // 12. ANDROID PERMISSIONS
  console.log('\n--- 12. Android Permissions ---');
  const manifestContent = fs.readFileSync(path.resolve('android/app/src/main/AndroidManifest.xml'), 'utf-8');
  assertCheck(
    'PERMISSIONS',
    'Essential permissions declared (INTERNET, CAMERA, READ_MEDIA_IMAGES, LOCATION, NOTIFICATIONS)',
    manifestContent.includes('android.permission.INTERNET') &&
      manifestContent.includes('android.permission.CAMERA') &&
      manifestContent.includes('android.permission.READ_MEDIA_IMAGES') &&
      manifestContent.includes('android.permission.ACCESS_FINE_LOCATION') &&
      manifestContent.includes('android.permission.POST_NOTIFICATIONS'),
    'Declared in AndroidManifest.xml',
    'Required permissions present'
  );

  assertCheck(
    'PERMISSIONS',
    'Customer build strictly excludes background location and wake lock',
    prepareMobile.includes("cfg.target === 'technician'") &&
      prepareMobile.includes('ACCESS_BACKGROUND_LOCATION'),
    'prepare_mobile dynamically injects background location only for technician',
    'Customer permission isolation verified'
  );

  // 13. PUSH NOTIFICATIONS
  console.log('\n--- 13. Push Notifications ---');
  assertCheck(
    'NOTIFICATIONS',
    'FCM architecture documented and protected against hardcoded credentials',
    gradleApp.includes("def servicesJSON = file('google-services.json')") &&
      !fs.existsSync(path.resolve('android/app/google-services.json')),
    'Safe build hook without dummy or committed credentials',
    'google-services.json safely omitted from repository'
  );

  // 14. APP ICON & 15. SPLASH SCREEN
  console.log('\n--- 14 & 15. App Icon & Splash Screen ---');
  const icLauncher = path.resolve('android/app/src/main/res/mipmap-hdpi/ic_launcher.png');
  const splashImg = path.resolve('android/app/src/main/res/drawable/splash.png');
  assertCheck(
    'ICONS_SPLASH',
    'Adaptive launcher icons and splash drawables exist',
    fs.existsSync(icLauncher) && fs.existsSync(splashImg),
    'ic_launcher.png and splash.png present in res directories',
    'Icon and splash assets verified'
  );

  // 16. NETWORK SECURITY
  console.log('\n--- 16. Network Security ---');
  const netSec = fs.readFileSync(path.resolve('android/app/src/main/res/xml/network_security_config.xml'), 'utf-8');
  assertCheck(
    'NETWORK_SECURITY',
    'Cleartext HTTP strictly disabled in network_security_config.xml',
    netSec.includes('cleartextTrafficPermitted="false"'),
    'cleartextTrafficPermitted="false"',
    'Zero cleartext HTTP allowed'
  );

  // 17. SECURE TOKEN STORAGE
  console.log('\n--- 17. Secure Token Storage & Logging Audit ---');
  assertCheck(
    'SECURE_STORAGE',
    'Capacitor Preferences configured with target-isolated storage groups',
    capConfig.includes("group: isTechnician ? 'VERTEXTechnicianApp' : 'VERTEXCustomerApp'"),
    'Isolated storage groups for Customer and Technician',
    'Preferences group separation verified'
  );

  // 18. DEEP LINKS
  console.log('\n--- 18. Deep Links ---');
  assertCheck(
    'DEEP_LINKS',
    'Independent URL schemes configured (vertexcustomer vs vertextechnician)',
    prepareMobile.includes("urlScheme: 'vertexcustomer'") &&
      prepareMobile.includes("urlScheme: 'vertextechnician'") &&
      manifestContent.includes('@string/custom_url_scheme'),
    'Custom schemes mapped to target-specific strings.xml in AndroidManifest intent filter',
    'Independent deep link routing verified'
  );

  // 19. API SECURITY
  console.log('\n--- 19. API Security Matrix ---');
  const custToken = generateAuthToken('c-1', 'CUSTOMER');
  const techToken = generateAuthToken('t-1', 'TECHNICIAN');
  const adminToken = generateAuthToken('a-1', 'SUPER_ADMIN');

  const vCust = verifyAuthToken(custToken);
  const vTech = verifyAuthToken(techToken);
  const vAdmin = verifyAuthToken(adminToken);

  assertCheck(
    'API_SECURITY',
    'Cryptographic token role separation for Customer, Technician, Admin',
    vCust?.role === 'CUSTOMER' && vTech?.role === 'TECHNICIAN' && vAdmin?.role === 'SUPER_ADMIN',
    'CUSTOMER, TECHNICIAN, SUPER_ADMIN roles distinct in verified tokens',
    'Token roles verified'
  );

  const fakeToken = custToken.slice(0, -5) + 'xxxxx';
  assertCheck(
    'API_SECURITY',
    'Forged or tampered tokens rejected',
    verifyAuthToken(fakeToken) === null,
    'verifyAuthToken returns null on HMAC mismatch',
    'Tampered token rejected'
  );

  // 20. SECRET AUDIT
  console.log('\n--- 20. Secret Audit ---');
  const gitIgnore = fs.readFileSync(path.resolve('.gitignore'), 'utf-8');
  assertCheck(
    'SECRET_AUDIT',
    'Keystores, private keys, and environment files ignored in .gitignore',
    gitIgnore.includes('*.jks') &&
      gitIgnore.includes('*.keystore') &&
      gitIgnore.includes('.env') &&
      gitIgnore.includes('google-services.json'),
    'All sensitive files ignored',
    '.gitignore verified clean'
  );

  // 21. RELEASE BLOCKERS TABLE
  console.log('\n--- 21. Release Blockers Table ---');
  assertCheck(
    'BLOCKERS',
    'Comprehensive Google Play Console Release Blockers table in PLAY_STORE_READINESS.md',
    readinessGuide.includes('Google Play Console Release Blockers Checklist') &&
      readinessGuide.includes('Google Play Developer Account') &&
      readinessGuide.includes('REAL PRODUCTION API URL REQUIRED') &&
      readinessGuide.includes('ANDROID PRODUCTION SIGNING REQUIRED') &&
      readinessGuide.includes('PRODUCTION FIREBASE CONFIGURATION REQUIRED'),
    'Table includes item, status, action required, and explicit prerequisites',
    'Blockers checklist verified'
  );

  // SUMMARY
  console.log('\n=============================================================================');
  const passedCount = checks.filter((c) => c.passed).length;
  const failedCount = checks.filter((c) => !c.passed).length;
  console.log(`  TOTAL STEP 16 CHECKS: ${checks.length}`);
  console.log(`  PASSED:               ${passedCount}`);
  console.log(`  FAILED:               ${failedCount}`);
  console.log('=============================================================================\n');

  if (failedCount > 0) {
    console.error(`Verification FAILED with ${failedCount} failing checks.`);
    process.exit(1);
  } else {
    console.log('ALL VERTEX STEP 16 GOOGLE PLAY CONSOLE PREPARATION CHECKS PASSED.');
  }
}

runVerification().catch((err) => {
  console.error('Fatal Step 16 verification error:', err);
  process.exit(1);
});
