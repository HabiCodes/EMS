'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function response(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

function harness(responses) {
  const storage = new Map();
  const calls = [];
  const window = {
    EMS_API_CONFIG: { BASE_URL: 'https://api.entrymyslot.com', API_BASE: '/api/v1' },
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      const next = responses.shift();
      if (!next) throw new Error('Unexpected fetch: ' + url);
      return next;
    },
  };
  const context = vm.createContext({ window, URLSearchParams, JSON, Object, String, Error });
  vm.runInContext(fs.readFileSync('frontend/public/js/manager-api.js', 'utf8'), context);
  return { api: window.EMS_MANAGER_API, calls, storage };
}

async function run() {
  const manager = { id: 9, organization_id: 5, email: 'manager@example.com', name: 'Manager', role: 'manager', permissions: {} };
  const h = harness([
    response(200, { success: true, data: { user: manager, accessToken: 'access', refreshToken: 'refresh' } }),
    response(200, { success: true, data: { items: [] } }),
    response(200, { success: true, data: [] }),
    response(200, { success: true, data: { bookings: [] } }),
    response(200, { success: true, data: { valid: true } }),
    response(201, { success: true, data: { booking: { id: 22 } } }),
    response(200, { success: true, data: { id: 22, status: 'cancelled' } }),
  ]);
  await h.api.login('manager@example.com', 'secret');
  await h.api.getEvents({ page: 1, pageSize: 100 });
  await h.api.getMovieOfflineBookings({ page: 1, pageSize: 100 });
  await h.api.getTurfAttendance(5, { date: '2026-09-10' });
  await h.api.validateTurfQr(5, 'qr-token');
  await h.api.createTurfOfflineBooking(5, { availabilityUnitId: 18, customerName: 'Walk In', customerPhone: '9999999999', quantity: 1 });
  await h.api.cancelTurfBooking(5, 22, 'Cancelled by manager');
  assert.equal(h.calls[0].url, 'https://api.entrymyslot.com/api/v1/organizer/auth/login');
  assert.equal(h.calls[1].url, 'https://api.entrymyslot.com/api/v1/organizer/events?page=1&pageSize=100');
  assert.equal(h.calls[2].url, 'https://api.entrymyslot.com/api/v1/organizer/movies/offline-bookings?page=1&pageSize=100');
  assert.equal(h.calls[3].url, 'https://api.entrymyslot.com/api/v1/turf/manager/organizations/5/attendance?date=2026-09-10');
  assert.equal(h.calls[3].options.headers.Authorization, 'Bearer access');
  assert.equal(h.calls[4].url, 'https://api.entrymyslot.com/api/v1/turf/manager/organizations/5/validate-qr');
  assert.deepEqual(JSON.parse(h.calls[4].options.body), { token: 'qr-token' });
  assert.equal(h.calls[5].url, 'https://api.entrymyslot.com/api/v1/turf/manager/organizations/5/offline-booking');
  assert.equal(h.calls[6].url, 'https://api.entrymyslot.com/api/v1/turf/manager/organizations/5/bookings/22/cancel');

  const owner = harness([
    response(200, { success: true, data: { user: { ...manager, role: 'owner' }, accessToken: 'x', refreshToken: 'y' } }),
  ]);
  await assert.rejects(() => owner.api.login('owner@example.com', 'secret'), /Manager access is required/);
  assert.equal(owner.api.restoreSession().accessToken, null);

  for (const file of ['event-manager-dash.html', 'movie-manager-dash.html', 'turf-manager-dash.html']) {
    const html = fs.readFileSync('frontend/public/' + file, 'utf8');
    assert.match(html, /<script src="js\/manager-api\.js"><\/script>/);
    const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
    inlineScripts.forEach(match => new Function(match[1]));
  }

  console.log('Manager API contract tests passed.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
