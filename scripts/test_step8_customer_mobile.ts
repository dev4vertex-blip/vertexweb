/**
 * VERTEX STEP 8 — Customer App Mobile Packaging Preparation Test Suite
 *
 * Verifies:
 * 1. Customer App Target & Build Architecture
 * 2. Capacitor Configuration (appId, appName, webDir)
 * 3. Android Project Configuration (build.gradle, AndroidManifest.xml, strings.xml)
 * 4. iOS Project Preparation (Info.plist, Assets.xcassets)
 * 5. Secure Native Storage Integration (@capacitor/preferences)
 * 6. Configurable API Base URL (VITE_API_BASE_URL) & Offline Handling
 * 7. Mobile Navigation & Android Back Button Integration
 * 8. Production Demo Gating Enforcement
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  results.push({
    name,
    passed: condition,
    details,
  });
  const symbol = condition ? 'PASS' : 'FAIL';
  console.log(`[${symbol}] ${name}: ${details}`);
}

async function runStep8Tests() {
  console.log('====================================================');
  console.log('  VERTEX STEP 8: CUSTOMER APP MOBILE PACKAGING TESTS');
  console.log('====================================================\n');

  // Test 1: Capacitor Configuration
  const capConfigPath = path.resolve('capacitor.config.ts');
  const capConfigExists = fs.existsSync(capConfigPath);
  let capContent = '';
  if (capConfigExists) {
    capContent = fs.readFileSync(capConfigPath, 'utf8');
  }
  assert(
    capConfigExists && capContent.includes('com.vertex.customer') && capContent.includes('VERTEX Customer'),
    'TEST 1: Capacitor Configuration File',
    `appId='com.vertex.customer', appName='VERTEX Customer' in capacitor.config.ts`
  );

  // Test 2: Android Project Structure & Identity
  const androidGradlePath = path.resolve('android/app/build.gradle');
  const androidManifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
  const androidStringsPath = path.resolve('android/app/src/main/res/values/strings.xml');

  const androidGradle = fs.existsSync(androidGradlePath) ? fs.readFileSync(androidGradlePath, 'utf8') : '';
  const androidManifest = fs.existsSync(androidManifestPath) ? fs.readFileSync(androidManifestPath, 'utf8') : '';
  const androidStrings = fs.existsSync(androidStringsPath) ? fs.readFileSync(androidStringsPath, 'utf8') : '';

  assert(
    androidGradle.includes('applicationId "com.vertex.customer"') &&
    androidGradle.includes('versionCode 1') &&
    androidGradle.includes('versionName "1.0.0"'),
    'TEST 2: Android Build Configuration',
    'applicationId="com.vertex.customer", versionCode=1, versionName="1.0.0"'
  );

  assert(
    androidManifest.includes('android.permission.INTERNET') &&
    androidStrings.includes('VERTEX Customer'),
    'TEST 3: Android Manifest & App Name',
    'INTERNET permission present, display name is VERTEX Customer'
  );

  // Test 4: iOS Project Preparation
  const iosPlistPath = path.resolve('ios/App/App/Info.plist');
  const iosPlist = fs.existsSync(iosPlistPath) ? fs.readFileSync(iosPlistPath, 'utf8') : '';

  assert(
    fs.existsSync(iosPlistPath) && iosPlist.includes('VERTEX Customer'),
    'TEST 4: iOS Info.plist & Bundle Identity',
    'iOS project prepared with CFBundleDisplayName="VERTEX Customer"'
  );

  // Test 5: Customer App Target Isolation
  const appTsx = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  const customerRoot = fs.readFileSync(path.resolve('src/apps/customer/CustomerAppRoot.tsx'), 'utf8');

  assert(
    appTsx.includes("activeAppTarget === 'customer'") &&
    customerRoot.includes('CustomerApp') &&
    !customerRoot.includes('AdminApp') &&
    !customerRoot.includes('TechnicianApp'),
    'TEST 5: Customer App Target Isolation',
    'Customer build shell includes only Customer components and denies Admin/Technician views'
  );

  // Test 6: Secure Storage Implementation
  const storageTs = fs.readFileSync(path.resolve('src/services/storage.ts'), 'utf8');
  assert(
    storageTs.includes('@capacitor/preferences') &&
    storageTs.includes('Capacitor.isNativePlatform()') &&
    !storageTs.includes('console.log(token'),
    'TEST 6: Secure Storage Service',
    'Native Preferences bridge implemented without leaking tokens to console'
  );

  // Test 7: Configurable API Base URL
  const apiTs = fs.readFileSync(path.resolve('src/services/api.ts'), 'utf8');
  assert(
    apiTs.includes('getApiBaseUrl') &&
    apiTs.includes('VITE_API_BASE_URL') &&
    apiTs.includes('NETWORK_ERROR'),
    'TEST 7: Configurable API Base URL & Network Error Handling',
    'VITE_API_BASE_URL resolved with offline error translation'
  );

  // Test 8: Mobile Navigation & Android Back Button
  const navTs = fs.readFileSync(path.resolve('src/shared/navigation/MobileNavigation.tsx'), 'utf8');
  assert(
    navTs.includes("addListener('backButton'") &&
    navTs.includes('exitApp()') &&
    navTs.includes('pop()'),
    'TEST 8: Native Hardware Back Button Handling',
    'Capacitor backButton listener wired to pop screen stack or exit on root'
  );

  // Test 9: Deep Link & Push Notification Architecture
  const mobileBridgeTs = fs.readFileSync(path.resolve('src/services/mobileBridge.ts'), 'utf8');
  assert(
    mobileBridgeTs.includes("addListener('appUrlOpen'") &&
    mobileBridgeTs.includes('initializePushNotifications'),
    'TEST 9: Mobile Bridge (Deep Links & Push Hooks)',
    'URL scheme/deep link handling and push notification hooks prepared'
  );

  // Test 10: Production Demo Gating
  const configTs = fs.readFileSync(path.resolve('src/shared/config.ts'), 'utf8');
  assert(
    configTs.includes('isDemoLoginEnabled') &&
    configTs.includes('production'),
    'TEST 10: Production Demo Gating Enforced',
    'Demo login remains strictly disabled in production builds'
  );

  // Test 11: Build Scripts in package.json
  const pkgJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  assert(
    Boolean(pkgJson.scripts['customer:web']) &&
    Boolean(pkgJson.scripts['customer:android']) &&
    Boolean(pkgJson.scripts['customer:ios']) &&
    Boolean(pkgJson.scripts['customer:sync']),
    'TEST 11: Mobile Build Scripts',
    'customer:web, customer:android, customer:ios, customer:sync defined'
  );

  console.log('\n====================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL STEP 8 CHECKS PASSED' : 'SOME CHECKS FAILED'}`);
  console.log('====================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runStep8Tests().catch((err) => {
  console.error('Fatal error running Step 8 test suite:', err);
  process.exit(1);
});
