'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function response(status, body, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: name => name.toLowerCase() === 'content-type' ? contentType : null },
    json: async () => body,
    text: async () => String(body || ''),
  };
}

function harness(responses) {
  const values = new Map();
  const calls = [];
  const localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  const window = {
    EMS_API_CONFIG: { BASE_URL: 'https://api.entrymyslot.com', API_BASE: '/api/v1' },
  };
  const context = vm.createContext({
    window,
    localStorage,
    console,
    fetch: async (url, options) => {
      calls.push({ url, options });
      const next = responses.shift();
      if (!next) throw new Error('Unexpected fetch: ' + url);
      return next;
    },
  });
  vm.runInContext(fs.readFileSync('frontend/public/js/auth.js', 'utf8'), context);
  return { auth: vm.runInContext('EMS_AUTH', context), calls, values };
}

async function run() {
  const session = {
    user: { id: 7, email: 'customer@example.com', username: 'Customer' },
    tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
  };
  const h = harness([
    response(200, { success: true, data: session }),
    response(202, { success: true, message: 'OTP sent' }),
    response(201, { success: true, data: session }),
    response(200, { success: true, message: 'OTP resent' }),
    response(200, { success: true, message: 'Reset sent' }),
  ]);

  await h.auth.login('customer@example.com', 'secret123');
  assert.equal(h.calls[0].url, 'https://api.entrymyslot.com/api/v1/auth/login');
  assert.equal(h.values.get('ems_access_token'), 'access-token');

  await h.auth.register({ email: 'new@example.com', username: 'New User', password: 'secret123' });
  assert.equal(h.calls[1].url, 'https://api.entrymyslot.com/api/v1/auth/register-enhanced');
  assert.deepEqual(JSON.parse(h.calls[1].options.body), {
    email: 'new@example.com', username: 'New User', password: 'secret123',
  });

  await h.auth.verifyRegistrationOtp('new@example.com', '123456');
  assert.equal(h.calls[2].url, 'https://api.entrymyslot.com/api/v1/auth/verify-registration-otp');
  await h.auth.resendRegistrationOtp('new@example.com');
  assert.equal(h.calls[3].url, 'https://api.entrymyslot.com/api/v1/auth/resend-registration-otp');
  await h.auth.forgotPassword('new@example.com');
  assert.equal(h.calls[4].url, 'https://api.entrymyslot.com/api/v1/auth/forgot-password');

  const html = harness([response(404, '<!DOCTYPE html><title>Not Found</title>', 'text/html')]);
  const failed = await html.auth.login('customer@example.com', 'bad-password');
  assert.equal(failed.data.message, 'Authentication service returned an unexpected response.');
  assert.ok(!failed.data.message.includes('<!DOCTYPE'));

  console.log('Customer auth API contract tests passed.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
