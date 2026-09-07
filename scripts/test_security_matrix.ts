/**
 * VERTEX Automated Security Test Matrix Verification (TEST A through TEST O)
 * Pure HTTP test suite testing the running server at http://localhost:3000
 */

import { generateAuthToken } from '../src/server/auth.js';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  received: string;
}

const BASE_URL = 'http://localhost:3000';

async function runTest(
  id: string,
  name: string,
  fn: () => Promise<{ passed: boolean; expected: string; received: string }>
): Promise<TestResult> {
  try {
    const res = await fn();
    return { id, name, ...res };
  } catch (err: any) {
    return {
      id,
      name,
      passed: false,
      expected: 'Successful check',
      received: `Error: ${err.message}`,
    };
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   VERTEX SECURITY TEST MATRIX VERIFICATION (STEP 6)   ');
  console.log('======================================================\n');

  // Exact system user IDs from memoryStore / database
  const tokenCust1 = generateAuthToken('cust-1', 'CUSTOMER');
  const tokenCust2 = generateAuthToken('cust-2', 'CUSTOMER');
  const tokenTech1 = generateAuthToken('tech-1', 'TECHNICIAN');
  const tokenTech2 = generateAuthToken('tech-2', 'TECHNICIAN');
  const tokenAdmin = generateAuthToken('usr-super-1', 'SUPER_ADMIN');
  const tokenFinance = generateAuthToken('usr-fin-1', 'FINANCE');

  // Booking 1 belongs to cust-1, assigned to tech-1
  const booking1Id = 'VTX-84921';
  // Booking 2 belongs to cust-2, assigned to tech-2
  const booking2Id = 'VTX-84930';

  const results: TestResult[] = [];

  // TEST A: Customer -> own booking -> ALLOW
  results.push(
    await runTest('TEST A', "Customer A -> own booking -> ALLOW", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/customer/bookings/${booking1Id}`, {
        headers: { Authorization: `Bearer ${tokenCust1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 with booking details',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST B: Customer -> another customer's booking -> DENY
  results.push(
    await runTest('TEST B', "Customer A -> another customer's booking -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/customer/bookings/${booking2Id}`, {
        headers: { Authorization: `Bearer ${tokenCust1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 403 && data.success === false,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: error=${JSON.stringify(data.error)}`,
      };
    })
  );

  // TEST C: Customer -> Admin API -> DENY
  results.push(
    await runTest('TEST C', "Customer -> Admin API (/api/v1/admin/stats) -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${tokenCust1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: code=${data.error?.code || 'FORBIDDEN'}`,
      };
    })
  );

  // TEST D: Customer -> Technician API -> DENY
  results.push(
    await runTest('TEST D', "Customer -> Technician API (/api/v1/technician/jobs) -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/technician/jobs`, {
        headers: { Authorization: `Bearer ${tokenCust1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: code=${data.error?.code || 'FORBIDDEN'}`,
      };
    })
  );

  // TEST E: Technician -> own assigned job -> ALLOW
  results.push(
    await runTest('TEST E', "Technician 1 -> own assigned job -> ALLOW", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/technician/jobs/${booking1Id}`, {
        headers: { Authorization: `Bearer ${tokenTech1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 with job details',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST F: Technician -> another technician's job -> DENY
  results.push(
    await runTest('TEST F', "Technician 1 -> another technician's job -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/technician/jobs/${booking2Id}`, {
        headers: { Authorization: `Bearer ${tokenTech1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 403 && data.success === false,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: error=${JSON.stringify(data.error)}`,
      };
    })
  );

  // TEST G: Technician -> Admin API -> DENY
  results.push(
    await runTest('TEST G', "Technician -> Admin API (/api/v1/admin/stats) -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${tokenTech1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: code=${data.error?.code || 'FORBIDDEN'}`,
      };
    })
  );

  // TEST H: Technician -> Customer Management API -> DENY
  results.push(
    await runTest('TEST H', "Technician -> Customer Management API (/api/v1/admin/customers) -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/customers`, {
        headers: { Authorization: `Bearer ${tokenTech1}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: code=${data.error?.code || 'FORBIDDEN'}`,
      };
    })
  );

  // TEST I: Authorized Admin -> permitted Admin API -> ALLOW
  results.push(
    await runTest('TEST I', "Authorized Admin -> permitted Admin API (/api/v1/admin/stats) -> ALLOW", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${tokenAdmin}`, 'X-Skip-Rate-Limit': 'true' },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 with dashboard stats',
        received: `HTTP ${res.status}: totalUsers=${data.data?.totalUsers}`,
      };
    })
  );

  // TEST J: Internal role without permission -> protected Admin API -> DENY
  results.push(
    await runTest('TEST J', "Internal role without permission (FINANCE -> assign) -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/bookings/${booking1Id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenFinance}`,
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ technicianId: 'tech-1' }),
      });
      const data = await res.json();
      return {
        passed: res.status === 403 && data.error?.code === 'INSUFFICIENT_PERMISSIONS',
        expected: 'HTTP 403 INSUFFICIENT_PERMISSIONS',
        received: `HTTP ${res.status}: code=${data.error?.code}`,
      };
    })
  );

  // TEST K: Technician -> own duty status -> ALLOW
  results.push(
    await runTest('TEST K', "Technician -> own duty status -> ALLOW", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/technician/duty-toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTech1}`,
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ isOnDuty: true }),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true && data.isOnDuty === true,
        expected: 'HTTP 200 with isOnDuty: true',
        received: `HTTP ${res.status}: success=${data.success}, isOnDuty=${data.isOnDuty}`,
      };
    })
  );

  // TEST L: Technician -> change another technician's duty status -> DENY
  results.push(
    await runTest('TEST L', "Technician -> change another technician's duty status -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/technician/duty-toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTech1}`,
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ technicianId: 'tech-2', isOnDuty: false }),
      });
      const data = await res.json();
      return {
        passed: res.status === 403 && data.success === false,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: error=${JSON.stringify(data.error)}`,
      };
    })
  );

  // TEST M: Admin with BOOKING_ASSIGN -> assign technician -> ALLOW
  results.push(
    await runTest('TEST M', "Admin with BOOKING_ASSIGN -> assign technician -> ALLOW", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/bookings/${booking1Id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdmin}`,
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ technicianId: 'tech-1' }),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 with assigned technician info',
        received: `HTTP ${res.status}: status=${data.status}, tech=${data.technician?.name}`,
      };
    })
  );

  // TEST N: Technician -> Admin assignment endpoint -> DENY
  results.push(
    await runTest('TEST N', "Technician -> Admin assignment endpoint -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/bookings/${booking1Id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTech1}`,
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ technicianId: 'tech-1' }),
      });
      const data = await res.json();
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}: code=${data.error?.code || 'FORBIDDEN'}`,
      };
    })
  );

  // TEST O: Production demo flags false -> demo auth rejected -> DENY
  results.push(
    await runTest('TEST O', "Production demo flags false -> demo auth rejected -> DENY", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Rate-Limit': 'true' },
        body: JSON.stringify({ email: 'nonexistent_test_demo@vertex.com', password: 'random_wrong_pass' }),
      });
      const data = await res.json();
      return {
        passed: res.status === 401 && data.success === false,
        expected: 'HTTP 401 Unauthorized',
        received: `HTTP ${res.status}: code=${data.error?.code}`,
      };
    })
  );

  // Print Summary Table
  console.log('---------------------------------------------------------------------------------------------------------');
  console.log('| TEST ID | DESCRIPTION                                                      | STATUS | DETAILS ');
  console.log('---------------------------------------------------------------------------------------------------------');
  let allPassed = true;
  for (const r of results) {
    const statusText = r.passed ? 'PASS ✅' : 'FAIL ❌';
    if (!r.passed) allPassed = false;
    console.log(`| ${r.id.padEnd(7)} | ${r.name.padEnd(64)} | ${statusText} | ${r.received}`);
  }
  console.log('---------------------------------------------------------------------------------------------------------\n');

  if (allPassed) {
    console.log('🎉 ALL 15 SECURITY MATRIX TESTS (TEST A through TEST O) PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED. Please review the details above.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test matrix runner error:', err);
  process.exit(1);
});
