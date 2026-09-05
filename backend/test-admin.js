#!/usr/bin/env node
/**
 * Admin Endpoint Test Runner
 * Starts the backend server, then tests all admin endpoints
 */

const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

const BASE = 'http://98.130.20.52:4000';

function request(method, path, token, body) {
  return new Promise(function (resolve) {
    var url = new URL(BASE + path);
    var opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    var req = http.request(opts, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, data: data }); }
      });
    });
    req.on('error', function (err) { resolve({ status: 0, data: { error: err.message } }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

var adminToken = null;

function assert(name, condition) {
  if (condition) {
    console.log('  PASS: ' + name);
    return true;
  } else {
    console.log('  FAIL: ' + name);
    return false;
  }
}

async function runTests() {
  console.log('\n=== Admin Endpoint Tests ===\n');

  // 1. Admin Login
  console.log('1. Admin Login');
  var loginRes = await request('POST', '/api/v1/admin/login', null, {
    email: 'admin@entrymyslot.com',
    password: 'admin123'
  });
  var loginOk = assert('POST /admin/login returns 200', loginRes.status === 200);
  adminToken = loginRes.data && loginRes.data.data && loginRes.data.data.token;
  assert('Response has token field', !!adminToken);
  assert('Response has admin info', !!(loginRes.data && loginRes.data.data && loginRes.data.data.admin));

  // 2. Admin Me
  console.log('\n2. Admin Profile');
  if (adminToken) {
    var meRes = await request('GET', '/api/v1/admin/me', adminToken);
    assert('GET /admin/me returns 200', meRes.status === 200);
    assert('Admin me has email', !!(meRes.data && meRes.data.data && meRes.data.data.email));
  }

  // 3. Stats
  console.log('\n3. Dashboard Stats');
  if (adminToken) {
    var statsRes = await request('GET', '/api/v1/admin/stats', adminToken);
    assert('GET /admin/stats returns 200', statsRes.status === 200);
    assert('Stats has bookings', !!(statsRes.data && statsRes.data.data));
  }

  // 4. Events
  console.log('\n4. Events');
  if (adminToken) {
    var eventsRes = await request('GET', '/api/v1/admin/events?page=1&pageSize=5', adminToken);
    assert('GET /admin/events returns 200', eventsRes.status === 200);
    assert('Events has pagination', !!(eventsRes.data && eventsRes.data.pagination));
    assert('Events has data array', Array.isArray((eventsRes.data && eventsRes.data.data)));

    var createRes = await request('POST', '/api/v1/admin/events', adminToken, {
      title: 'Test Event',
      category: 'workshop',
      venue: 'Test Venue',
      city: 'Coimbatore',
      event_date: '2026-12-01',
      start_time: '10:00',
      end_time: '12:00',
      capacity: 100,
      price: 50000,
      currency: 'INR',
      description: 'Test description'
    });
    assert('POST /admin/events returns 200/201', createRes.status === 200 || createRes.status === 201);
    var eventId = (createRes.data && createRes.data.data && createRes.data.data.id) || 1;
  }

  // 5. Bookings
  console.log('\n5. Bookings');
  if (adminToken) {
    var bookingsRes = await request('GET', '/api/v1/admin/bookings?page=1&pageSize=5', adminToken);
    assert('GET /admin/bookings returns 200', bookingsRes.status === 200);
    assert('Bookings has pagination', !!(bookingsRes.data && bookingsRes.data.pagination));
  }

  // 6. Users
  console.log('\n6. Users');
  if (adminToken) {
    var usersRes = await request('GET', '/api/v1/admin/users?page=1&pageSize=5', adminToken);
    assert('GET /admin/users returns 200', usersRes.status === 200);
    assert('Users has pagination', !!(usersRes.data && usersRes.data.pagination));
  }

  // 7. Organizations
  console.log('\n7. Organizations');
  if (adminToken) {
    var orgsRes = await request('GET', '/api/v1/admin/organizations?page=1&pageSize=5', adminToken);
    assert('GET /admin/organizations returns 200', orgsRes.status === 200);
    assert('Organizations has pagination', !!(orgsRes.data && orgsRes.data.pagination));
  }

  // 8. Managers
  console.log('\n8. Managers');
  if (adminToken) {
    var mgrRes = await request('GET', '/api/v1/admin/managers?page=1&pageSize=10', adminToken);
    assert('GET /admin/managers returns 200', mgrRes.status === 200);
    assert('Managers has data array', Array.isArray((mgrRes.data && mgrRes.data.data)));
  }

  // 9. Turf Grounds
  console.log('\n9. Turf Grounds');
  if (adminToken) {
    var turfRes = await request('GET', '/api/v1/turf/grounds?page=1&pageSize=10', adminToken);
    assert('GET /turf/grounds returns 200', turfRes.status === 200);
    assert('Grounds has pagination', !!(turfRes.data && turfRes.data.pagination));
  }

  // 10. Turf Bookings
  console.log('\n10. Turf Bookings');
  if (adminToken) {
    var tbRes = await request('GET', '/api/v1/turf/bookings?page=1&pageSize=10', adminToken);
    assert('GET /turf/bookings returns 200', tbRes.status === 200);
    assert('Turf bookings has pagination', !!(tbRes.data && tbRes.data.pagination));
  }

  // 11. Cinemas
  console.log('\n11. Cinemas');
  if (adminToken) {
    var cinRes = await request('GET', '/api/v1/admin/movies/cinemas?page=1&pageSize=10', adminToken);
    assert('GET /admin/movies/cinemas returns 200', cinRes.status === 200);
    assert('Cinemas has pagination', !!(cinRes.data && cinRes.data.pagination));
  }

  // 12. Organizer Applications
  console.log('\n12. Organizer Applications');
  if (adminToken) {
    var appsRes = await request('GET', '/api/v1/admin/organizer-applications?page=1&pageSize=10', adminToken);
    assert('GET /admin/organizer-applications returns 200', appsRes.status === 200);
    assert('Apps has pagination', !!(appsRes.data && appsRes.data.pagination));
  }

  // 13. Audit Logs
  console.log('\n13. Audit Logs');
  if (adminToken) {
    var auditRes = await request('GET', '/api/v1/admin/audit-logs?page=1&pageSize=10', adminToken);
    assert('GET /admin/audit-logs returns 200', auditRes.status === 200);
    assert('Audit logs has pagination', !!(auditRes.data && auditRes.data.pagination));
  }

  // 14. Refunds
  console.log('\n14. Refunds');
  if (adminToken) {
    var refundRes = await request('GET', '/api/v1/admin/refunds?page=1&pageSize=10', adminToken);
    assert('GET /admin/refunds returns 200', refundRes.status === 200);
    assert('Refunds has pagination', !!(refundRes.data && refundRes.data.pagination));
  }

  // 15. Admins list
  console.log('\n15. Admin Team');
  if (adminToken) {
    var adminsRes = await request('GET', '/api/v1/admin/admins?page=1&pageSize=10', adminToken);
    assert('GET /admin/admins returns 200', adminsRes.status === 200);
  }

  // 16. Auth failure test
  console.log('\n16. Auth Protection');
  var badRes = await request('GET', '/api/v1/admin/stats', null);
  assert('GET /admin/stats without token returns 401', badRes.status === 401);

  console.log('\n=== Tests Complete ===\n');
  process.exit(0);
}

// Wait for server, then run
setTimeout(runTests, 1500);
