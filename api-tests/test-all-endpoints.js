/**
 * Comprehensive API Endpoint Testing Script - Version 2
 * Tests all Spendly API endpoints with detailed logging
 * 
 * Run with: node api-tests/test-all-endpoints.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://api.spendly.money';
const CREDENTIALS = {
  email: 'demo@spendly.money',
  password: 'password'
};

let authToken = null;
let userId = null;
let testResults = [];
let createdResources = {
  transactionId: null,
  investmentId: null,
  recurringPaymentId: null,
  budgetId: null,
  goalId: null,
  receiptId: null,
  ticketId: null,
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'en',
        ...headers
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test result logger
function logTest(category, endpoint, method, status, success, details = '') {
  const result = {
    category,
    endpoint,
    method,
    status,
    success,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const statusIcon = success ? '✅' : '❌';
  console.log(`${statusIcon} [${category}] ${method} ${endpoint} - Status: ${status} ${details ? `- ${details}` : ''}`);
}

// ==================== TEST FUNCTIONS ====================

async function testHealthCheck() {
  console.log('\n📦 Testing Health Check...');
  try {
    const res = await makeRequest('GET', '/api/health');
    logTest('Health', '/api/health', 'GET', res.status, res.status === 200, JSON.stringify(res.data));
  } catch (e) {
    logTest('Health', '/api/health', 'GET', 0, false, e.message);
  }
}

async function testCurrencies() {
  console.log('\n💱 Testing Currencies (Public)...');
  try {
    const res = await makeRequest('GET', '/api/currencies');
    // API returns { data: [...] } so check data property or direct array
    const currenciesArray = res.data?.data || res.data;
    const success = res.status === 200 && Array.isArray(currenciesArray);
    logTest('Currencies', '/api/currencies', 'GET', res.status, success, 
      success ? `Found ${currenciesArray.length} currencies` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Currencies', '/api/currencies', 'GET', 0, false, e.message);
  }
}

async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  // Login
  try {
    const res = await makeRequest('POST', '/api/auth/login', CREDENTIALS);
    const success = res.status === 200 && res.data.token;
    if (success) {
      authToken = res.data.token;
      userId = res.data.user?.id;
    }
    logTest('Auth', '/api/auth/login', 'POST', res.status, success, 
      success ? 'Token received' : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Auth', '/api/auth/login', 'POST', 0, false, e.message);
  }

  // Me (Get current user) - API returns { data: { ... } }
  try {
    const res = await makeRequest('GET', '/api/auth/me');
    const userData = res.data?.data || res.data;
    const success = res.status === 200 && userData?.id;
    if (success) userId = userData.id;
    logTest('Auth', '/api/auth/me', 'GET', res.status, success, 
      success ? `User: ${userData?.email}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Auth', '/api/auth/me', 'GET', 0, false, e.message);
  }
}

async function testDashboard() {
  console.log('\n📊 Testing Dashboard...');
  
  try {
    const res = await makeRequest('GET', '/api/dashboard/summary');
    const success = res.status === 200;
    const balance = res.data?.total_balance ?? res.data?.totalBalance ?? res.data?.balance ?? 'N/A';
    logTest('Dashboard', '/api/dashboard/summary', 'GET', res.status, success, 
      success ? `Has data: ${Object.keys(res.data).length} keys` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Dashboard', '/api/dashboard/summary', 'GET', 0, false, e.message);
  }
}

async function testCategories() {
  console.log('\n📁 Testing Categories...');
  
  try {
    const res = await makeRequest('GET', '/api/categories');
    const success = res.status === 200;
    const count = res.data?.all?.length || res.data?.data?.length || res.data?.length || 0;
    logTest('Categories', '/api/categories', 'GET', res.status, success, 
      success ? `Found ${count} categories` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Categories', '/api/categories', 'GET', 0, false, e.message);
  }
}

async function testTransactions() {
  console.log('\n💳 Testing Transactions...');
  
  // GET all transactions
  try {
    const res = await makeRequest('GET', '/api/transactions');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Transactions', '/api/transactions', 'GET', res.status, success, 
      success ? `Found ${count} transactions` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Transactions', '/api/transactions', 'GET', 0, false, e.message);
  }

  // POST create transaction
  try {
    const newTransaction = {
      type: 'expense',
      amount: 25.50,
      currency: 'SGD', // Use user's default currency
      category: 'Groceries',
      notes: 'API Test - Grocery shopping',
      date: new Date().toISOString().split('T')[0]
    };
    const res = await makeRequest('POST', '/api/transactions', newTransaction);
    const success = res.status === 201 || res.status === 200;
    const txData = res.data?.data || res.data;
    if (success && txData?.id) {
      createdResources.transactionId = txData.id;
    }
    logTest('Transactions', '/api/transactions', 'POST', res.status, success, 
      success ? `Created ID: ${txData?.id}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Transactions', '/api/transactions', 'POST', 0, false, e.message);
  }

  // GET single transaction
  if (createdResources.transactionId) {
    try {
      const res = await makeRequest('GET', `/api/transactions/${createdResources.transactionId}`);
      const txData = res.data?.data || res.data;
      logTest('Transactions', `/api/transactions/:id`, 'GET', res.status, res.status === 200, 
        res.status === 200 ? `Amount: ${txData?.amount}` : JSON.stringify(res.data).substring(0, 100));
    } catch (e) {
      logTest('Transactions', `/api/transactions/:id`, 'GET', 0, false, e.message);
    }
  }

  // PUT update transaction
  if (createdResources.transactionId) {
    try {
      const updateData = {
        notes: 'API Test - Updated note',
        amount: 30.00
      };
      const res = await makeRequest('PUT', `/api/transactions/${createdResources.transactionId}`, updateData);
      logTest('Transactions', `/api/transactions/:id`, 'PUT', res.status, res.status === 200, 
        res.status === 200 ? 'Updated successfully' : JSON.stringify(res.data).substring(0, 100));
    } catch (e) {
      logTest('Transactions', `/api/transactions/:id`, 'PUT', 0, false, e.message);
    }
  }
}

async function testReports() {
  console.log('\n📈 Testing Reports...');
  
  // Monthly report
  try {
    const year = new Date().getFullYear();
    const res = await makeRequest('GET', `/api/reports/monthly?year=${year}`);
    const success = res.status === 200;
    logTest('Reports', '/api/reports/monthly', 'GET', res.status, success, 
      success ? `Data count: ${res.data?.data?.length || 0}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Reports', '/api/reports/monthly', 'GET', 0, false, e.message);
  }

  // Category report
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const res = await makeRequest('GET', `/api/reports/categories?from=${lastMonth}&to=${today}`);
    const success = res.status === 200;
    logTest('Reports', '/api/reports/categories', 'GET', res.status, success, 
      success ? `Categories: ${res.data?.data?.length || 0}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Reports', '/api/reports/categories', 'GET', 0, false, e.message);
  }
}

async function testAnalytics() {
  console.log('\n📊 Testing Analytics...');
  
  // Spending trends
  try {
    const res = await makeRequest('GET', '/api/analytics/spending-trends?months=6');
    const success = res.status === 200;
    logTest('Analytics', '/api/analytics/spending-trends', 'GET', res.status, success, 
      success ? `Trends: ${res.data?.trends?.length || 0}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Analytics', '/api/analytics/spending-trends', 'GET', 0, false, e.message);
  }

  // Category breakdown
  try {
    const res = await makeRequest('GET', '/api/analytics/category-breakdown?months=3');
    const success = res.status === 200;
    logTest('Analytics', '/api/analytics/category-breakdown', 'GET', res.status, success, 
      success ? `Breakdown: ${res.data?.breakdown?.length || 0}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Analytics', '/api/analytics/category-breakdown', 'GET', 0, false, e.message);
  }

  // Insights
  try {
    const res = await makeRequest('GET', '/api/analytics/insights');
    const success = res.status === 200;
    logTest('Analytics', '/api/analytics/insights', 'GET', res.status, success, 
      success ? `Insights: ${res.data?.insights?.length || 0}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Analytics', '/api/analytics/insights', 'GET', 0, false, e.message);
  }

  // Health score
  try {
    const res = await makeRequest('GET', '/api/analytics/health-score');
    const success = res.status === 200;
    logTest('Analytics', '/api/analytics/health-score', 'GET', res.status, success, 
      success ? `Score: ${res.data?.score || 'N/A'}, Grade: ${res.data?.grade || 'N/A'}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Analytics', '/api/analytics/health-score', 'GET', 0, false, e.message);
  }
}

async function testInvestments() {
  console.log('\n💰 Testing Investments...');
  
  // GET all investments
  try {
    const res = await makeRequest('GET', '/api/investments');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Investments', '/api/investments', 'GET', res.status, success, 
      success ? `Found ${count} investments` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Investments', '/api/investments', 'GET', 0, false, e.message);
  }

  // POST create investment - using correct field names from API validation
  try {
    const newInvestment = {
      name: 'API Test Investment',
      category_id: 1,  // Must be a valid category ID from categories table
      type: 'stocks',  // Required field
      invested_amount: 1000.00,
      current_value: 1050.00,
      currency: 'SGD',
      start_date: new Date().toISOString().split('T')[0],
      notes: 'Created via API test'
    };
    const res = await makeRequest('POST', '/api/investments', newInvestment);
    const success = res.status === 201 || res.status === 200;
    const invData = res.data?.data || res.data;
    if (success && invData?.id) {
      createdResources.investmentId = invData.id;
    }
    logTest('Investments', '/api/investments', 'POST', res.status, success, 
      success ? `Created ID: ${invData?.id}` : JSON.stringify(res.data).substring(0, 200));
  } catch (e) {
    logTest('Investments', '/api/investments', 'POST', 0, false, e.message);
  }
}

async function testRecurringPayments() {
  console.log('\n🔄 Testing Recurring Payments...');
  
  // GET all recurring payments
  try {
    const res = await makeRequest('GET', '/api/recurring-payments');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Recurring', '/api/recurring-payments', 'GET', res.status, success, 
      success ? `Found ${count} recurring payments` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Recurring', '/api/recurring-payments', 'GET', 0, false, e.message);
  }

  // POST create recurring payment - using correct field names
  try {
    const nextMonth = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    const newRecurring = {
      type: 'expense',          // Required: income or expense
      amount: 9.99,             // Required
      currency: 'SGD',          // Required, 3 chars
      category: 'Subscriptions', // Required
      frequency: 'monthly',     // Required: monthly, weekly, or custom
      next_due_date: nextMonth  // Required
    };
    const res = await makeRequest('POST', '/api/recurring-payments', newRecurring);
    const success = res.status === 201 || res.status === 200;
    const recData = res.data?.data || res.data;
    if (success && recData?.id) {
      createdResources.recurringPaymentId = recData.id;
    }
    logTest('Recurring', '/api/recurring-payments', 'POST', res.status, success, 
      success ? `Created ID: ${recData?.id}` : JSON.stringify(res.data).substring(0, 200));
  } catch (e) {
    logTest('Recurring', '/api/recurring-payments', 'POST', 0, false, e.message);
  }
}

async function testBudgets() {
  console.log('\n💵 Testing Budgets...');
  
  // GET budget summary
  try {
    const res = await makeRequest('GET', '/api/budgets/summary');
    const success = res.status === 200;
    logTest('Budgets', '/api/budgets/summary', 'GET', res.status, success, 
      success ? `Total: ${res.data?.total_budget || 'N/A'}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Budgets', '/api/budgets/summary', 'GET', 0, false, e.message);
  }

  // GET all category budgets
  try {
    const res = await makeRequest('GET', '/api/budgets/categories?all=true');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Budgets', '/api/budgets/categories', 'GET', res.status, success, 
      success ? `Found ${count} category budgets` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Budgets', '/api/budgets/categories', 'GET', 0, false, e.message);
  }

  // POST create budget - using correct field names
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const newBudget = {
      category: 'API Test Category',  // Unique category to avoid conflicts
      budget_amount: 200.00,          // Required
      currency: 'SGD',                // Required, 3 chars
      period: 'monthly',              // Optional, defaults to monthly
      start_date: startDate           // Required
    };
    const res = await makeRequest('POST', '/api/budgets/categories', newBudget);
    const success = res.status === 201 || res.status === 200;
    const budgetData = res.data?.data || res.data;
    if (success && budgetData?.id) {
      createdResources.budgetId = budgetData.id;
    }
    logTest('Budgets', '/api/budgets/categories', 'POST', res.status, success, 
      success ? `Created ID: ${budgetData?.id}` : JSON.stringify(res.data).substring(0, 200));
  } catch (e) {
    logTest('Budgets', '/api/budgets/categories', 'POST', 0, false, e.message);
  }
}

async function testGoals() {
  console.log('\n🎯 Testing Savings Goals...');
  
  // GET all goals
  try {
    const res = await makeRequest('GET', '/api/goals');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Goals', '/api/goals', 'GET', res.status, success, 
      success ? `Found ${count} goals` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Goals', '/api/goals', 'GET', 0, false, e.message);
  }

  // POST create goal
  try {
    const newGoal = {
      name: 'API Test Goal - Vacation Fund',
      target_amount: 5000.00,
      current_amount: 500.00,
      currency: 'SGD',
      target_date: new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0]
    };
    const res = await makeRequest('POST', '/api/goals', newGoal);
    const success = res.status === 201 || res.status === 200;
    const goalData = res.data?.data || res.data;
    if (success && goalData?.id) {
      createdResources.goalId = goalData.id;
    }
    logTest('Goals', '/api/goals', 'POST', res.status, success, 
      success ? `Created ID: ${goalData?.id}` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Goals', '/api/goals', 'POST', 0, false, e.message);
  }
}

async function testNotifications() {
  console.log('\n🔔 Testing Notifications...');
  
  try {
    const res = await makeRequest('GET', '/api/notifications');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Notifications', '/api/notifications', 'GET', res.status, success, 
      success ? `Found ${count} notifications` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Notifications', '/api/notifications', 'GET', 0, false, e.message);
  }
}

async function testUserSettings() {
  console.log('\n⚙️ Testing User Settings...');
  
  // GET settings
  try {
    const res = await makeRequest('GET', '/api/user/settings');
    const success = res.status === 200;
    const settings = res.data?.data || res.data;
    logTest('Settings', '/api/user/settings', 'GET', res.status, success, 
      success ? `Has ${Object.keys(settings).length} settings` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Settings', '/api/user/settings', 'GET', 0, false, e.message);
  }
}

async function testFinancialSummary() {
  console.log('\n📋 Testing Financial Summary...');
  
  try {
    const res = await makeRequest('GET', '/api/financial-summary');
    const success = res.status === 200;
    logTest('Financial', '/api/financial-summary', 'GET', res.status, success, 
      success ? `Has ${Object.keys(res.data).length} keys` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Financial', '/api/financial-summary', 'GET', 0, false, e.message);
  }
}

async function testPromotions() {
  console.log('\n🎁 Testing Promotions...');
  
  try {
    const res = await makeRequest('GET', '/api/promotions');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Promotions', '/api/promotions', 'GET', res.status, success, 
      success ? `Found ${count} promotions` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Promotions', '/api/promotions', 'GET', 0, false, e.message);
  }
}

async function testReceipts() {
  console.log('\n🧾 Testing Receipts...');
  
  try {
    const res = await makeRequest('GET', '/api/receipts');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Receipts', '/api/receipts', 'GET', res.status, success, 
      success ? `Found ${count} receipts` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Receipts', '/api/receipts', 'GET', 0, false, e.message);
  }
}

async function testSupportTickets() {
  console.log('\n🎫 Testing Support Tickets...');
  
  // GET all tickets
  try {
    const res = await makeRequest('GET', '/api/support-tickets');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Support', '/api/support-tickets', 'GET', res.status, success, 
      success ? `Found ${count} tickets` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Support', '/api/support-tickets', 'GET', 0, false, e.message);
  }
}

async function testReferrals() {
  console.log('\n👥 Testing Referrals...');
  
  // GET referral info
  if (userId) {
    try {
      const res = await makeRequest('GET', `/api/referrals/${userId}`);
      const success = res.status === 200;
      const refData = res.data?.data || res.data;
      logTest('Referrals', `/api/referrals/:userId`, 'GET', res.status, success, 
        success ? `Referral code: ${refData?.referral_code || 'N/A'}` : JSON.stringify(res.data).substring(0, 100));
    } catch (e) {
      logTest('Referrals', '/api/referrals/:userId', 'GET', 0, false, e.message);
    }
  }
}

async function testInsights() {
  console.log('\n💡 Testing Insights...');
  
  try {
    const res = await makeRequest('GET', '/api/insights');
    const success = res.status === 200;
    const count = res.data?.data?.length || res.data?.length || 0;
    logTest('Insights', '/api/insights', 'GET', res.status, success, 
      success ? `Found ${count} insights` : JSON.stringify(res.data).substring(0, 100));
  } catch (e) {
    logTest('Insights', '/api/insights', 'GET', 0, false, e.message);
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete transaction
  if (createdResources.transactionId) {
    try {
      const res = await makeRequest('DELETE', `/api/transactions/${createdResources.transactionId}`);
      logTest('Cleanup', `/api/transactions/:id`, 'DELETE', res.status, res.status === 200 || res.status === 204, '');
    } catch (e) {
      logTest('Cleanup', '/api/transactions/:id', 'DELETE', 0, false, e.message);
    }
  }

  // Delete investment
  if (createdResources.investmentId) {
    try {
      const res = await makeRequest('DELETE', `/api/investments/${createdResources.investmentId}`);
      logTest('Cleanup', `/api/investments/:id`, 'DELETE', res.status, res.status === 200 || res.status === 204, '');
    } catch (e) {
      logTest('Cleanup', '/api/investments/:id', 'DELETE', 0, false, e.message);
    }
  }

  // Delete recurring payment
  if (createdResources.recurringPaymentId) {
    try {
      const res = await makeRequest('DELETE', `/api/recurring-payments/${createdResources.recurringPaymentId}`);
      logTest('Cleanup', `/api/recurring-payments/:id`, 'DELETE', res.status, res.status === 200 || res.status === 204, '');
    } catch (e) {
      logTest('Cleanup', '/api/recurring-payments/:id', 'DELETE', 0, false, e.message);
    }
  }

  // Delete budget
  if (createdResources.budgetId) {
    try {
      const res = await makeRequest('DELETE', `/api/budgets/categories/${createdResources.budgetId}`);
      logTest('Cleanup', `/api/budgets/categories/:id`, 'DELETE', res.status, res.status === 200 || res.status === 204, '');
    } catch (e) {
      logTest('Cleanup', '/api/budgets/categories/:id', 'DELETE', 0, false, e.message);
    }
  }

  // Delete goal
  if (createdResources.goalId) {
    try {
      const res = await makeRequest('DELETE', `/api/goals/${createdResources.goalId}`);
      logTest('Cleanup', `/api/goals/:id`, 'DELETE', res.status, res.status === 200 || res.status === 204, '');
    } catch (e) {
      logTest('Cleanup', '/api/goals/:id', 'DELETE', 0, false, e.message);
    }
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  const total = testResults.length;
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${total}`);
  console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    console.log('-'.repeat(80));
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`  [${r.category}] ${r.method} ${r.endpoint} - Status: ${r.status}`);
      if (r.details) console.log(`    Details: ${r.details.substring(0, 200)}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Group by category
  const categories = [...new Set(testResults.map(r => r.category))];
  console.log('\n📂 RESULTS BY CATEGORY:');
  console.log('-'.repeat(80));
  categories.forEach(cat => {
    const catResults = testResults.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.success).length;
    const catTotal = catResults.length;
    const icon = catPassed === catTotal ? '✅' : '⚠️';
    console.log(`  ${icon} ${cat}: ${catPassed}/${catTotal}`);
  });
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests (Version 2)');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📧 Test User: ${CREDENTIALS.email}`);
  console.log('='.repeat(80));

  try {
    // Public endpoints
    await testHealthCheck();
    await testCurrencies();
    
    // Authentication
    await testAuth();
    
    if (!authToken) {
      console.log('\n❌ Authentication failed! Cannot continue with authenticated tests.');
      printSummary();
      return;
    }
    
    // Core features
    await testDashboard();
    await testCategories();
    await testTransactions();
    await testReports();
    await testAnalytics();
    await testInvestments();
    await testRecurringPayments();
    await testBudgets();
    await testGoals();
    await testNotifications();
    await testUserSettings();
    await testFinancialSummary();
    await testPromotions();
    await testReceipts();
    await testSupportTickets();
    await testReferrals();
    await testInsights();
    
    // Cleanup
    await cleanupTestData();
    
  } catch (error) {
    console.error('💥 Unexpected error during tests:', error);
  }
  
  printSummary();
}

// Run tests
runAllTests();
