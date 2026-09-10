'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => 'application/json' },
    json: async () => body,
  };
}

function createHarness(responses) {
  const values = new Map();
  const calls = [];
  const window = {
    EMS_API_CONFIG: {
      BASE_URL: 'https://api.entrymyslot.com',
      API_BASE: '/api/v1',
    },
    localStorage: {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      const next = responses.shift();
      if (!next) throw new Error('Unexpected fetch: ' + url);
      return typeof next === 'function' ? next(url, options) : next;
    },
  };

  const context = vm.createContext({ window, URLSearchParams, console, Error, Object, String, JSON });
  const source = fs.readFileSync('frontend/public/js/owner-api.js', 'utf8');
  vm.runInContext(source, context, { filename: 'owner-api.js' });
  return { api: window.EMS_OWNER_API, calls, values };
}

async function run() {
  const owner = {
    id: 7,
    organization_id: 3,
    email: 'owner@example.com',
    name: 'Owner',
    role: 'owner',
  };

  const loginHarness = createHarness([
    jsonResponse(200, {
      success: true,
      data: { user: owner, accessToken: 'access-1', refreshToken: 'refresh-1' },
    }),
    jsonResponse(200, { success: true, data: { overview: { totalBookings: 2 } } }),
  ]);

  await loginHarness.api.login('owner@example.com', 'secret');
  await loginHarness.api.getDashboard({ from: '2026-09-01', to: '2026-09-10' });
  assert.equal(loginHarness.calls[0].url, 'https://api.entrymyslot.com/api/v1/organizer/auth/login');
  assert.deepEqual(JSON.parse(loginHarness.calls[0].options.body), { email: 'owner@example.com', password: 'secret' });
  assert.equal(loginHarness.calls[1].options.headers.Authorization, 'Bearer access-1');
  assert.match(loginHarness.calls[1].url, /\/owner\/dashboard\?from=2026-09-01&to=2026-09-10$/);

  const refreshHarness = createHarness([
    jsonResponse(200, {
      success: true,
      data: { user: owner, accessToken: 'access-old', refreshToken: 'refresh-old' },
    }),
    jsonResponse(401, { success: false, message: 'expired' }),
    jsonResponse(200, {
      success: true,
      data: { user: owner, accessToken: 'access-new', refreshToken: 'refresh-new' },
    }),
    jsonResponse(200, { success: true, data: { id: 3, name: 'Org' } }),
  ]);

  await refreshHarness.api.login('owner@example.com', 'secret');
  const organization = await refreshHarness.api.getOrganization();
  assert.equal(organization.data.id, 3);
  assert.equal(refreshHarness.calls[3].options.headers.Authorization, 'Bearer access-new');
  assert.equal(refreshHarness.values.get('ems_owner_refresh_token'), 'refresh-new');

  const managerHarness = createHarness([
    jsonResponse(200, {
      success: true,
      data: { user: { ...owner, role: 'manager' }, accessToken: 'bad', refreshToken: 'bad' },
    }),
  ]);
  await assert.rejects(
    () => managerHarness.api.login('manager@example.com', 'secret'),
    /Owner access is required/
  );
  assert.equal(managerHarness.api.restoreSession().accessToken, null);

  console.log('Owner API contract tests passed.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
