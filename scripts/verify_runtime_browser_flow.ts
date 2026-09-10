import assert from 'assert';

interface TestResult {
  step: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(step: string, passed: boolean, details?: string) {
  results.push({ step, passed, details });
  const mark = passed ? '[PASS]' : '[FAIL]';
  console.log(`  ${mark} ${step} ${details ? `(${details})` : ''}`);
}

async function run() {
  console.log('================================================================');
  console.log('   VERTEX REAL RUNTIME BROWSER FLOW VERIFICATION');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const CLIENT_ORIGIN = 'http://localhost:3000';

  // --------------------------------------------------------------------------
  // Step 1: Health & Environment Check
  // --------------------------------------------------------------------------
  console.log('--- 1. Environment & Server Health Verification ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  assert.strictEqual(healthRes.status, 200, 'Server health check returned 200');
  const healthData = await healthRes.json();
  record('Server is healthy on port 3000', healthRes.status === 200, `status: ${healthData.status}`);

  // --------------------------------------------------------------------------
  // Step 2: SUPER_ADMIN Login Flow
  // --------------------------------------------------------------------------
  console.log('\n--- 2. SUPER_ADMIN Login Flow ---');
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: CLIENT_ORIGIN,
    },
    body: JSON.stringify({
      email: 'admin@vertex.demo',
      password: 'Admin@123',
      role: 'SUPER_ADMIN',
    }),
  });

  const loginData = await loginRes.json();
  const superAdminToken = loginData.token;
  const isSuperAdmin = loginData.user?.role === 'SUPER_ADMIN';
  record(
    'SUPER_ADMIN login succeeds with session token',
    loginRes.status === 200 && Boolean(superAdminToken) && isSuperAdmin,
    `role: ${loginData.user?.role}, name: ${loginData.user?.name}`
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Origin: CLIENT_ORIGIN,
    Authorization: `Bearer ${superAdminToken}`,
  };

  // --------------------------------------------------------------------------
  // Step 3: GET /api/v1/promotions (Marketing -> Promotions & Offers view load)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. GET /api/v1/promotions (View Promotions) ---');
  const listRes = await fetch(`${BASE_URL}/api/v1/promotions`, {
    method: 'GET',
    headers: authHeaders,
  });
  const listData = await listRes.json();
  record(
    'GET /api/v1/promotions loads list successfully',
    listRes.status === 200 && listData.success === true && Array.isArray(listData.data),
    `count: ${listData.data?.length}`
  );

  // --------------------------------------------------------------------------
  // Step 4: Create Promotion -> Save (POST /api/v1/promotions)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Create Promotion -> Save (POST /api/v1/promotions) ---');
  const uniqueCode = `SUMMER${Date.now().toString().slice(-4)}`;
  const createPayload = {
    name: 'Summer Splash Discount',
    code: uniqueCode,
    description: 'Festive summer cooling service discount',
    promotion_type: 'PERCENTAGE',
    discount_type: 'PERCENTAGE',
    discount_value: 25,
    min_order_value: 799,
    max_discount: 400,
    start_date: '2026-06-01',
    end_date: '2026-08-31',
    applicable_categories: ['AC Services', 'Cooling'],
    applicable_services: ['AC Deep Cleaning', 'AC Gas Refill'],
    customer_segment: 'ALL',
    usage_limit: 500,
    per_customer_limit: 2,
    status: 'ACTIVE',
    terms_and_conditions: 'Valid for one booking per household.',
  };

  const createRes = await fetch(`${BASE_URL}/api/v1/promotions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createPayload),
  });

  const createData = await createRes.json();
  const createdPromoId = createData.data?.id;
  record(
    'SUPER_ADMIN Create Promotion succeeds without 403',
    createRes.status === 201 && createData.success === true && Boolean(createdPromoId),
    `id: ${createdPromoId}, code: ${createData.data?.code}`
  );

  // --------------------------------------------------------------------------
  // Step 5: Edit Promotion (PUT /api/v1/promotions/:id)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Edit Promotion (PUT /api/v1/promotions/:id) ---');
  const editPayload = {
    ...createPayload,
    name: 'Summer Super Splash 30%',
    discount_value: 30,
    max_discount: 500,
    description: 'Updated summer festive offer with higher discount tier',
  };

  const editRes = await fetch(`${BASE_URL}/api/v1/promotions/${createdPromoId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(editPayload),
  });

  const editData = await editRes.json();
  record(
    'SUPER_ADMIN Edit Promotion succeeds without 403',
    editRes.status === 200 && editData.success === true && editData.data?.discount_value === 30,
    `updated name: "${editData.data?.name}", discount: ${editData.data?.discount_value}%`
  );

  // --------------------------------------------------------------------------
  // Step 6: Deactivate Promotion (PATCH /api/v1/promotions/:id/status -> INACTIVE)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Deactivate Promotion (PATCH /status -> INACTIVE) ---');
  const deactivateRes = await fetch(`${BASE_URL}/api/v1/promotions/${createdPromoId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'INACTIVE' }),
  });

  const deactivateData = await deactivateRes.json();
  record(
    'Deactivate Promotion succeeds without 403',
    deactivateRes.status === 200 && deactivateData.success === true && deactivateData.data?.status === 'INACTIVE',
    `status: ${deactivateData.data?.status}`
  );

  // --------------------------------------------------------------------------
  // Step 7: Activate Promotion (PATCH /api/v1/promotions/:id/status -> ACTIVE)
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Activate Promotion (PATCH /status -> ACTIVE) ---');
  const activateRes = await fetch(`${BASE_URL}/api/v1/promotions/${createdPromoId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'ACTIVE' }),
  });

  const activateData = await activateRes.json();
  record(
    'Activate Promotion succeeds without 403',
    activateRes.status === 200 && activateData.success === true && activateData.data?.status === 'ACTIVE',
    `status: ${activateData.data?.status}`
  );

  // --------------------------------------------------------------------------
  // Step 8: Delete / Archive Promotion (DELETE /api/v1/promotions/:id)
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Delete/Archive Promotion (DELETE /api/v1/promotions/:id) ---');
  const deleteRes = await fetch(`${BASE_URL}/api/v1/promotions/${createdPromoId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });

  const deleteData = await deleteRes.json();
  record(
    'Delete/Archive Promotion succeeds without 403',
    deleteRes.status === 200 && deleteData.success === true,
    `message: ${deleteData.message}`
  );

  // Confirm it no longer shows in active listing
  const listAfterDelete = await fetch(`${BASE_URL}/api/v1/promotions`, {
    method: 'GET',
    headers: authHeaders,
  });
  const listAfterData = await listAfterDelete.json();
  const existsAfterDelete = listAfterData.data.some((p: any) => p.id === createdPromoId);
  record(
    'Deleted promotion is purged from active promotions list',
    !existsAfterDelete,
    'Verified absent from active GET /api/v1/promotions'
  );

  // --------------------------------------------------------------------------
  // Step 9: Unauthorized Role Verification (Must Receive 403 Forbidden)
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Unauthorized Role Verification (Must Receive 403) ---');
  // Login as Customer
  const customerLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: CLIENT_ORIGIN },
    body: JSON.stringify({
      email: 'customer@vertex.demo',
      password: 'password123',
      role: 'CUSTOMER',
    }),
  });

  const customerLoginData = await customerLoginRes.json();
  const customerToken = customerLoginData.token;

  // Customer attempts POST /api/v1/promotions (Create)
  const customerCreateRes = await fetch(`${BASE_URL}/api/v1/promotions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: CLIENT_ORIGIN,
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      name: 'Unauthorized Promo',
      code: 'HACK99',
      discount_value: 99,
    }),
  });

  record(
    'Customer blocked from POST /api/v1/promotions with 403',
    customerCreateRes.status === 403,
    `HTTP ${customerCreateRes.status}`
  );

  // Customer attempts DELETE /api/v1/promotions/:id
  const customerDeleteRes = await fetch(`${BASE_URL}/api/v1/promotions/promo-1`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Origin: CLIENT_ORIGIN,
      Authorization: `Bearer ${customerToken}`,
    },
  });

  record(
    'Customer blocked from DELETE /api/v1/promotions/:id with 403',
    customerDeleteRes.status === 403,
    `HTTP ${customerDeleteRes.status}`
  );

  // Technician attempts POST /api/v1/promotions
  const techLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: CLIENT_ORIGIN },
    body: JSON.stringify({
      email: 'raj.tech@vertexservices.in',
      password: 'password123',
      role: 'TECHNICIAN',
    }),
  });

  const techLoginData = await techLoginRes.json();
  const techToken = techLoginData.token;

  const techCreateRes = await fetch(`${BASE_URL}/api/v1/promotions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: CLIENT_ORIGIN,
      Authorization: `Bearer ${techToken}`,
    },
    body: JSON.stringify({
      name: 'Tech Promo',
      code: 'TECH50',
      discount_value: 50,
    }),
  });

  record(
    'Technician blocked from POST /api/v1/promotions with 403',
    techCreateRes.status === 403,
    `HTTP ${techCreateRes.status}`
  );

  // Employee attempts DELETE /api/v1/promotions/:id
  const empLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: CLIENT_ORIGIN },
    body: JSON.stringify({
      email: 'employee@vertex.demo',
      password: 'password123',
      role: 'EMPLOYEE',
    }),
  });

  const empLoginData = await empLoginRes.json();
  const empToken = empLoginData.token;

  const empDeleteRes = await fetch(`${BASE_URL}/api/v1/promotions/promo-1`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Origin: CLIENT_ORIGIN,
      Authorization: `Bearer ${empToken}`,
    },
  });

  record(
    'Employee without PROMOTION_DELETE blocked with 403',
    empDeleteRes.status === 403,
    `HTTP ${empDeleteRes.status}`
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`VERIFICATION SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Execution failure:', err);
  process.exit(1);
});
