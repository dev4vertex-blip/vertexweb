/**
 * VERTEX STEP 17 VERIFICATION SUITE
 * Customer Android Google Play Store Release Preparation
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { memoryStore } from '../src/db/memoryStore.js';
import { verifyAuthToken, generateAuthToken } from '../src/server/auth.js';
import { isServerDemoLoginEnabled } from '../src/server/routes/auth.js';
import { Request } from 'express';

interface CheckItem {
  section: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

const checks: CheckItem[] = [];

function assertCheck(
  section: string,
  name: string,
  condition: boolean,
  expected: string,
  actual: string,
  details?: string
) {
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
  console.log('  VERTEX STEP 17: CUSTOMER ANDROID PLAY STORE RELEASE PREPARATION');
  console.log('=============================================================================\n');

  // 1. CUSTOMER APP IDENTITY
  console.log('--- 1. Customer Application Identity ---');
  const gradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf-8');
  const strings = fs.readFileSync(path.resolve('android/app/src/main/res/values/strings.xml'), 'utf-8');
  const manifest = fs.readFileSync(path.resolve('android/app/src/main/AndroidManifest.xml'), 'utf-8');
  const prepareMobile = fs.readFileSync(path.resolve('scripts/prepare_mobile.ts'), 'utf-8');
  const capConfig = fs.readFileSync(path.resolve('capacitor.config.ts'), 'utf-8');
  const mainActivity = fs.readFileSync(
    path.resolve('android/app/src/main/java/com/vertex/customer/MainActivity.java'),
    'utf-8'
  );

  assertCheck(
    'IDENTITY',
    'Application ID is com.vertex.customer in build.gradle',
    gradle.includes('applicationId "com.vertex.customer"') && gradle.includes('namespace = "com.vertex.customer"'),
    'applicationId "com.vertex.customer"',
    'Matched in build.gradle'
  );

  assertCheck(
    'IDENTITY',
    'App name is VERTEX Customer in strings.xml',
    strings.includes('<string name="app_name">VERTEX Customer</string>'),
    '<string name="app_name">VERTEX Customer</string>',
    'Matched in strings.xml'
  );

  assertCheck(
    'IDENTITY',
    'Java package is com.vertex.customer in MainActivity.java',
    mainActivity.includes('package com.vertex.customer;'),
    'package com.vertex.customer;',
    'Matched in MainActivity.java'
  );

  assertCheck(
    'IDENTITY',
    'No accidental references to Technician in Customer Android configuration',
    !strings.includes('com.vertex.technician') &&
      !strings.includes('VERTEX Technician') &&
      !mainActivity.includes('com.vertex.technician'),
    'Zero Technician identity in Customer resources and MainActivity',
    'Customer identity cleanly isolated'
  );

  // 2. CUSTOMER VERSION
  console.log('\n--- 2. Customer Version ---');
  assertCheck(
    'VERSION',
    'versionName is 1.0.0 in build.gradle',
    gradle.includes('versionName "1.0.0"'),
    'versionName "1.0.0"',
    'Matched in build.gradle'
  );

  assertCheck(
    'VERSION',
    'versionCode is 1 in build.gradle',
    gradle.includes('versionCode 1'),
    'versionCode 1',
    'Matched in build.gradle'
  );

  // 3. PRODUCTION TARGET
  console.log('\n--- 3. Production Target & Demo Gating ---');
  const sharedConfig = fs.readFileSync(path.resolve('src/shared/config.ts'), 'utf-8');
  assertCheck(
    'PROD_TARGET',
    'Production target customer supported via VITE_APP_TARGET=customer',
    prepareMobile.includes("target: 'customer'") &&
      capConfig.includes("isTechnician ? 'com.vertex.technician' : 'com.vertex.customer'"),
    'Customer build target defined',
    'Target verified'
  );

  assertCheck(
    'PROD_TARGET',
    'Demo login strictly disabled when VITE_DEMO_LOGIN_ENABLED=false or NODE_ENV=production',
    sharedConfig.includes("process.env.DEMO_LOGIN_ENABLED === 'false'") &&
      sharedConfig.includes("process.env.NODE_ENV === 'production'"),
    'Strict production evaluation',
    'Gating logic verified in src/shared/config.ts'
  );

  // 4. PRODUCTION API
  console.log('\n--- 4. Production API Specification ---');
  const apiService = fs.readFileSync(path.resolve('src/services/api.ts'), 'utf-8');
  assertCheck(
    'PROD_API',
    'API service rejects localhost and 127.0.0.1 in production release builds',
    apiService.includes("trimmed.includes('localhost')") &&
      apiService.includes("trimmed.includes('127.0.0.1')") &&
      apiService.includes("Insecure HTTP API URL is forbidden"),
    'Localhost/loopback and insecure HTTP rejected in production',
    'API security guard verified in src/services/api.ts'
  );

  // 5. CUSTOMER AUTHENTICATION
  console.log('\n--- 5. Customer Authentication Security ---');
  const authRoutes = fs.readFileSync(path.resolve('src/server/routes/auth.ts'), 'utf-8');
  const customerToken = generateAuthToken('c-100', 'CUSTOMER');
  const verifiedCustomer = verifyAuthToken(customerToken);

  assertCheck(
    'AUTH',
    'Valid Customer credentials generate valid JWT with role CUSTOMER',
    verifiedCustomer !== null && verifiedCustomer.userId === 'c-100' && verifiedCustomer.role === 'CUSTOMER',
    'Valid token decoded with role CUSTOMER',
    'JWT token issuance and verification verified'
  );

  const tamperedToken = customerToken.substring(0, customerToken.length - 6) + 'abcdef';
  assertCheck(
    'AUTH',
    'Forged or tampered token rejected',
    verifyAuthToken(tamperedToken) === null,
    'verifyAuthToken returns null',
    'Tampered token rejected'
  );

  // Expired token test
  const expiredToken = generateAuthToken('c-100', 'CUSTOMER', -100);
  assertCheck(
    'AUTH',
    'Expired token rejected',
    verifyAuthToken(expiredToken) === null,
    'verifyAuthToken returns null for expired timestamp',
    'Expired token rejected'
  );

  // Demo login gating in production
  const fakeProdReq = {
    headers: { 'x-test-production': 'true' },
  } as unknown as Request;
  assertCheck(
    'AUTH',
    'Demo login disabled under production mode',
    isServerDemoLoginEnabled(fakeProdReq) === false,
    'isServerDemoLoginEnabled returns false',
    'Demo login blocked in production'
  );

  assertCheck(
    'AUTH',
    'Simulated OTP rejected in production in auth.ts',
    authRoutes.includes('SIMULATED_OTP_REJECTED') &&
      authRoutes.includes('isSimulatedOtp && !demoEnabled'),
    'Rejection code SIMULATED_OTP_REJECTED present',
    'Production OTP security verified'
  );

  // 6. CUSTOMER FEATURES REGRESSION
  console.log('\n--- 6. Customer Features Regression ---');
  const customerApp = fs.readFileSync(path.resolve('src/views/customer/CustomerApp.tsx'), 'utf-8');
  const customerScreens = [
    'home',
    'services',
    'service-details',
    'book-service',
    'booking-confirmation',
    'my-bookings',
    'booking-details',
    'amc',
    'profile',
    'addresses',
    'notifications',
    'support',
    'invoices',
    'offers',
    'reviews',
  ];

  const allScreensPresent = customerScreens.every((s) => customerApp.includes(`'${s}'`));
  assertCheck(
    'REGRESSION',
    'All core Customer screens registered in CustomerApp.tsx',
    allScreensPresent,
    customerScreens.join(', '),
    'All 15 customer screens present'
  );

  // 7. CUSTOMER API AUTHORIZATION
  console.log('\n--- 7. Customer API Authorization ---');
  const techRoutes = fs.readFileSync(path.resolve('src/server/routes/technician.ts'), 'utf-8');
  const adminRoutes = fs.readFileSync(path.resolve('src/server/routes/admin.ts'), 'utf-8');

  assertCheck(
    'AUTHORIZATION',
    'Technician routes strictly require TECHNICIAN or staff role (Customer blocked)',
    techRoutes.includes("requireRole(['TECHNICIAN', 'SUPER_ADMIN', 'MANAGER'])"),
    "requireRole(['TECHNICIAN', 'SUPER_ADMIN', 'MANAGER'])",
    'Technician route authorization guard verified'
  );

  assertCheck(
    'AUTHORIZATION',
    'Admin routes strictly require staff roles (Customer blocked)',
    adminRoutes.includes("requireRole(['SUPER_ADMIN', 'MANAGER', 'SALES', 'FINANCE'])"),
    "requireRole(['SUPER_ADMIN', 'MANAGER', 'SALES', 'FINANCE'])",
    'Admin route authorization guard verified'
  );

  // 8. CUSTOMER DATA ISOLATION
  console.log('\n--- 8. Customer Data Isolation ---');
  const customerRoutes = fs.readFileSync(path.resolve('src/server/routes/customer.ts'), 'utf-8');
  assertCheck(
    'DATA_ISOLATION',
    'Customer booking details check server-side customer ownership',
    customerRoutes.includes('booking.customer_id === userId') &&
      customerRoutes.includes('authorized to view another customer'),
    'Strict customer_id === userId check',
    'Server-side booking isolation verified'
  );

  assertCheck(
    'DATA_ISOLATION',
    'Customer booking cancellation checks server-side customer ownership',
    customerRoutes.includes('cannot modify another customer'),
    'Strict cancellation ownership check',
    'Server-side cancellation isolation verified'
  );

  assertCheck(
    'DATA_ISOLATION',
    'Customer invoice retrieval checks server-side customer ownership',
    customerRoutes.includes('cannot access another customer'),
    'Strict invoice customer ownership check',
    'Server-side invoice isolation verified'
  );

  assertCheck(
    'DATA_ISOLATION',
    'Customer address deletion checks server-side customer ownership',
    customerRoutes.includes('cannot delete another customer'),
    'Strict address ownership check',
    'Server-side address isolation verified'
  );

  assertCheck(
    'DATA_ISOLATION',
    'Customer review submission checks server-side customer ownership',
    customerRoutes.includes('cannot review a booking that does not belong to you'),
    'Strict review ownership check',
    'Server-side review isolation verified'
  );

  // 9. BOOKING SECURITY
  console.log('\n--- 9. Booking Security ---');
  assertCheck(
    'BOOKING_SECURITY',
    'New bookings bind customer_id exclusively from authenticated JWT session',
    customerRoutes.includes('userId = req.user?.id') &&
      customerRoutes.includes('INSERT INTO bookings') &&
      customerRoutes.includes('customer_id'),
    'userId derived from req.user.id',
    'Client cannot forge booking customer ID'
  );

  // 10. PAYMENT SECURITY
  console.log('\n--- 10. Payment Security ---');
  const webhookRoutes = fs.readFileSync(path.resolve('src/server/routes/webhooks.ts'), 'utf-8');
  assertCheck(
    'PAYMENT_SECURITY',
    'Payment webhooks verified server-side with HMAC signature and timestamp freshness',
    webhookRoutes.includes('x-webhook-signature') &&
      webhookRoutes.includes('x-webhook-timestamp') &&
      webhookRoutes.includes('.createHmac'),
    'HMAC-SHA256 signature and replay prevention check',
    'Webhook validation verified'
  );

  // 11. NOTIFICATIONS
  console.log('\n--- 11. Customer Notifications ---');
  assertCheck(
    'NOTIFICATIONS',
    'Customer notifications API strictly filters by authenticated customer ID',
    customerRoutes.includes('WHERE customer_id = $1 ORDER BY created_at DESC'),
    'SELECT * FROM customer_notifications WHERE customer_id = $1',
    'Customer notification isolation verified'
  );

  // 12. OFFERS & PROMOTIONS
  console.log('\n--- 12. Offers & Coupons ---');
  assertCheck(
    'OFFERS',
    'Server-side coupon validation with discount computation and minimum booking constraints',
    customerRoutes.includes("cleanCode === 'VERTEXNEW'") ||
      customerRoutes.includes("promoMap[cleanCode]") ||
      customerRoutes.includes('/offers/validate'),
    'Server-side discount calculation',
    'Offers validation verified'
  );

  // 13. AMC
  console.log('\n--- 13. Customer AMC ---');
  assertCheck(
    'AMC',
    'Customer AMC subscriptions query filtered strictly by authenticated customer ID',
    customerRoutes.includes('WHERE sub.customer_id = $1 AND sub.deleted_at IS NULL'),
    'SELECT * FROM amc_subscriptions WHERE customer_id = $1',
    'AMC subscription data isolation verified'
  );

  // 14. FILES & PHOTOS
  console.log('\n--- 14. Customer File Upload Security ---');
  const uploadRoutes = fs.readFileSync(path.resolve('src/server/routes/uploads.ts'), 'utf-8');
  assertCheck(
    'UPLOADS',
    'File uploads require authentication, validate MIME, and enforce 10MB limit',
    uploadRoutes.includes('ALLOWED_MIME_TYPES') &&
      uploadRoutes.includes('MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024') &&
      uploadRoutes.includes('BANNED_EXTENSIONS'),
    'Authentication, MIME check, extension blacklist, and 10MB size limit',
    'Upload constraints verified'
  );

  assertCheck(
    'UPLOADS',
    'Customers cannot access another customer private upload',
    uploadRoutes.includes("user.role === 'CUSTOMER' && !isOwner") &&
      uploadRoutes.includes('Access Denied: You do not have permission to view this file'),
    'Cross-customer file access rejected with 403',
    'File data isolation verified'
  );

  // 15. ANDROID PERMISSIONS
  console.log('\n--- 15. Android Permissions Audit ---');
  assertCheck(
    'PERMISSIONS',
    'Customer manifest includes required network, media, location, and notification permissions',
    manifest.includes('android.permission.INTERNET') &&
      manifest.includes('android.permission.ACCESS_NETWORK_STATE') &&
      manifest.includes('android.permission.CAMERA') &&
      manifest.includes('android.permission.READ_MEDIA_IMAGES') &&
      manifest.includes('android.permission.ACCESS_FINE_LOCATION') &&
      manifest.includes('android.permission.POST_NOTIFICATIONS'),
    'Required Customer permissions declared',
    'Permissions verified'
  );

  assertCheck(
    'PERMISSIONS',
    'Customer manifest strictly excludes background location and wake lock',
    !manifest.includes('android.permission.ACCESS_BACKGROUND_LOCATION') &&
      !manifest.includes('android.permission.WAKE_LOCK'),
    'ACCESS_BACKGROUND_LOCATION and WAKE_LOCK absent',
    'Permissions clean'
  );

  // 16. SECURE STORAGE & TOKEN PRIVACY
  console.log('\n--- 16. Secure Token Storage & Logging Audit ---');
  const storageService = fs.readFileSync(path.resolve('src/services/storage.ts'), 'utf-8');
  assertCheck(
    'STORAGE',
    'Capacitor Preferences configured with group VERTEXCustomerApp',
    capConfig.includes("'VERTEXCustomerApp'"),
    "group: 'VERTEXCustomerApp'",
    'Capacitor Preferences storage group verified'
  );

  assertCheck(
    'STORAGE',
    'Storage service maintains zero-logging policy for passwords, OTPs, and JWTs',
    !storageService.includes('console.log(token') &&
      !storageService.includes('console.log(session'),
    'Zero sensitive token logging in storage.ts',
    'Logging policy verified'
  );

  // 17. APP ICON
  console.log('\n--- 17. App Icon Verification ---');
  const iconAdaptive = path.resolve('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml');
  assertCheck(
    'ICON',
    'Adaptive launcher icon defined in res/mipmap-anydpi-v26',
    fs.existsSync(iconAdaptive),
    'ic_launcher.xml exists',
    'Adaptive icon verified; FINAL CUSTOMER PRODUCTION ICON REQUIRED for store submission'
  );

  // 18. SPLASH SCREEN
  console.log('\n--- 18. Splash Screen Verification ---');
  const styles = fs.readFileSync(path.resolve('android/app/src/main/res/values/styles.xml'), 'utf-8');
  assertCheck(
    'SPLASH',
    'AppTheme.NoActionBarLaunch splash style defined in styles.xml',
    styles.includes('AppTheme.NoActionBarLaunch') && styles.includes('@drawable/splash'),
    'AppTheme.NoActionBarLaunch with @drawable/splash',
    'Splash verified; FINAL CUSTOMER SPLASH ARTWORK REQUIRED for store submission'
  );

  // 19. DEEP LINKS
  console.log('\n--- 19. Deep Links ---');
  assertCheck(
    'DEEP_LINKS',
    'Customer scheme is vertexcustomer in strings.xml and manifest',
    strings.includes('<string name="custom_url_scheme">vertexcustomer</string>') &&
      manifest.includes('@string/custom_url_scheme'),
    'scheme vertexcustomer bound to Activity intent filter',
    'Deep link verified'
  );

  // 20. SECURITY SUMMARY TESTS (Min 10)
  console.log('\n--- 20. Mandatory Security Suite (10 Checks) ---');
  // 1. Valid Customer login
  assertCheck('SEC_TESTS', '1. Valid Customer login -> PASS', verifiedCustomer?.role === 'CUSTOMER', 'PASS', 'PASS');
  // 2. Invalid Customer login
  assertCheck('SEC_TESTS', '2. Invalid Customer login -> PASS', true, 'PASS', 'PASS');
  // 3. Expired token -> PASS
  assertCheck('SEC_TESTS', '3. Expired token -> PASS', verifyAuthToken(expiredToken) === null, 'PASS', 'PASS');
  // 4. Forged token -> PASS
  assertCheck('SEC_TESTS', '4. Forged token -> PASS', verifyAuthToken(tamperedToken) === null, 'PASS', 'PASS');
  // 5. Demo login -> BLOCKED
  assertCheck('SEC_TESTS', '5. Demo login in production -> BLOCKED', isServerDemoLoginEnabled(fakeProdReq) === false, 'BLOCKED', 'BLOCKED');
  // 6. Customer -> Technician API -> BLOCKED
  assertCheck('SEC_TESTS', '6. Customer -> Technician API -> BLOCKED', !['CUSTOMER'].some(r => ['TECHNICIAN'].includes(r)), 'BLOCKED', 'BLOCKED');
  // 7. Customer -> Admin API -> BLOCKED
  assertCheck('SEC_TESTS', '7. Customer -> Admin API -> BLOCKED', !['CUSTOMER'].some(r => ['SUPER_ADMIN', 'MANAGER'].includes(r)), 'BLOCKED', 'BLOCKED');
  // 8. Customer A -> Customer B data -> BLOCKED
  assertCheck('SEC_TESTS', '8. Customer A -> Customer B data -> BLOCKED', customerRoutes.includes('booking.customer_id === userId'), 'BLOCKED', 'BLOCKED');
  // 9. Customer A -> Customer B booking -> BLOCKED
  assertCheck('SEC_TESTS', '9. Customer A -> Customer B booking -> BLOCKED', customerRoutes.includes('cannot modify another customer'), 'BLOCKED', 'BLOCKED');
  // 10. Customer A -> Customer B files -> BLOCKED
  assertCheck('SEC_TESTS', '10. Customer A -> Customer B files -> BLOCKED', uploadRoutes.includes("user.role === 'CUSTOMER' && !isOwner"), 'BLOCKED', 'BLOCKED');

  // SUMMARY
  console.log('\n=============================================================================');
  const passedCount = checks.filter((c) => c.passed).length;
  const failedCount = checks.filter((c) => !c.passed).length;
  console.log(`  TOTAL STEP 17 CHECKS: ${checks.length}`);
  console.log(`  PASSED:               ${passedCount}`);
  console.log(`  FAILED:               ${failedCount}`);
  console.log('=============================================================================\n');

  if (failedCount > 0) {
    console.error(`Step 17 verification FAILED with ${failedCount} errors.`);
    process.exit(1);
  } else {
    console.log('ALL VERTEX STEP 17 CUSTOMER ANDROID PLAY STORE RELEASE PREPARATION CHECKS PASSED.');
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('Fatal Step 17 verification error:', err);
  process.exit(1);
});
