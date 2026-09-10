/**
 * Verification Script: Promotions CRUD, CORS headers, and Super Admin Access
 */

import http from 'http';
import { generateAuthToken } from '../src/server/auth.js';

function apiRequest(options: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const dataString = options.body ? JSON.stringify(options.body) : '';
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: options.path,
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => {
          respData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = respData ? JSON.parse(respData) : {};
            resolve({ status: res.statusCode || 500, headers: res.headers, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, headers: res.headers, body: respData });
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('   VERTEX PROMOTIONS & CORS VERIFICATION');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(title: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title} - ${details || 'Assertion failed'}`);
      failed++;
    }
  }

  try {
    // 1. Generate Super Admin Token
    const superAdminToken = generateAuthToken('usr-admin-1', 'SUPER_ADMIN');
    assert('Super Admin authenticated successfully', Boolean(superAdminToken));

    const authHeaders = {
      Authorization: `Bearer ${superAdminToken}`,
      Origin: 'https://ais-dev-zdmpnbna4272ukxruns2hc-215954351316.asia-east1.run.app',
    };

    // 2. CORS Preflight (OPTIONS)
    const optionsRes = await apiRequest({
      method: 'OPTIONS',
      path: '/api/v1/promotions',
      headers: {
        Origin: 'https://ais-dev-zdmpnbna4272ukxruns2hc-215954351316.asia-east1.run.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    assert('CORS OPTIONS preflight returns 204', optionsRes.status === 204 || optionsRes.status === 200);
    const allowOrigin = optionsRes.headers['access-control-allow-origin'];
    assert(
      'CORS Access-Control-Allow-Origin header is present for dev origin',
      allowOrigin === 'https://ais-dev-zdmpnbna4272ukxruns2hc-215954351316.asia-east1.run.app' ||
      allowOrigin === '*'
    );

    // 3. Promotions list loads (GET)
    const listRes = await apiRequest({
      method: 'GET',
      path: '/api/v1/promotions',
      headers: authHeaders,
    });
    assert(
      'Promotions list loads successfully (200)',
      listRes.status === 200 && listRes.body?.success === true && Array.isArray(listRes.body?.data),
      JSON.stringify(listRes.body)
    );

    // 4. Create Promotion works (POST)
    const testCode = `TESTPROMO_${Date.now()}`;
    const createRes = await apiRequest({
      method: 'POST',
      path: '/api/v1/promotions',
      headers: authHeaders,
      body: {
        code: testCode,
        name: 'Automated Test Promo',
        description: 'Testing promo creation flow',
        discount_type: 'PERCENTAGE',
        discount_value: 25,
        max_discount: 250,
        min_order_value: 499,
        status: 'ACTIVE',
        usage_limit: 100,
        per_customer_limit: 1,
        applicable_categories: ['All'],
        customer_segment: 'ALL',
      },
    });
    const createdId = createRes.body?.data?.id;
    assert(
      'Create Promotion works (201)',
      createRes.status === 201 && createRes.body?.success === true && Boolean(createdId),
      JSON.stringify(createRes.body)
    );

    // 5. Edit Promotion works (PUT)
    const editRes = await apiRequest({
      method: 'PUT',
      path: `/api/v1/promotions/${createdId}`,
      headers: authHeaders,
      body: {
        name: 'Automated Test Promo (Updated)',
        discount_value: 30,
        min_order_value: 599,
      },
    });
    assert(
      'Edit Promotion works (200)',
      editRes.status === 200 && editRes.body?.success === true && editRes.body?.data?.discount_value === 30,
      JSON.stringify(editRes.body)
    );

    // 6. Deactivate / Pause Promotion works (PATCH)
    const pauseRes = await apiRequest({
      method: 'PATCH',
      path: `/api/v1/promotions/${createdId}/status`,
      headers: authHeaders,
      body: { status: 'INACTIVE' },
    });
    assert(
      'Deactivate / Pause Promotion works (200)',
      pauseRes.status === 200 && pauseRes.body?.success === true && pauseRes.body?.data?.status === 'INACTIVE',
      JSON.stringify(pauseRes.body)
    );

    // 7. Reactivate Promotion works (PATCH)
    const activateRes = await apiRequest({
      method: 'PATCH',
      path: `/api/v1/promotions/${createdId}/status`,
      headers: authHeaders,
      body: { status: 'ACTIVE' },
    });
    assert(
      'Reactivate Promotion works (200)',
      activateRes.status === 200 && activateRes.body?.success === true && activateRes.body?.data?.status === 'ACTIVE',
      JSON.stringify(activateRes.body)
    );

    // 8. Delete / Archive works (DELETE)
    const deleteRes = await apiRequest({
      method: 'DELETE',
      path: `/api/v1/promotions/${createdId}`,
      headers: authHeaders,
    });
    assert(
      'Delete / Archive Promotion works (200)',
      deleteRes.status === 200 && deleteRes.body?.success === true,
      JSON.stringify(deleteRes.body)
    );

    // 9. Verify deleted promotion is no longer returned in active list
    const verifyListRes = await apiRequest({
      method: 'GET',
      path: '/api/v1/promotions',
      headers: authHeaders,
    });
    const stillExists = verifyListRes.body?.data?.some((p: any) => p.id === createdId);
    assert('Deleted promotion is purged from active list', !stillExists);

    // 10. Customer Role RBAC: Customer token cannot perform administrative operations (403)
    const customerToken = generateAuthToken('cust-1', 'CUSTOMER');
    const custDeleteRes = await apiRequest({
      method: 'DELETE',
      path: '/api/v1/promotions/promo-1',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        Origin: 'https://ais-dev-zdmpnbna4272ukxruns2hc-215954351316.asia-east1.run.app',
      },
    });
    assert(
      'Customer blocked with 403 on promotion deletion (RBAC enforced)',
      custDeleteRes.status === 403,
      `Expected 403, got ${custDeleteRes.status}`
    );
  } catch (err: any) {
    console.error('Unexpected error during verification:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
