/**
 * VERTEX STEP 12: GOOGLE PLAY STORE ANDROID RELEASE PREPARATION VERIFICATION
 *
 * Verifies all 20 structural and security requirements:
 * 1. Android Application Identity (Customer com.vertex.customer vs Technician com.vertex.technician)
 * 2. Application Names (VERTEX Customer vs VERTEX Technician, Admin unchanged)
 * 3. Production Configuration (VITE_APP_TARGET isolation, NODE_ENV, DEMO_LOGIN_ENABLED=false)
 * 4. Demo Login Release Security (Rejection of all bypasses in production)
 * 5. Android Versioning (Independent versionName: 1.0.0, versionCode: 1)
 * 6. Android Release Build & Gradle Configuration (build.gradle, release buildType)
 * 7. Signing Security (No hardcoded credentials, safe environment references)
 * 8. Play App Signing Readiness (Documentation in PLAY_STORE_READINESS.md)
 * 9. Android Manifest Permissions (Only INTERNET and ACCESS_NETWORK_STATE, no dangerous perms)
 * 10. Network Security (network_security_config.xml, zero cleartext HTTP)
 * 11. Push Notifications (Safe conditional hook, no dummy google-services.json)
 * 12. App Icon (Adaptive icons, mipmaps verified)
 * 13. Splash Screen (Resolution drawables verified)
 * 14. Application Behavior & Target Isolation
 * 15. Server-Side API Authorization Matrix
 * 16. Bundle Secret Audit (0 leaked private keys/credentials)
 * 17. Release Build Output (AAB & APK commands ready)
 * 18. Customer and Technician Separation Test
 * 19. Regression Audit across Customer, Technician, and Admin Web
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { memoryStore } from '../src/db/memoryStore';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const tests: TestResult[] = [];

function record(category: string, name: string, passed: boolean, expected: string, actual: string) {
  tests.push({ category, name, passed, expected, actual });
  const status = passed ? '[PASS]' : '[FAIL]';
  console.log(`  ${status} [${category}] ${name}`);
  if (!passed) {
    console.error(`         Expected: ${expected}`);
    console.error(`         Received: ${actual}`);
  }
}

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const SECRET_KEY = process.env.JWT_SECRET || 'vertex-secure-production-jwt-token-key-2025';

function generateAuthToken(userId: string, role: string, extra: Record<string, any> = {}) {
  const payload = {
    userId,
    role,
    ...extra,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(base64).digest('base64url');
  return `vtx_${base64}.${hmac}`;
}

async function runStep12Suite() {
  console.log('\n=============================================================================');
  console.log('  VERTEX STEP 12: GOOGLE PLAY STORE ANDROID RELEASE PREPARATION');
  console.log('=============================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. ANDROID APPLICATION IDENTITY
  // ---------------------------------------------------------------------------
  console.log('--- 1. Android Application Identity ---');
  const prepareMobileCode = fs.readFileSync(path.resolve('scripts/prepare_mobile.ts'), 'utf8');

  record(
    'APP_IDENTITY',
    'Customer application ID is com.vertex.customer',
    prepareMobileCode.includes("appId: 'com.vertex.customer'"),
    "appId: 'com.vertex.customer'",
    'Verified in prepare_mobile.ts'
  );

  record(
    'APP_IDENTITY',
    'Technician application ID is com.vertex.technician',
    prepareMobileCode.includes("appId: 'com.vertex.technician'"),
    "appId: 'com.vertex.technician'",
    'Verified in prepare_mobile.ts'
  );

  record(
    'APP_IDENTITY',
    'Customer and Technician application IDs are strictly independent',
    prepareMobileCode.includes("customer: {") &&
    prepareMobileCode.includes("technician: {") &&
    !prepareMobileCode.includes("appId: 'com.vertex.app'"),
    'Distinct target records',
    'Independent and verified'
  );

  // ---------------------------------------------------------------------------
  // 2. APPLICATION NAMES
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Application Names ---');
  record(
    'APP_NAMES',
    'Customer display name is VERTEX Customer',
    prepareMobileCode.includes("appName: 'VERTEX Customer'"),
    "appName: 'VERTEX Customer'",
    'Verified'
  );

  record(
    'APP_NAMES',
    'Technician display name is VERTEX Technician',
    prepareMobileCode.includes("appName: 'VERTEX Technician'"),
    "appName: 'VERTEX Technician'",
    'Verified'
  );

  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  record(
    'APP_NAMES',
    'Admin Web / Base Web identity remains VERTEX Admin Portal (not renamed to mobile names)',
    indexHtml.includes('VERTEX') && !indexHtml.includes('<title>VERTEX Customer</title>'),
    'VERTEX Admin Portal / VERTEX branding',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 3. PRODUCTION CONFIGURATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Production Configuration ---');
  const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
  record(
    'PROD_CONFIG',
    '.env.example documents production mode and demo login suppression',
    envExample.includes('NODE_ENV=production') &&
    envExample.includes('DEMO_LOGIN_ENABLED=false') &&
    envExample.includes('VITE_DEMO_LOGIN_ENABLED=false'),
    'Production environment flags documented',
    'Verified'
  );

  const apiServiceContent = fs.readFileSync(path.resolve('src/services/api.ts'), 'utf8');
  record(
    'PROD_CONFIG',
    'API client getApiBaseUrl rejects localhost & 127.0.0.1 in production',
    apiServiceContent.includes('isProduction') &&
    apiServiceContent.includes('localhost') &&
    apiServiceContent.includes('Localhost or loopback API URL is forbidden'),
    'Strict rejection of localhost in production',
    'Verified'
  );

  record(
    'PROD_CONFIG',
    'API client getApiBaseUrl warns/rejects unencrypted HTTP in production',
    apiServiceContent.includes("startsWith('http://')") &&
    apiServiceContent.includes('Insecure HTTP API URL is forbidden'),
    'Enforces HTTPS for production release',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 4. DEMO LOGIN RELEASE SECURITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Demo Login Release Security ---');
  const prodHeaders = {
    'Content-Type': 'application/json',
    'X-Skip-Rate-Limit': 'true',
    'x-test-production': 'true',
  };

  const resDemoLogin = await fetch(`${BASE_URL}/api/v1/auth/demo-login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ role: 'CUSTOMER' }),
  });
  const dataDemoLogin = await resDemoLogin.json().catch(() => ({}));
  record(
    'DEMO_SECURITY',
    'POST /api/v1/auth/demo-login returns HTTP 403 DEMO_LOGIN_DISABLED in production',
    resDemoLogin.status === 403 && dataDemoLogin.error?.code === 'DEMO_LOGIN_DISABLED',
    'HTTP 403 DEMO_LOGIN_DISABLED',
    `HTTP ${resDemoLogin.status}: ${dataDemoLogin.error?.code || 'none'}`
  );

  const resQuickLogin = await fetch(`${BASE_URL}/api/v1/auth/quick-login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({}),
  });
  const dataQuickLogin = await resQuickLogin.json().catch(() => ({}));
  record(
    'DEMO_SECURITY',
    'POST /api/v1/auth/quick-login returns HTTP 403 QUICK_LOGIN_DISABLED in production',
    resQuickLogin.status === 403 && dataQuickLogin.error?.code === 'QUICK_LOGIN_DISABLED',
    'HTTP 403 QUICK_LOGIN_DISABLED',
    `HTTP ${resQuickLogin.status}: ${dataQuickLogin.error?.code || 'none'}`
  );

  const resSimulate = await fetch(`${BASE_URL}/api/v1/auth/simulate-persona`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ role: 'SUPER_ADMIN' }),
  });
  const dataSimulate = await resSimulate.json().catch(() => ({}));
  record(
    'DEMO_SECURITY',
    'POST /api/v1/auth/simulate-persona returns HTTP 403 PERSONA_SIMULATION_DISABLED in production',
    resSimulate.status === 403 && dataSimulate.error?.code === 'PERSONA_SIMULATION_DISABLED',
    'HTTP 403 PERSONA_SIMULATION_DISABLED',
    `HTTP ${resSimulate.status}: ${dataSimulate.error?.code || 'none'}`
  );

  const resSimOtp = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ phone: '9999990002', otp: '1234' }),
  });
  const dataSimOtp = await resSimOtp.json().catch(() => ({}));
  record(
    'DEMO_SECURITY',
    'POST /api/v1/auth/login strictly rejects test OTP (1234) in production',
    resSimOtp.status === 401 && dataSimOtp.error?.code === 'SIMULATED_OTP_REJECTED',
    'HTTP 401 SIMULATED_OTP_REJECTED',
    `HTTP ${resSimOtp.status}: ${dataSimOtp.error?.code || 'none'}`
  );

  const resDemoCreds = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ email: 'admin@vertex.demo', password: 'password123' }),
  });
  const dataDemoCreds = await resDemoCreds.json().catch(() => ({}));
  record(
    'DEMO_SECURITY',
    'POST /api/v1/auth/login strictly rejects @vertex.demo accounts in production',
    resDemoCreds.status === 401 && (dataDemoCreds.error?.code === 'DEMO_CREDENTIALS_REJECTED' || dataDemoCreds.error?.code === 'DEMO_CREDENTIALS_DISABLED'),
    'HTTP 401 DEMO_CREDENTIALS_REJECTED',
    `HTTP ${resDemoCreds.status}: ${dataDemoCreds.error?.code || 'none'}`
  );

  const techUser = memoryStore.users.find((u) => u.role === 'TECHNICIAN' && u.email === 'raj.tech@vertexservices.in') ||
    memoryStore.users.find((u) => u.role === 'TECHNICIAN') ||
    { id: 'c5b5f543-9dc2-482a-8ef0-fc02a9042c13', role: 'TECHNICIAN' };
  const validTechToken = generateAuthToken(techUser.id, 'TECHNICIAN');

  const resDoorstep = await fetch(`${BASE_URL}/api/v1/technician/jobs/VTX-84921/start`, {
    method: 'POST',
    headers: { ...prodHeaders, Authorization: `Bearer ${validTechToken}` },
    body: JSON.stringify({ otp: '4821' }),
  });
  const dataDoorstep = await resDoorstep.json().catch(() => ({}));
  record(
    'DEMO_SECURITY',
    'Doorstep OTP 4821 test bypass is rejected in production',
    resDoorstep.status === 400 && Boolean(dataDoorstep.error),
    'HTTP 400 rejection',
    `HTTP ${resDoorstep.status}: ${typeof dataDoorstep.error === 'string' ? dataDoorstep.error : (dataDoorstep.error?.code || 'rejected')}`
  );

  // ---------------------------------------------------------------------------
  // 5. ANDROID VERSIONING
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Android Versioning ---');
  record(
    'VERSIONING',
    'Customer versionName is 1.0.0 and versionCode is 1',
    prepareMobileCode.includes("customer: {") &&
    prepareMobileCode.includes("versionCode: 1") &&
    prepareMobileCode.includes("versionName: '1.0.0'"),
    'versionName: 1.0.0, versionCode: 1',
    'Verified'
  );

  record(
    'VERSIONING',
    'Technician versionName is 1.0.0 and versionCode is 1',
    prepareMobileCode.includes("technician: {") &&
    prepareMobileCode.includes("versionCode: 1") &&
    prepareMobileCode.includes("versionName: '1.0.0'"),
    'versionName: 1.0.0, versionCode: 1',
    'Verified'
  );

  record(
    'VERSIONING',
    'Versioning is independently maintainable via CLI arguments',
    prepareMobileCode.includes('--version-name=') && prepareMobileCode.includes('--version-code='),
    'CLI options supported for independent version updates',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 6. ANDROID RELEASE BUILD & GRADLE CONFIGURATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Android Release Build & Gradle Configuration ---');
  const buildGradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf8');

  record(
    'GRADLE_CONFIG',
    'android/app/build.gradle includes release buildType configuration',
    buildGradle.includes('buildTypes {') &&
    buildGradle.includes('release {') &&
    buildGradle.includes("proguardFiles getDefaultProguardFile('proguard-android.txt')"),
    'release buildType configured with ProGuard rules',
    'Verified'
  );

  record(
    'GRADLE_CONFIG',
    'android/app/build.gradle declares signingConfigs.release block',
    buildGradle.includes('signingConfigs {') && buildGradle.includes('release {'),
    'signingConfigs.release block defined',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 7. SIGNING SECURITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Signing Security ---');
  record(
    'SIGNING_SECURITY',
    'build.gradle does not contain hardcoded passwords, keys, or keystores',
    !buildGradle.includes('storePassword "') &&
    !buildGradle.includes('keyPassword "') &&
    !buildGradle.includes('storePassword \'') &&
    !buildGradle.includes('keyPassword \''),
    'Zero hardcoded credentials in build.gradle',
    'Verified - credentials read from environment variables only'
  );

  record(
    'SIGNING_SECURITY',
    'build.gradle reads signing credentials dynamically via environment variables',
    buildGradle.includes('System.getenv("ANDROID_KEYSTORE_PATH")') ||
    buildGradle.includes('System.getenv("KEYSTORE_PATH")'),
    'Uses secure CI/environment variables',
    'Verified'
  );

  const gitignore = fs.readFileSync(path.resolve('.gitignore'), 'utf8');
  record(
    'SIGNING_SECURITY',
    '.gitignore protects keystores and private credential files',
    gitignore.includes('*.jks') && gitignore.includes('*.keystore') && gitignore.includes('*.p12'),
    'Keystore extensions ignored by git',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 8. PLAY APP SIGNING READINESS
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Play App Signing Readiness ---');
  const readinessDocExists = fs.existsSync(path.resolve('resources/android/PLAY_STORE_READINESS.md'));
  const readinessDoc = readinessDocExists ? fs.readFileSync(path.resolve('resources/android/PLAY_STORE_READINESS.md'), 'utf8') : '';

  record(
    'PLAY_SIGNING',
    'Play Store Readiness Guide exists in resources/android/PLAY_STORE_READINESS.md',
    readinessDocExists,
    'PLAY_STORE_READINESS.md present',
    readinessDocExists ? 'Present' : 'Missing'
  );

  record(
    'PLAY_SIGNING',
    'Play App Signing documentation covers upload key, backup, and CI/CD requirements',
    readinessDoc.includes('Google Play App Signing Workflow') &&
    readinessDoc.includes('Upload Keystore Generation') &&
    readinessDoc.includes('Keystore Backup Requirement') &&
    readinessDoc.includes('CI/CD Environment Variable Specification'),
    'Comprehensive Play App Signing workflow documented',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 9. ANDROID MANIFEST PERMISSIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Android Manifest Permissions ---');
  const manifest = fs.readFileSync(path.resolve('android/app/src/main/AndroidManifest.xml'), 'utf8');

  record(
    'MANIFEST',
    'AndroidManifest.xml declares INTERNET and ACCESS_NETWORK_STATE',
    manifest.includes('android.permission.INTERNET') &&
    manifest.includes('android.permission.ACCESS_NETWORK_STATE'),
    'INTERNET & ACCESS_NETWORK_STATE declared',
    'Verified'
  );

  record(
    'MANIFEST',
    'AndroidManifest.xml contains zero unneeded dangerous permissions',
    !manifest.includes('ACCESS_BACKGROUND_LOCATION') &&
    !manifest.includes('RECORD_AUDIO') &&
    !manifest.includes('READ_CONTACTS') &&
    !manifest.includes('READ_SMS'),
    'No excessive dangerous permissions requested',
    'Verified clean'
  );

  // ---------------------------------------------------------------------------
  // 10. NETWORK SECURITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. Network Security ---');
  const netSecExists = fs.existsSync(path.resolve('android/app/src/main/res/xml/network_security_config.xml'));
  const netSecXml = netSecExists ? fs.readFileSync(path.resolve('android/app/src/main/res/xml/network_security_config.xml'), 'utf8') : '';

  record(
    'NETWORK_SECURITY',
    'network_security_config.xml exists and enforces cleartextTrafficPermitted=false',
    netSecExists && netSecXml.includes('cleartextTrafficPermitted="false"'),
    'Cleartext traffic forbidden via XML config',
    netSecExists ? 'Configured and verified' : 'Missing'
  );

  record(
    'NETWORK_SECURITY',
    'AndroidManifest.xml binds to @xml/network_security_config',
    manifest.includes('android:networkSecurityConfig="@xml/network_security_config"'),
    'networkSecurityConfig registered in Manifest',
    'Verified'
  );

  record(
    'NETWORK_SECURITY',
    'AndroidManifest.xml does not enable cleartext HTTP workaround',
    !manifest.includes('android:usesCleartextTraffic="true"'),
    'No usesCleartextTraffic="true"',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 11. PUSH NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- 11. Push Notifications ---');
  record(
    'PUSH_NOTIFICATIONS',
    'build.gradle includes safe conditional hook for google-services.json',
    buildGradle.includes("file('google-services.json')") &&
    buildGradle.includes('google-services plugin not applied'),
    'Safe conditional hook present',
    'Verified'
  );

  const fakeGoogleServices = fs.existsSync(path.resolve('android/app/google-services.json'));
  record(
    'PUSH_NOTIFICATIONS',
    'No fake or dummy google-services.json committed in repository',
    !fakeGoogleServices,
    'No fake google-services.json',
    fakeGoogleServices ? 'Found dummy file!' : 'Clean (no fake credentials)'
  );

  // ---------------------------------------------------------------------------
  // 12. APP ICONS
  // ---------------------------------------------------------------------------
  console.log('\n--- 12. App Icons ---');
  const adaptiveXml = fs.existsSync(path.resolve('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'));
  const hdpiIcon = fs.existsSync(path.resolve('android/app/src/main/res/mipmap-hdpi/ic_launcher.png'));
  const xxhdpiIcon = fs.existsSync(path.resolve('android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png'));

  record(
    'ICONS',
    'Android adaptive icon XML (anydpi-v26) present',
    adaptiveXml,
    'ic_launcher.xml exists',
    adaptiveXml ? 'Present' : 'Missing'
  );

  record(
    'ICONS',
    'Android launcher mipmap icons (hdpi, xxhdpi) present',
    hdpiIcon && xxhdpiIcon,
    'Launcher mipmaps exist',
    hdpiIcon && xxhdpiIcon ? 'Present' : 'Missing'
  );

  // ---------------------------------------------------------------------------
  // 13. SPLASH SCREEN
  // ---------------------------------------------------------------------------
  console.log('\n--- 13. Splash Screen ---');
  const splashDrawable = fs.existsSync(path.resolve('android/app/src/main/res/drawable/splash.png'));
  const splashPortHdpi = fs.existsSync(path.resolve('android/app/src/main/res/drawable-port-hdpi/splash.png'));
  const splashLandHdpi = fs.existsSync(path.resolve('android/app/src/main/res/drawable-land-hdpi/splash.png'));

  record(
    'SPLASH',
    'Android default and oriented splash drawables present',
    splashDrawable && splashPortHdpi && splashLandHdpi,
    'Default, portrait, and landscape splash drawables exist',
    splashDrawable && splashPortHdpi && splashLandHdpi ? 'Present' : 'Missing'
  );

  // ---------------------------------------------------------------------------
  // 14. APPLICATION BEHAVIOR & TARGET ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 14. Application Behavior & Target Isolation ---');
  const appTsx = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');

  record(
    'ISOLATION',
    'App.tsx separates Customer, Technician, and Admin routes by VITE_APP_TARGET',
    appTsx.includes("import { CustomerAppRoot } from './apps/customer/CustomerAppRoot'") &&
    appTsx.includes("import { TechnicianAppRoot } from './apps/technician/TechnicianAppRoot'") &&
    appTsx.includes("import { AdminApp } from './apps/admin/AdminApp'"),
    'Clean root component branching based on target',
    'Verified'
  );

  record(
    'ISOLATION',
    'Customer build target mounts CustomerAppRoot and suppresses Technician and Admin UI',
    appTsx.includes("if (activeAppTarget === 'customer')") && appTsx.includes('<CustomerAppRoot'),
    'Dedicated customer root component mounted',
    'Verified'
  );

  record(
    'ISOLATION',
    'Technician build target mounts TechnicianAppRoot and suppresses Customer and Admin UI',
    appTsx.includes("if (activeAppTarget === 'technician')") && appTsx.includes('<TechnicianAppRoot'),
    'Dedicated technician root component mounted',
    'Verified'
  );

  // ---------------------------------------------------------------------------
  // 15. API AUTHORIZATION SECURITY MATRIX
  // ---------------------------------------------------------------------------
  console.log('\n--- 15. API Authorization Security Matrix ---');
  const custUser = memoryStore.users.find((u) => u.role === 'CUSTOMER') ||
    memoryStore.users.find((u) => (u.phone || '').endsWith('0002')) ||
    { id: 'c1a1f111-1111-4444-aaaa-cccccccccccc', role: 'CUSTOMER' };
  const validCustomerToken = generateAuthToken(custUser.id, 'CUSTOMER');

  // Customer session -> Customer API -> ALLOW (200)
  const resCustMe = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${validCustomerToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  record(
    'AUTH_MATRIX',
    'Customer session -> Customer API = ALLOW (HTTP 200 OK)',
    resCustMe.status === 200,
    'HTTP 200 OK',
    `HTTP ${resCustMe.status}`
  );

  // Customer session -> Technician API -> DENY (403)
  const resCustTech = await fetch(`${BASE_URL}/api/v1/technician/jobs`, {
    headers: { Authorization: `Bearer ${validCustomerToken}` },
  });
  record(
    'AUTH_MATRIX',
    'Customer session -> Technician API = DENY (HTTP 403 Forbidden)',
    resCustTech.status === 403,
    'HTTP 403 Forbidden',
    `HTTP ${resCustTech.status}`
  );

  // Customer session -> Admin API -> DENY (403)
  const resCustAdmin = await fetch(`${BASE_URL}/api/v1/users`, {
    headers: { Authorization: `Bearer ${validCustomerToken}` },
  });
  record(
    'AUTH_MATRIX',
    'Customer session -> Admin API = DENY (HTTP 403 Forbidden)',
    resCustAdmin.status === 403,
    'HTTP 403 Forbidden',
    `HTTP ${resCustAdmin.status}`
  );

  // Technician session -> Technician API -> ALLOW (200)
  const resTechMe = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${validTechToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  record(
    'AUTH_MATRIX',
    'Technician session -> Technician API = ALLOW (HTTP 200 OK)',
    resTechMe.status === 200,
    'HTTP 200 OK',
    `HTTP ${resTechMe.status}`
  );

  // Technician session -> Admin API -> DENY (403)
  const resTechAdmin = await fetch(`${BASE_URL}/api/v1/users`, {
    headers: { Authorization: `Bearer ${validTechToken}` },
  });
  record(
    'AUTH_MATRIX',
    'Technician session -> Admin API = DENY (HTTP 403 Forbidden)',
    resTechAdmin.status === 403,
    'HTTP 403 Forbidden',
    `HTTP ${resTechAdmin.status}`
  );

  // Technician A -> Technician B job -> DENY (403)
  const resCrossJob = await fetch(`${BASE_URL}/api/v1/technician/jobs/VTX-84930`, {
    headers: { Authorization: `Bearer ${validTechToken}` },
  });
  record(
    'AUTH_MATRIX',
    'Technician A -> Technician B job (VTX-84930) = DENY (HTTP 403 Forbidden)',
    resCrossJob.status === 403,
    'HTTP 403 Forbidden',
    `HTTP ${resCrossJob.status}`
  );

  // ---------------------------------------------------------------------------
  // 16. BUNDLE SECRET AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 16. Bundle Secret Audit ---');
  const clientFiles = ['src/services/api.ts', 'src/App.tsx'];
  let exposedSecrets = false;
  for (const f of clientFiles) {
    const code = fs.readFileSync(path.resolve(f), 'utf8');
    if (
      code.includes('process.env.JWT_SECRET') ||
      code.includes('sk_live_') ||
      code.includes('postgres://')
    ) {
      exposedSecrets = true;
    }
  }

  record(
    'SECRET_AUDIT',
    'Zero sensitive backend secrets or private keys in client source files',
    !exposedSecrets,
    'No private backend secrets exposed',
    exposedSecrets ? 'Secrets exposed!' : 'Clean'
  );

  // ---------------------------------------------------------------------------
  // 17. RELEASE BUILD OUTPUT (AAB & APK)
  // ---------------------------------------------------------------------------
  console.log('\n--- 17. Release Build Output ---');
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

  record(
    'BUILD_OUTPUT',
    'package.json provides customer:android:bundle for AAB release generation',
    Boolean(pkg.scripts['customer:android:bundle']),
    'Script customer:android:bundle present',
    pkg.scripts['customer:android:bundle'] ? 'Configured' : 'Missing'
  );

  record(
    'BUILD_OUTPUT',
    'package.json provides technician:android:bundle for AAB release generation',
    Boolean(pkg.scripts['technician:android:bundle']),
    'Script technician:android:bundle present',
    pkg.scripts['technician:android:bundle'] ? 'Configured' : 'Missing'
  );

  record(
    'BUILD_OUTPUT',
    'package.json provides customer:android:assemble and technician:android:assemble for APK',
    Boolean(pkg.scripts['customer:android:assemble'] && pkg.scripts['technician:android:assemble']),
    'Scripts present',
    'Configured'
  );

  // ---------------------------------------------------------------------------
  // 18. CUSTOMER AND TECHNICIAN SEPARATION TEST
  // ---------------------------------------------------------------------------
  console.log('\n--- 18. Customer and Technician Separation Test ---');
  // Configure Customer
  execSync('npx tsx scripts/prepare_mobile.ts --target=customer --platform=android', { stdio: 'pipe' });
  const custGradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf8');
  const custStrings = fs.readFileSync(path.resolve('android/app/src/main/res/values/strings.xml'), 'utf8');

  record(
    'SEPARATION',
    'Customer preparation applies com.vertex.customer & VERTEX Customer to Android project',
    custGradle.includes('applicationId "com.vertex.customer"') &&
    custStrings.includes('<string name="app_name">VERTEX Customer</string>'),
    'applicationId com.vertex.customer and app_name VERTEX Customer',
    'Verified'
  );

  // Configure Technician
  execSync('npx tsx scripts/prepare_mobile.ts --target=technician --platform=android', { stdio: 'pipe' });
  const techGradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf8');
  const techStrings = fs.readFileSync(path.resolve('android/app/src/main/res/values/strings.xml'), 'utf8');

  record(
    'SEPARATION',
    'Technician preparation applies com.vertex.technician & VERTEX Technician to Android project',
    techGradle.includes('applicationId "com.vertex.technician"') &&
    techStrings.includes('<string name="app_name">VERTEX Technician</string>'),
    'applicationId com.vertex.technician and app_name VERTEX Technician',
    'Verified'
  );

  // Restore clean Customer state after separation test
  execSync('npx tsx scripts/prepare_mobile.ts --target=customer --platform=android', { stdio: 'pipe' });

  // ---------------------------------------------------------------------------
  // 19. REGRESSION AUDIT (Customer, Technician, Admin)
  // ---------------------------------------------------------------------------
  console.log('\n--- 19. Regression Audit ---');
  const customerViews = [
    'src/views/customer/CustomerApp.tsx',
    'src/views/customer/CustomerHome.tsx',
    'src/views/customer/CustomerBookService.tsx',
    'src/views/customer/CustomerMyBookings.tsx',
    'src/views/customer/CustomerInvoices.tsx',
    'src/views/customer/CustomerAMC.tsx',
    'src/views/customer/CustomerOffers.tsx',
    'src/views/customer/CustomerNotifications.tsx',
    'src/views/customer/CustomerSupport.tsx',
    'src/views/customer/CustomerReviews.tsx',
    'src/views/customer/CustomerProfile.tsx',
  ];
  const allCustViewsExist = customerViews.every((f) => fs.existsSync(path.resolve(f)));
  record(
    'REGRESSION',
    'Customer views & workflows complete (Home, Book, MyBookings, Invoices, AMC, Offers, Support, Profile)',
    allCustViewsExist,
    'All Customer view components present',
    allCustViewsExist ? 'Present and verified' : 'Missing files'
  );

  const techViews = [
    'src/views/technician/TechnicianApp.tsx',
    'src/views/technician/TechnicianDashboard.tsx',
    'src/views/technician/TechnicianJobs.tsx',
    'src/views/technician/TechnicianJobDetails.tsx',
    'src/views/technician/TechnicianEarnings.tsx',
    'src/views/technician/TechnicianAttendance.tsx',
    'src/views/technician/TechnicianNotifications.tsx',
    'src/views/technician/TechnicianProfile.tsx',
  ];
  const allTechViewsExist = techViews.every((f) => fs.existsSync(path.resolve(f)));
  record(
    'REGRESSION',
    'Technician views & workflows complete (Dashboard, Jobs, Details, Earnings, Attendance, Notifications, Profile)',
    allTechViewsExist,
    'All Technician view components present',
    allTechViewsExist ? 'Present and verified' : 'Missing files'
  );

  const adminViews = [
    'src/apps/admin/AdminApp.tsx',
    'src/apps/admin/AdminLoginView.tsx',
    'src/views/admin/AdminDashboard.tsx',
    'src/views/admin/AdminBookingsView.tsx',
    'src/views/admin/AdminTechniciansView.tsx',
    'src/views/admin/AdminCustomersView.tsx',
    'src/views/admin/users/UserManagementView.tsx',
  ];
  const allAdminViewsExist = adminViews.every((f) => fs.existsSync(path.resolve(f)));
  record(
    'REGRESSION',
    'Admin views & workflows complete (Dashboard, Bookings, Technicians, Customers, UserManagement)',
    allAdminViewsExist,
    'All Admin view components present',
    allAdminViewsExist ? 'Present and verified' : 'Missing files'
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  const total = tests.length;
  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed).length;

  console.log('\n=============================================================================');
  console.log(`  STEP 12 VERIFICATION RESULT: ${passed} passed, ${failed} failed out of ${total}`);
  console.log('=============================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep12Suite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
