const http = require('http');

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://127.0.0.1:4000' + path);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: 4000,
      path: url.pathname, method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    const r = http.request(opts, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
        catch(e) { resolve({ status: res.statusCode, raw: b }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  console.log('=== Super Admin API Smoke Test ===\n');
  console.log('1. POST /api/v1/admin/login');
  let r = await req('POST', '/api/v1/admin/login', { email: 'admin@entrymyslot.com', password: 'admin123' });
  console.log('   Status:', r.status);
  const token = r.data && r.data.success ? r.data.data.token : null;
  if (!token) {
    console.log('   FAILED:', JSON.stringify(r.data || r.raw).slice(0,300));
    process.exit(1);
  }
  console.log('   Token obtained\n');

  const tests = [
    ['GET', '/api/v1/admin/me'],
    ['GET', '/api/v1/admin/stats'],
    ['GET', '/api/v1/admin/events'],
    ['GET', '/api/v1/admin/bookings'],
    ['GET', '/api/v1/admin/recent-tickets'],
    ['GET', '/api/v1/admin/users'],
    ['GET', '/api/v1/admin/admins'],
    ['GET', '/api/v1/admin/audit-logs'],
    ['GET', '/api/v1/admin/organizations'],
    ['GET', '/api/v1/admin/managers'],
    ['GET', '/api/v1/admin/movies'],
    ['GET', '/api/v1/admin/movies/cinemas'],
    ['GET', '/api/v1/admin/showtimes'],
    ['GET', '/api/v1/admin/banners'],
    ['GET', '/api/v1/admin/media'],
    ['GET', '/api/v1/admin/refunds'],
    ['GET', '/api/v1/admin/organizer-applications'],
    ['GET', '/api/v1/admin/turf/grounds'],
    ['POST', '/api/v1/admin/organizations', { name: 'Test Org', email: 'test@test.com', type: 'event', city: 'Bangalore' }],
    ['POST', '/api/v1/admin/movies', { title: 'Test Movie', genre: 'Action', language: 'English' }],
    ['POST', '/api/v1/admin/managers', { name: 'Test Manager', email: 'manager@test.com', organization_id: 'org-001' }],
  ];

  let pass = 0, fail = 0;
  for (let i = 0; i < tests.length; i++) {
    const [method, path, body] = tests[i];
    const label = `${method} ${path}`;
    console.log(`${i+2}. ${label}`);
    try {
      r = await req(method, path, body);
      const ok = r.status >= 200 && r.status < 300;
      const success = r.data && r.data.success;
      if (ok && success) { console.log(`   PASS (${r.status}) ✓`); pass++; }
      else { console.log(`   FAIL (${r.status}): ${(r.data&&(r.data.message||r.data.error))||JSON.stringify(r.data||r.raw).slice(0,100)}`); fail++; }
    } catch(e) { console.log(`   ERROR: ${e.message}`); fail++; }
  }
  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}
run();
