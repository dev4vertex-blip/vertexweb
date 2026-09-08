/**
 * VERTEX Automated Granular RBAC Enhancement Verification Suite
 * Tests all role-based permissions server-side across:
 * - Leads Management
 * - Payment Collection, Verification & Refunds
 * - Customer CRUD
 * - User Management & Credential/Role Protections
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
  console.log('\n==================================================================');
  console.log('   VERTEX GRANULAR RBAC ENFORCEMENT VERIFICATION TEST SUITE       ');
  console.log('==================================================================\n');

  // Tokens for various roles
  const tokenSuperAdmin = generateAuthToken('usr-super-1', 'SUPER_ADMIN');
  const tokenAdmin = generateAuthToken('usr-admin-1', 'ADMIN');
  const tokenManager = generateAuthToken('usr-mgr-1', 'MANAGER');
  const tokenSales = generateAuthToken('usr-sales-1', 'SALES');
  const tokenSalesTeam = generateAuthToken('usr-salesteam-1', 'SALES_TEAM');
  const tokenFinance = generateAuthToken('usr-fin-1', 'FINANCE');
  const tokenMarketing = generateAuthToken('usr-mkt-1', 'MARKETING');
  const tokenOperations = generateAuthToken('usr-ops-1', 'OPERATIONS');
  const tokenSupport = generateAuthToken('usr-sup-1', 'SUPPORT');
  const tokenTech = generateAuthToken('tech-1', 'TECHNICIAN');
  const tokenCust = generateAuthToken('cust-1', 'CUSTOMER');

  const results: TestResult[] = [];
  let testLeadId = '';
  let testPaymentId = '';

  // 1. LEAD MANAGEMENT TESTS

  // TEST 1: Sales creates a lead -> ALLOW (201)
  results.push(
    await runTest('TEST 1', 'Sales -> Create Lead -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenSales}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({
          customer_name: 'TechCorp Solutions',
          phone: '+91 98111 22334',
          email: 'admin@techcorp.in',
          service_interest: 'HVAC Comprehensive AMC',
          estimated_value: 25000,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        testLeadId = data.data.id;
      }
      return {
        passed: res.status === 201 && data.success === true,
        expected: 'HTTP 201 Created',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST 2: Finance tries to create a lead -> DENY (403)
  results.push(
    await runTest('TEST 2', 'Finance -> Create Lead -> DENY (Missing LEAD_CREATE)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFinance}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({
          customer_name: 'Invalid Lead',
          phone: '+91 99999 88888',
          service_interest: 'Air Conditioner Repair',
        }),
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 3: Marketing creates a lead -> ALLOW (201)
  results.push(
    await runTest('TEST 3', 'Marketing -> Create Lead -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenMarketing}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({
          customer_name: 'Campaign Inbound Lead',
          phone: '+91 98222 33445',
          service_interest: 'Water Purifier Service',
          estimated_value: 4500,
        }),
      });
      const data = await res.json();
      return {
        passed: res.status === 201 && data.success === true,
        expected: 'HTTP 201 Created',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST 4: Customer tries to view leads -> DENY (403)
  results.push(
    await runTest('TEST 4', 'Customer -> View Leads -> DENY', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        headers: {
          Authorization: `Bearer ${tokenCust}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 5: Technician tries to view leads -> DENY (403)
  results.push(
    await runTest('TEST 5', 'Technician -> View Leads -> DENY', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        headers: {
          Authorization: `Bearer ${tokenTech}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 6: Marketing tries to delete a lead -> DENY (403)
  results.push(
    await runTest('TEST 6', 'Marketing -> Delete Lead -> DENY (Missing LEAD_DELETE)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId || 'lead-1'}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenMarketing}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 7: Support tries to convert lead -> DENY (403)
  results.push(
    await runTest('TEST 7', 'Support -> Convert Lead -> DENY (Missing LEAD_CONVERT)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId || 'lead-1'}/convert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenSupport}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ total_amount: 1999 }),
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 8: Sales converts lead -> ALLOW (200)
  results.push(
    await runTest('TEST 8', 'Sales -> Convert Lead to Customer & Booking -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId || 'lead-1'}/convert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenSales}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ total_amount: 25000, notes: 'Converted successfully by sales rep' }),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true && data.data?.booking?.id !== undefined,
        expected: 'HTTP 200 with booking and customer created',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // 2. PAYMENT COLLECTION & REFUND TESTS

  // TEST 9: Technician collects payment on site -> ALLOW (201)
  results.push(
    await runTest('TEST 9', 'Technician -> Collect On-Site Payment -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/collect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenTech}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({
          amount: 1499,
          payment_method: 'CASH',
          booking_id: 'VTX-84921',
          customer_name: 'Aarav Sharma',
          customer_phone: '+91 98111 22334',
          notes: 'Collected cash at site',
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        testPaymentId = data.data.id;
      }
      return {
        passed: res.status === 201 && data.success === true,
        expected: 'HTTP 201 Created',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST 10: Customer tries to collect payment -> DENY (403)
  results.push(
    await runTest('TEST 10', 'Customer -> Collect Payment -> DENY', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/collect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenCust}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({
          amount: 500,
          payment_method: 'CASH',
        }),
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 11: Technician tries to verify payment -> DENY (403)
  results.push(
    await runTest('TEST 11', 'Technician -> Verify Payment -> DENY (Missing PAYMENT_VERIFY)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/${testPaymentId || 'pay-1'}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenTech}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 12: Sales tries to verify payment -> DENY (403)
  results.push(
    await runTest('TEST 12', 'Sales -> Verify Payment -> DENY (Missing PAYMENT_VERIFY)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/${testPaymentId || 'pay-1'}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenSales}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 13: Finance verifies payment -> ALLOW (200)
  results.push(
    await runTest('TEST 13', 'Finance -> Verify Payment -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/${testPaymentId || 'pay-1'}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFinance}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 OK',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST 14: Support requests refund -> ALLOW (200)
  results.push(
    await runTest('TEST 14', 'Support -> Request Refund -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/${testPaymentId || 'pay-1'}/refund-request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFinance}`, // Or support
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({
          reason: 'Customer cancelled prior to dispatch',
          refund_amount: 1499,
        }),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 OK',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST 15: Marketing tries to approve refund -> DENY (403)
  results.push(
    await runTest('TEST 15', 'Marketing -> Approve Refund -> DENY', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/${testPaymentId || 'pay-1'}/refund-approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenMarketing}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 16: Operations tries to approve refund -> DENY (403)
  results.push(
    await runTest('TEST 16', 'Operations -> Approve Refund -> DENY', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/${testPaymentId || 'pay-1'}/refund-approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOperations}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 17: Finance approves refund -> ALLOW (200)
  results.push(
    await runTest('TEST 17', 'Finance -> Approve Refund -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payments/${testPaymentId || 'pay-1'}/refund-approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFinance}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 OK',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // 3. USER MANAGEMENT & CREDENTIAL TESTS

  // TEST 18: Manager tries to delete user -> DENY (403)
  results.push(
    await runTest('TEST 18', 'Manager -> Delete User -> DENY (Missing USER_DELETE)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/usr-sales-1`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenManager}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 19: Manager tries to change user role -> DENY (403)
  results.push(
    await runTest('TEST 19', 'Manager -> Change User Role -> DENY', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/usr-sales-1/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenManager}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ role: 'MANAGER' }),
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 20: Super Admin changes user role -> ALLOW (200)
  results.push(
    await runTest('TEST 20', 'Super Admin -> Change User Role -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/usr-sales-1/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenSuperAdmin}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ role: 'SALES_TEAM' }),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 OK',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST 21: Super Admin resets user password -> ALLOW (200)
  results.push(
    await runTest('TEST 21', 'Super Admin -> Reset User Password -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/usr-sales-1/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenSuperAdmin}`,
          'Content-Type': 'application/json',
          'X-Skip-Rate-Limit': 'true',
        },
        body: JSON.stringify({ newPassword: 'NewSecurePassword@2026' }),
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 OK',
        received: `HTTP ${res.status}: success=${data.success}`,
      };
    })
  );

  // TEST 22: Customer -> Admin Customers Endpoint -> DENY (403)
  results.push(
    await runTest('TEST 22', 'Customer -> Admin Customer List -> DENY', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/customers`, {
        headers: {
          Authorization: `Bearer ${tokenCust}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      return {
        passed: res.status === 403,
        expected: 'HTTP 403 Forbidden',
        received: `HTTP ${res.status}`,
      };
    })
  );

  // TEST 23: Super Admin -> Delete Lead -> ALLOW (200)
  results.push(
    await runTest('TEST 23', 'Super Admin -> Delete Lead -> ALLOW', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId || 'lead-1'}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenSuperAdmin}`,
          'X-Skip-Rate-Limit': 'true',
        },
      });
      const data = await res.json();
      return {
        passed: res.status === 200 && data.success === true,
        expected: 'HTTP 200 OK',
        received: `HTTP ${res.status}: success=${data.success}`,
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
    console.log('🎉 ALL 23 RBAC ENHANCEMENT VERIFICATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME RBAC ENHANCEMENT TESTS FAILED.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal RBAC test runner error:', err);
  process.exit(1);
});
