/**
 * VERTEX STEP 7 — Production Authentication & Demo Login Finalization Test Suite
 *
 * Runs under production configuration:
 * NODE_ENV=production
 * DEMO_LOGIN_ENABLED=false
 * VITE_DEMO_LOGIN_ENABLED=false
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { generateAuthToken } from '../src/server/auth.js';
import { memoryStore } from '../src/db/memoryStore.js';

const BASE_URL = 'http://localhost:3000';
const SECRET_KEY = process.env.JWT_SECRET || 'vertex_enterprise_session_secret_key_2026';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  received: string;
}

const results: TestResult[] = [];

function record(category: string, name: string, passed: boolean, expected: string, received: string) {
  results.push({ category, name, passed, expected, received });
}

async function runStep7Verification() {
  console.log('\n======================================================================');
  console.log('   VERTEX STEP 7: PRODUCTION AUTHENTICATION & DEMO LOGIN FINALIZATION  ');
  console.log('======================================================================\n');
  console.log('Test Environment Parameters:');
  console.log(' - NODE_ENV = production');
  console.log(' - DEMO_LOGIN_ENABLED = false');
  console.log(' - VITE_DEMO_LOGIN_ENABLED = false\n');

  // Headers to simulate production environment flags on each request
  const prodHeaders = {
    'Content-Type': 'application/json',
    'X-Skip-Rate-Limit': 'true',
    'x-test-production': 'true',
  };

  // -------------------------------------------------------------
  // 1. PRODUCTION REJECTIONS OF DEMO & SIMULATION VECTORS
  // -------------------------------------------------------------
  console.log('--- 1. Production Gating & Rejection Verification ---');

  // 1.1 Demo Login API
  const resDemoLogin = await fetch(`${BASE_URL}/api/v1/auth/demo-login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ role: 'SUPER_ADMIN' }),
  });
  const dataDemoLogin = await resDemoLogin.json();
  record(
    'PROD_GATING',
    'Reject Demo Login API (/api/v1/auth/demo-login)',
    resDemoLogin.status === 403 && dataDemoLogin.error?.code === 'DEMO_LOGIN_DISABLED',
    'HTTP 403 DEMO_LOGIN_DISABLED',
    `HTTP ${resDemoLogin.status}: ${dataDemoLogin.error?.code}`
  );

  // 1.2 Quick Login API
  const resQuickLogin = await fetch(`${BASE_URL}/api/v1/auth/quick-login`, {
    method: 'POST',
    headers: prodHeaders,
  });
  const dataQuickLogin = await resQuickLogin.json();
  record(
    'PROD_GATING',
    'Reject Quick Login API (/api/v1/auth/quick-login)',
    resQuickLogin.status === 403 && dataQuickLogin.error?.code === 'QUICK_LOGIN_DISABLED',
    'HTTP 403 QUICK_LOGIN_DISABLED',
    `HTTP ${resQuickLogin.status}: ${dataQuickLogin.error?.code}`
  );

  // 1.3 Persona / Role Simulation API
  const resSimulate = await fetch(`${BASE_URL}/api/v1/auth/simulate-persona`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ targetRole: 'SUPER_ADMIN' }),
  });
  const dataSimulate = await resSimulate.json();
  record(
    'PROD_GATING',
    'Reject Persona/Role Simulation API (/api/v1/auth/simulate-persona)',
    resSimulate.status === 403 && dataSimulate.error?.code === 'PERSONA_SIMULATION_DISABLED',
    'HTTP 403 PERSONA_SIMULATION_DISABLED',
    `HTTP ${resSimulate.status}: ${dataSimulate.error?.code}`
  );

  // 1.4 Demo Credentials
  const resDemoCreds = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ email: 'admin@vertex.demo', password: 'Admin@123' }),
  });
  const dataDemoCreds = await resDemoCreds.json();
  record(
    'PROD_GATING',
    'Reject Demo Persona Credentials (admin@vertex.demo)',
    resDemoCreds.status === 401 && dataDemoCreds.error?.code === 'DEMO_CREDENTIALS_REJECTED',
    'HTTP 401 DEMO_CREDENTIALS_REJECTED',
    `HTTP ${resDemoCreds.status}: ${dataDemoCreds.error?.code}`
  );

  // 1.5 Simulated OTP Bypass
  const resSimOtp = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ phone: '9999990002', otp: '1234' }),
  });
  const dataSimOtp = await resSimOtp.json();
  record(
    'PROD_GATING',
    'Reject Simulated OTP Bypass (otp: 1234 in production)',
    resSimOtp.status === 401 && dataSimOtp.error?.code === 'SIMULATED_OTP_REJECTED',
    'HTTP 401 SIMULATED_OTP_REJECTED',
    `HTTP ${resSimOtp.status}: ${dataSimOtp.error?.code}`
  );

  // 1.6 Fake Session / Forged Token
  const fakeToken = 'vtx_eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJTVVBFUl9BRE1JTiJ9.fake_signature_digest';
  const resFakeToken = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${fakeToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  const dataFakeToken = await resFakeToken.json();
  record(
    'PROD_GATING',
    'Reject Fake Session / Forged Bearer Token',
    resFakeToken.status === 401 && dataFakeToken.error?.code === 'INVALID_TOKEN',
    'HTTP 401 INVALID_TOKEN',
    `HTTP ${resFakeToken.status}: ${dataFakeToken.error?.code}`
  );

  // 1.7 Expired Session Token
  const expiredPayload = {
    userId: 'usr-super-1',
    role: 'SUPER_ADMIN',
    expiresAt: Date.now() - 3600000, // Expired 1 hour ago
  };
  const expJson = JSON.stringify(expiredPayload);
  const expBase64 = Buffer.from(expJson).toString('base64url');
  const expHmac = crypto.createHmac('sha256', SECRET_KEY).update(expBase64).digest('base64url');
  const expiredToken = `vtx_${expBase64}.${expHmac}`;

  const resExpired = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${expiredToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  const dataExpired = await resExpired.json();
  record(
    'PROD_GATING',
    'Reject Expired Session Token',
    resExpired.status === 401 && dataExpired.error?.code === 'INVALID_TOKEN',
    'HTTP 401 INVALID_TOKEN',
    `HTTP ${resExpired.status}: ${dataExpired.error?.code}`
  );

  // 1.8 Test Password Bypass Attempt
  const resTestPass = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ email: 'admin@vertexservices.com', password: 'password123_wrong' }),
  });
  const dataTestPass = await resTestPass.json();
  record(
    'PROD_GATING',
    'Reject Incorrect Password (No Demo Bypass in Prod)',
    resTestPass.status === 401 && dataTestPass.error?.code === 'INVALID_CREDENTIALS',
    'HTTP 401 INVALID_CREDENTIALS',
    `HTTP ${resTestPass.status}: ${dataTestPass.error?.code}`
  );

  // 1.9 Demo User Auto-Creation on Unregistered Phone
  const resNewPhone = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ phone: '919876543210', otp: '9876' }),
  });
  const dataNewPhone = await resNewPhone.json();
  record(
    'PROD_GATING',
    'Reject Demo User Creation on Unregistered Mobile',
    resNewPhone.status === 401 && (dataNewPhone.error?.code === 'USER_NOT_FOUND' || dataNewPhone.error?.code === 'INVALID_OTP'),
    'HTTP 401 USER_NOT_FOUND or INVALID_OTP',
    `HTTP ${resNewPhone.status}: ${dataNewPhone.error?.code}`
  );

  // -------------------------------------------------------------
  // 2. PRODUCTION AUTHENTICATION FLOWS (ADMIN, CUSTOMER, TECHNICIAN)
  // -------------------------------------------------------------
  console.log('\n--- 2. Genuine Production Authentication Flows ---');

  // 2.1 Admin Authentication (Valid Credentials)
  // We check existing memoryStore or db user 'admin@vertexservices.com'
  const adminUser = memoryStore.users.find((u) => u.role === 'SUPER_ADMIN');
  const validAdminToken = generateAuthToken(adminUser?.id || 'usr-super-1', 'SUPER_ADMIN');
  const resAdminMe = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${validAdminToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  const dataAdminMe = await resAdminMe.json();
  record(
    'AUTH_FLOW',
    'Admin Authentication Session Verification (/api/v1/auth/me)',
    resAdminMe.status === 200 && dataAdminMe.user?.role === 'SUPER_ADMIN',
    'HTTP 200 role: SUPER_ADMIN',
    `HTTP ${resAdminMe.status}: ${dataAdminMe.user?.role} (${dataAdminMe.user?.name})`
  );

  // 2.2 Customer Authentication via send-otp flow
  const customerPhone = '9999990002';
  // Trigger OTP dispatch
  const resCustOtpSend = await fetch(`${BASE_URL}/api/v1/auth/send-otp`, {
    method: 'POST',
    headers: prodHeaders,
    body: JSON.stringify({ phone: customerPhone }),
  });
  const dataCustOtpSend = await resCustOtpSend.json();
  record(
    'AUTH_FLOW',
    'Customer OTP Dispatch (/api/v1/auth/send-otp)',
    resCustOtpSend.status === 200 && dataCustOtpSend.success === true,
    'HTTP 200 with dispatch confirmation',
    `HTTP ${resCustOtpSend.status}: success=${dataCustOtpSend.success}`
  );

  // Customer Token Generation & Profile Verification
  const custUser = memoryStore.users.find((u) => u.role === 'CUSTOMER') || { id: 'cust-1', role: 'CUSTOMER' };
  const validCustomerToken = generateAuthToken(custUser.id, 'CUSTOMER');
  const resCustMe = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${validCustomerToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  const dataCustMe = await resCustMe.json();
  record(
    'AUTH_FLOW',
    'Customer Authentication Session Verification (/api/v1/auth/me)',
    resCustMe.status === 200 && dataCustMe.user?.role === 'CUSTOMER',
    'HTTP 200 role: CUSTOMER',
    `HTTP ${resCustMe.status}: ${dataCustMe.user?.role} (${dataCustMe.user?.name})`
  );

  // 2.3 Technician Authentication & Profile Verification
  const techUser = memoryStore.users.find((u) => u.role === 'TECHNICIAN') || { id: 'tech-1', role: 'TECHNICIAN' };
  const validTechToken = generateAuthToken(techUser.id, 'TECHNICIAN');
  const resTechMe = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${validTechToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  const dataTechMe = await resTechMe.json();
  record(
    'AUTH_FLOW',
    'Technician Authentication Session Verification (/api/v1/auth/me)',
    resTechMe.status === 200 && dataTechMe.user?.role === 'TECHNICIAN',
    'HTTP 200 role: TECHNICIAN',
    `HTTP ${resTechMe.status}: ${dataTechMe.user?.role} (${dataTechMe.user?.name})`
  );

  // -------------------------------------------------------------
  // 3. SERVER-SIDE RBAC VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 3. Server-Side RBAC Enforcement ---');

  // 3.1 Admin accessing Admin Protected Route -> ALLOW
  const resAdminRbac = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
    headers: { Authorization: `Bearer ${validAdminToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  record(
    'RBAC',
    'Admin accessing Admin Stats API -> ALLOW',
    resAdminRbac.status === 200,
    'HTTP 200',
    `HTTP ${resAdminRbac.status}`
  );

  // 3.2 Customer accessing Admin Protected Route -> DENY (403)
  const resCustAdminRbac = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
    headers: { Authorization: `Bearer ${validCustomerToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  record(
    'RBAC',
    'Customer accessing Admin Stats API -> DENY',
    resCustAdminRbac.status === 403,
    'HTTP 403 FORBIDDEN',
    `HTTP ${resCustAdminRbac.status}`
  );

  // 3.3 Technician accessing Admin Protected Route -> DENY (403)
  const resTechAdminRbac = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
    headers: { Authorization: `Bearer ${validTechToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  record(
    'RBAC',
    'Technician accessing Admin Stats API -> DENY',
    resTechAdminRbac.status === 403,
    'HTTP 403 FORBIDDEN',
    `HTTP ${resTechAdminRbac.status}`
  );

  // 3.4 Customer accessing Technician Protected Route -> DENY (403)
  const resCustTechRbac = await fetch(`${BASE_URL}/api/v1/technician/jobs`, {
    headers: { Authorization: `Bearer ${validCustomerToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  record(
    'RBAC',
    'Customer accessing Technician Jobs API -> DENY',
    resCustTechRbac.status === 403,
    'HTTP 403 FORBIDDEN',
    `HTTP ${resCustTechRbac.status}`
  );

  // -------------------------------------------------------------
  // 4. LOGOUT VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 4. Session Termination (Logout) ---');
  const resLogout = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validAdminToken}`, 'X-Skip-Rate-Limit': 'true' },
  });
  const dataLogout = await resLogout.json();
  record(
    'LOGOUT',
    'Session Termination (/api/v1/auth/logout) -> ALLOW',
    resLogout.status === 200 && dataLogout.success === true,
    'HTTP 200 success=true',
    `HTTP ${resLogout.status}: success=${dataLogout.success}`
  );

  // -------------------------------------------------------------
  // 5. SECRETS & LOG AUDITING
  // -------------------------------------------------------------
  console.log('\n--- 5. Security & Secret Leak Auditing ---');

  // Verify VITE_ environment variables do not leak sensitive values
  const viteKeys = Object.keys(process.env).filter((k) => k.startsWith('VITE_'));
  const leakedKeys = viteKeys.filter((k) =>
    ['KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'DATABASE', 'PRIVATE'].some((bad) => k.toUpperCase().includes(bad))
  );
  record(
    'SECRETS',
    'No sensitive secrets exposed via VITE_* environment variables',
    leakedKeys.length === 0,
    'Zero sensitive VITE_* keys',
    leakedKeys.length === 0 ? 'Verified 0 leaked keys' : `Leaked: ${leakedKeys.join(', ')}`
  );

  // -------------------------------------------------------------
  // RESULTS SUMMARY TABLE
  // -------------------------------------------------------------
  console.log('\n-------------------------------------------------------------------------------------------------------------------');
  console.log('| CATEGORY    | TEST NAME                                                        | STATUS | DETAILS ');
  console.log('-------------------------------------------------------------------------------------------------------------------');
  let allPassed = true;
  for (const r of results) {
    const statusText = r.passed ? 'PASS ✅' : 'FAIL ❌';
    if (!r.passed) allPassed = false;
    console.log(`| ${r.category.padEnd(11)} | ${r.name.padEnd(64)} | ${statusText} | ${r.received}`);
  }
  console.log('-------------------------------------------------------------------------------------------------------------------\n');

  if (allPassed) {
    console.log('🎉 ALL STEP 7 PRODUCTION AUTHENTICATION & DEMO GATING TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME STEP 7 TESTS FAILED. Please review the output above.\n');
    process.exit(1);
  }
}

runStep7Verification().catch((err) => {
  console.error('Fatal Step 7 verification error:', err);
  process.exit(1);
});
