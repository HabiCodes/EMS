/**
 * EMS Mock Backend Server
 * Minimal Node.js server using ONLY built-in modules (no npm packages).
 * Simulates the real backend for development / testing.
 *
 * Endpoints:
 *   POST /api/v1/auth/register-enhanced
 *   POST /api/v1/auth/verify-registration-otp
 *   POST /api/v1/auth/resend-registration-otp
 *   POST /api/v1/auth/login
 *   GET  /api/v1/auth/me
 *   POST /api/v1/auth/refresh-token
 *   POST /api/v1/auth/logout
 *   POST /api/v1/auth/forgot-password
 *   POST /api/v1/auth/reset-password
 *
 * Run: node server.js
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { TextEncoder, TextDecoder } = require('util');

// ---- In-memory storage ----
const otpStore = new Map();    // email → { otp, expiresAt, attempts }
const users = new Map();        // email → { email, username, passwordHash }
const refreshTokens = new Map(); // token → { email, expiresAt }
const sessions = new Map();     // accessToken → { email, expiresAt }

const OTP_TTL_MS = 10 * 60 * 1000;     // 10 minutes
const ACCESS_TTL_MS = 15 * 60 * 1000;   // 15 minutes
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const PORT = 4000;
const JWT_SECRET = 'ems-jwt-secret-dev-change-in-production';
const otpFile = path.join(__dirname, '.last-otp.json');

// ---- Helpers ----

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  payload.iat = now;
  payload.exp = now + Math.floor(ACCESS_TTL_MS / 1000);

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = headerB64 + '.' + payloadB64;

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return data + '.' + signature;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const data = headerB64 + '.' + payloadB64;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function jsonResponse(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

function authUser(req) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const payload = verifyJWT(m[1]);
  if (!payload || !payload.email) return null;
  const user = users.get(payload.email);
  if (!user) return null;
  return user;
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) otpStore.delete(key);
  }
  for (const [key, val] of sessions.entries()) {
    if (val.expiresAt < now) sessions.delete(key);
  }
  for (const [key, val] of refreshTokens.entries()) {
    if (val.expiresAt < now) refreshTokens.delete(key);
  }
}

// ---- Routes ----

async function handleRegisterEnhanced(req, res) {
  const body = await readBody(req);
  const { email, username, password } = body;

  if (!email || !username || !password) {
    return jsonResponse(res, 400, { success: false, message: 'Email, name and password are required.' });
  }
  if (password.length < 8) {
    return jsonResponse(res, 400, { success: false, message: 'Password must be at least 8 characters.' });
  }

  if (users.has(email)) {
    return jsonResponse(res, 409, { success: false, message: 'An account with this email already exists.' });
  }

  // Store user (pending verification)
  users.set(email, { email, username, passwordHash: hashPassword(password), verified: false });

  // Generate and store OTP
  const otp = generateOTP();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

  try { fs.writeFileSync(otpFile, JSON.stringify({ email, otp, ts: Date.now() }), 'utf8'); } catch {}

  console.log(`[REGISTER] OTP for ${email}: ${otp}`);

  return jsonResponse(res, 202, {
    success: true,
    message: 'A verification code has been sent to your email. Please check your inbox.',
    expiresInMinutes: 10,
  });
}

async function handleVerifyOtp(req, res) {
  const body = await readBody(req);
  const { email, otp } = body;

  if (!email || !otp) {
    return jsonResponse(res, 400, { success: false, message: 'Email and OTP are required.' });
  }

  const record = otpStore.get(email);
  if (!record) {
    return jsonResponse(res, 400, { success: false, message: 'No OTP found. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return jsonResponse(res, 400, { success: false, message: 'OTP has expired. Please request a new one.' });
  }

  record.attempts++;
  if (record.otp !== String(otp)) {
    if (record.attempts >= 5) {
      otpStore.delete(email);
      return jsonResponse(res, 400, { success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }
    return jsonResponse(res, 400, { success: false, message: 'Invalid OTP. Please try again.' });
  }

  // OTP verified — activate account
  const user = users.get(email);
  if (user) user.verified = true;
  otpStore.delete(email);

  // Generate tokens
  const accessToken = signJWT({ email, username: user ? user.username : email });
  const refreshToken = crypto.randomBytes(32).toString('hex');

  sessions.set(accessToken, { email, expiresAt: Date.now() + ACCESS_TTL_MS });
  refreshTokens.set(refreshToken, { email, expiresAt: Date.now() + REFRESH_TTL_MS });

  return jsonResponse(res, 201, {
    success: true,
    message: 'Account verified successfully! Welcome.',
    data: {
      tokens: { accessToken, refreshToken },
      user: { email, username: user ? user.username : email, isVerified: true, isActive: true },
      isNewUser: true,
    },
  });
}

async function handleResendOtp(req, res) {
  const body = await readBody(req);
  const { email } = body;

  if (!email) {
    return jsonResponse(res, 400, { success: false, message: 'Email is required.' });
  }

  const otp = generateOTP();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  console.log(`[RESEND] New OTP for ${email}: ${otp}`);

  return jsonResponse(res, 200, {
    success: true,
    message: 'A new verification code has been sent.',
  });
}

async function handleLogin(req, res) {
  const body = await readBody(req);
  const { email, password } = body;

  if (!email || !password) {
    return jsonResponse(res, 400, { success: false, message: 'Email and password are required.' });
  }

  const user = users.get(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return jsonResponse(res, 401, { success: false, message: 'Invalid email or password.' });
  }

  if (!user.verified) {
    return jsonResponse(res, 403, { success: false, message: 'Please verify your email before logging in.' });
  }

  const accessToken = signJWT({ email, username: user.username });
  const refreshToken = crypto.randomBytes(32).toString('hex');

  sessions.set(accessToken, { email, expiresAt: Date.now() + ACCESS_TTL_MS });
  refreshTokens.set(refreshToken, { email, expiresAt: Date.now() + REFRESH_TTL_MS });

  return jsonResponse(res, 200, {
    success: true,
    data: {
      user: { email: user.email, username: user.username, isVerified: true, isActive: true },
      tokens: { accessToken, refreshToken },
    },
  });
}

async function handleGetMe(req, res) {
  const user = authUser(req);
  if (!user) {
    return jsonResponse(res, 401, { success: false, message: 'Not authenticated.' });
  }
  return jsonResponse(res, 200, {
    success: true,
    data: {
      id: crypto.createHash('md5').update(user.email).digest('hex').slice(0, 8),
      email: user.email,
      username: user.username,
      isVerified: user.verified,
      isActive: true,
    },
  });
}

async function handleRefreshToken(req, res) {
  const body = await readBody(req);
  const { refreshToken } = body;

  if (!refreshToken) {
    return jsonResponse(res, 400, { success: false, message: 'Refresh token is required.' });
  }

  const record = refreshTokens.get(refreshToken);
  if (!record || record.expiresAt < Date.now()) {
    if (record) refreshTokens.delete(refreshToken);
    return jsonResponse(res, 401, { success: false, message: 'Invalid or expired refresh token.' });
  }

  const user = users.get(record.email);
  if (!user) {
    return jsonResponse(res, 401, { success: false, message: 'User not found.' });
  }

  const accessToken = signJWT({ email: user.email, username: user.username });
  sessions.set(accessToken, { email: user.email, expiresAt: Date.now() + ACCESS_TTL_MS });

  return jsonResponse(res, 200, {
    success: true,
    data: { accessToken, refreshToken },
  });
}

async function handleLogout(req, res) {
  const body = await readBody(req);
  const { refreshToken } = body;
  if (refreshToken) refreshTokens.delete(refreshToken);
  return jsonResponse(res, 200, { success: true, message: 'Logged out successfully.' });
}

async function handleForgotPassword(req, res) {
  const body = await readBody(req);
  const { email } = body;
  // Always return success (prevents email enumeration)
  if (email && users.has(email)) {
    const otp = generateOTP();
    otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    console.log(`[FORGOT] Reset OTP for ${email}: ${otp}`);
  }
  return jsonResponse(res, 200, { success: true, message: 'If an account exists, a reset link has been sent.' });
}

async function handleResetPassword(req, res) {
  const body = await readBody(req);
  const { token, newPassword } = body;

  if (!token || !newPassword) {
    return jsonResponse(res, 400, { success: false, message: 'Token and new password are required.' });
  }
  if (newPassword.length < 8) {
    return jsonResponse(res, 400, { success: false, message: 'Password must be at least 8 characters.' });
  }

  const user = users.get(token);
  if (user) {
    user.passwordHash = hashPassword(newPassword);
    return jsonResponse(res, 200, { success: true, message: 'Password reset successfully.' });
  }

  return jsonResponse(res, 400, { success: false, message: 'Invalid or expired reset token.' });
}

// ---- Request Router ----

const routes = {
  'POST:/api/v1/auth/register-enhanced': handleRegisterEnhanced,
  'POST:/api/v1/auth/verify-registration-otp': handleVerifyOtp,
  'POST:/api/v1/auth/resend-registration-otp': handleResendOtp,
  'POST:/api/v1/auth/login': handleLogin,
  'POST:/api/v1/auth/login-enhanced': handleLogin,
  'GET:/api/v1/auth/me': handleGetMe,
  'POST:/api/v1/auth/refresh-token': handleRefreshToken,
  'POST:/api/v1/auth/logout': handleLogout,
  'POST:/api/v1/auth/forgot-password': handleForgotPassword,
  'POST:/api/v1/auth/reset-password': handleResetPassword,
};

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    });
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;
  const key = method + ':' + pathname;

  cleanExpired();

  const handler = routes[key];
  if (handler) {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[ERROR] ${method} ${pathname}:`, err);
      jsonResponse(res, 500, { success: false, message: 'Internal server error.' });
    }
  } else {
    jsonResponse(res, 404, { success: false, message: 'Not found.' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  EMS Mock Backend running at http://localhost:${PORT}`);
  console.log(`  Auth endpoints at http://localhost:${PORT}/api/v1/auth/*`);
  console.log(`\n  Press Ctrl+C to stop.\n`);
});
