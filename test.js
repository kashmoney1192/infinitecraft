/**
 * Test Script - Verify API functionality
 * Usage: node test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

const tests = [];
let passed = 0;
let failed = 0;

// Helper function to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    failed++;
  }
}

// ==================== TESTS ====================

async function runTests() {
  console.log('\n🧪 Running API Tests\n');

  // Test 1: Health check
  await test('GET /api/health returns ok: true', async () => {
    const res = await request('GET', '/api/health');
    assert(res.status === 200, 'Status code should be 200');
    assert(res.body.ok === true, 'Response should have ok: true');
  });

  // Test 2: Get all elements
  await test('GET /api/elements returns array', async () => {
    const res = await request('GET', '/api/elements');
    assert(res.status === 200, 'Status code should be 200');
    assert(Array.isArray(res.body.elements), 'Should return elements array');
    assert(res.body.elements.length === 4, 'Should have 4 starting elements');
  });

  // Test 3: Combine Fire + Water = Steam
  await test('POST /api/combine (Fire + Water = Steam)', async () => {
    const res = await request('POST', '/api/combine', {
      a: 'Fire',
      b: 'Water',
      userId: 'test-user-1',
    });
    assert(res.status === 200, 'Status code should be 200');
    assert(res.body.result.name === 'Steam', 'Should create Steam');
    assert(res.body.result.emoji === '💨', 'Steam should have water emoji');
    assert(res.body.isNew === true, 'First combination should be new');
  });

  // Test 4: Same combination returns cached result
  await test('POST /api/combine (Cache test: Fire + Water again)', async () => {
    const res = await request('POST', '/api/combine', {
      a: 'Fire',
      b: 'Water',
      userId: 'test-user-2',
    });
    assert(res.status === 200, 'Status code should be 200');
    assert(res.body.result.name === 'Steam', 'Should return Steam');
    assert(res.body.isNew === false, 'Second combination should be cached');
    assert(res.body.result.firstDiscoverer === 'test-user-1', 'Should show first discoverer');
  });

  // Test 5: Order-independent combination
  await test('POST /api/combine (Water + Fire = Steam - order independent)', async () => {
    const res = await request('POST', '/api/combine', {
      a: 'Water',
      b: 'Fire',
      userId: 'test-user-3',
    });
    assert(res.status === 200, 'Status code should be 200');
    assert(res.body.result.name === 'Steam', 'Should return Steam');
    assert(res.body.isNew === false, 'Should be cached (order independent)');
  });

  // Test 6: New combination
  await test('POST /api/combine (Earth + Wind = Dust)', async () => {
    const res = await request('POST', '/api/combine', {
      a: 'Earth',
      b: 'Wind',
      userId: 'test-user-4',
    });
    assert(res.status === 200, 'Status code should be 200');
    assert(res.body.result.name === 'Dust', 'Should create Dust');
    assert(res.body.isNew === true, 'Should be new');
  });

  // Test 7: Get recipes
  await test('GET /api/recipes returns list', async () => {
    const res = await request('GET', '/api/recipes');
    assert(res.status === 200, 'Status code should be 200');
    assert(Array.isArray(res.body.recipes), 'Should return recipes array');
    assert(res.body.recipes.length > 0, 'Should have recipes');
  });

  // Test 8: Combine element with itself
  await test('POST /api/combine (Water + Water)', async () => {
    const res = await request('POST', '/api/combine', {
      a: 'Water',
      b: 'Water',
      userId: 'test-user-5',
    });
    assert(res.status === 200, 'Status code should be 200');
    assert(res.body.result, 'Should return a result');
  });

  // Test 9: Updated element count
  await test('GET /api/elements (updated count)', async () => {
    const res = await request('GET', '/api/elements');
    assert(res.status === 200, 'Status code should be 200');
    assert(res.body.elements.length > 4, 'Should have more than 4 elements now');
  });

  // Test 10: Error handling - missing parameter
  await test('POST /api/combine (error handling)', async () => {
    const res = await request('POST', '/api/combine', {
      a: 'Fire',
      // Missing 'b' parameter
    });
    assert(res.status === 400, 'Should return 400 for missing parameter');
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✨ All tests passed!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Check if server is running
setTimeout(() => {
  request('GET', '/api/health')
    .then(() => runTests())
    .catch(() => {
      console.error('❌ Server is not running on http://localhost:3000');
      console.error('Start the server first: npm start');
      process.exit(1);
    });
}, 500);
