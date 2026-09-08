/**
 * EMS Mock Backend Server
 * Minimal Node.js server using ONLY built-in modules (no npm packages).
 * Simulates the real backend for development / testing.
 *
 * Auth:
 *   Customer: POST /api/v1/auth/* (JWT secret: ems-jwt-secret-dev-change-in-production)
 *   Admin:    POST /api/v1/admin/login (JWT secret: ems-admin-secret-dev-change-in-production)
 *
 * Run: node server.js
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ── JWT Secrets ────────────────────────────────────────────────────
const CUSTOMER_JWT_SECRET = 'ems-jwt-secret-dev-change-in-production';
const ADMIN_JWT_SECRET = 'ems-admin-secret-dev-change-in-production';
const ADMIN_JWT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// ── Storage ────────────────────────────────────────────────────────
const otpStore = new Map();
const users = new Map();
const refreshTokens = new Map();
const sessions = new Map();

// Admin data stores
const adminAccounts = new Map(); // email → { email, passwordHash, name, role, permissions, isActive }
const adminTokens = new Map();    // token → { email, expiresAt }

// Mock data stores
const events = new Map();
const bookings = new Map();
const organizations = new Map();
const managers = new Map();
const turfGrounds = new Map();
const turfBookings = new Map();
const cinemas = new Map();
const organizerApplications = new Map();
const auditLogs = new Map();
const refunds = new Map();
const movies = new Map();
const mockHolds = {};
const mockShowtimes = {};
const mockOrganizerTokens = {};

const OTP_TTL_MS = 10 * 60 * 1000;
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const PORT = 4000;
const otpFile = path.join(__dirname, '.last-otp.json');
let nextId = 1;

function genId() { return String(nextId++); }

// ── Seed Mock Data ─────────────────────────────────────────────────
(function seedData() {
  // Seed admin account
  adminAccounts.set('admin@entrymyslot.com', {
    email: 'admin@entrymyslot.com',
    passwordHash: hashPassword('admin123', ADMIN_JWT_SECRET),
    name: 'Super Admin',
    role: 'super_admin',
    permissions: ['all'],
    isActive: true,
  });

  // Seed customer users
  var demoUsers = [
    { email: 'user1@test.com', username: 'Alice', passwordHash: hashPassword('pass1234', CUSTOMER_JWT_SECRET), verified: true },
    { email: 'user2@test.com', username: 'Bob', passwordHash: hashPassword('pass1234', CUSTOMER_JWT_SECRET), verified: true },
    { email: 'user3@test.com', username: 'Charlie', passwordHash: hashPassword('pass1234', CUSTOMER_JWT_SECRET), verified: true },
    { email: 'user4@test.com', username: 'Diana', passwordHash: hashPassword('pass1234', CUSTOMER_JWT_SECRET), verified: true },
    { email: 'user5@test.com', username: 'Eve', passwordHash: hashPassword('pass1234', CUSTOMER_JWT_SECRET), verified: true },
  ];
  demoUsers.forEach(function(u) { users.set(u.email, u); });

  // Seed organizations
  var orgData = [
    { name: 'SportsZone India', type: 'Sports', is_active: true },
    { name: 'CineMax Theatres', type: 'Entertainment', is_active: true },
    { name: 'EventPro Management', type: 'Events', is_active: true },
    { name: 'Turf Masters', type: 'Sports', is_active: false },
    { name: 'LiveStage Entertainment', type: 'Events', is_active: true },
  ];
  orgData.forEach(function(o) {
    var id = genId();
    organizations.set(id, Object.assign({ id: id, created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString() }, o));
  });

  // Seed events
  var evtData = [
    { title: 'Tech Conference 2026', category: 'meetup', venue: 'CODISSIA', city: 'Coimbatore', capacity: 500, price: 200000, status: 'published' },
    { title: 'Rock Concert Night', category: 'concert', venue: 'Brooke Bond', city: 'Coimbatore', capacity: 1000, price: 50000, status: 'published' },
    { title: 'Stand-up Comedy Show', category: 'comedy', venue: 'The Grubhouse', city: 'Bangalore', capacity: 200, price: 35000, status: 'published' },
    { title: 'Football Tournament', category: 'sports', venue: 'SportsZone Turf', city: 'Coimbatore', capacity: 100, price: 100000, status: 'draft' },
    { title: 'Music Festival 2026', category: 'festival', venue: 'Exhibition Ground', city: 'Coimbatore', capacity: 5000, price: 150000, status: 'published' },
    { title: 'React Workshop', category: 'workshop', venue: 'Tech Park', city: 'Bangalore', capacity: 50, price: 10000, status: 'published' },
    { title: 'Theater Play: Hamlet', category: 'theater', venue: 'Cultural Center', city: 'Coimbatore', capacity: 300, price: 25000, status: 'published' },
    { title: 'Marathon Run', category: 'sports', venue: 'City Center', city: 'Coimbatore', capacity: 2000, price: 5000, status: 'pending' },
  ];
  evtData.forEach(function(ev) {
    var id = genId();
    events.set(id, Object.assign({
      id: id,
      description: 'A great ' + ev.category + ' event.',
      event_date: '2026-0' + (3 + Math.floor(Math.random() * 8)) + '-' + String(10 + Math.floor(Math.random() * 20)).padStart(2, '0'),
      start_time: '10:00',
      end_time: '18:00',
      currency: 'INR',
      organization_id: Math.floor(Math.random() * 5) + 1,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString(),
    }, ev));
  });

  // Seed bookings
  var statuses = ['confirmed', 'confirmed', 'confirmed', 'pending_payment', 'cancelled'];
  var types = ['event', 'event', 'event', 'turf', 'movie'];
  var userIds = Array.from(users.keys());
  var eventIds = Array.from(events.keys());
  for (var i = 0; i < 25; i++) {
    var bid = genId();
    var type = types[i % types.length];
    bookings.set(bid, {
      id: bid,
      type: type,
      user_email: userIds[i % userIds.length],
      user_username: users.get(userIds[i % userIds.length]).username,
      event_title: type === 'turf' ? 'Turf Booking' : (type === 'movie' ? 'Movie Ticket' : (events.get(eventIds[i % eventIds.length]) || {}).title || 'Event'),
      totalAmount: (Math.floor(Math.random() * 20) + 1) * 10000,
      amount: (Math.floor(Math.random() * 20) + 1) * 10000,
      status: statuses[i % statuses.length],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 14 * 86400000)).toISOString(),
    });
  }

  // Seed turf grounds
  var turfData = [
    { name: 'SportsZone A', sport: 'Football', status: 'active', organization_id: '1', city: 'Coimbatore' },
    { name: 'SportsZone B', sport: 'Cricket', status: 'active', organization_id: '1', city: 'Coimbatore' },
    { name: 'Turf Masters Main', sport: 'Football', status: 'active', organization_id: '4', city: 'Coimbatore' },
    { name: 'Indoor Badminton Court', sport: 'Badminton', status: 'active', organization_id: '1', city: 'Coimbatore' },
  ];
  turfData.forEach(function(t) {
    var id = genId();
    turfGrounds.set(id, Object.assign({ id: id }, t));
  });

  // Seed turf bookings
  for (var j = 0; j < 8; j++) {
    var tid = genId();
    turfBookings.set(tid, {
      id: tid,
      ground_id: String((j % 4) + 1),
      ground_name: turfData[j % 4].name,
      user_email: userIds[j % userIds.length],
      user_name: users.get(userIds[j % userIds.length]).username,
      date: '2026-0' + (4 + (j % 6)) + '-' + String(10 + (j % 20)).padStart(2, '0'),
      slot: (j % 8) + ':00 - ' + ((j % 8) + 1) + ':00',
      amount: (Math.floor(Math.random() * 5) + 1) * 10000,
      status: statuses[j % statuses.length],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 10 * 86400000)).toISOString(),
    });
  }

  // Seed cinemas
  var cinemaData = [
    { name: 'CineMax Coimbatore', city: 'Coimbatore', screen_count: 6, is_active: true },
    { name: 'CineMax Bangalore', city: 'Bangalore', screen_count: 8, is_active: true },
    { name: 'IMAX Theater', city: 'Coimbatore', screen_count: 4, is_active: true },
  ];
  cinemaData.forEach(function(c) {
    var id = genId();
    cinemas.set(id, Object.assign({ id: id }, c));
  });

  // Seed movies
  var movieData = [
    { title: 'Avengers: Endgame', genre: 'Action', language: 'English', slug: 'avengers-endgame' },
    { title: 'KGF Chapter 2', genre: 'Action', language: 'Kannada', slug: 'kgf-chapter-2' },
    { title: 'Vikram', genre: 'Thriller', language: 'Tamil', slug: 'vikram' },
    { title: 'Jawan', genre: 'Action', language: 'Hindi', slug: 'jawan' },
    { title: 'Leo', genre: 'Action', language: 'Tamil', slug: 'leo' },
  ];
  movieData.forEach(function(m) {
    var id = genId();
    movies.set(id, Object.assign({ id: id, is_active: true }, m));
  });

  // Seed organizer applications
  var appData = [
    { organization_name: 'SportsZone India', email: 'contact@sportszone.in', status: 'pending' },
    { organization_name: 'CineMax Theatres', email: 'admin@cinemax.in', status: 'approved' },
    { organization_name: 'New Event Co', email: 'hello@newevent.co', status: 'under_review' },
  ];
  appData.forEach(function(a) {
    var id = genId();
    organizerApplications.set(id, Object.assign({
      id: id,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 14 * 86400000)).toISOString(),
    }, a));
  });

  // Seed audit logs
  var actions = ['login', 'create_event', 'cancel_booking', 'update_user', 'approve_application'];
  var entities = ['user', 'event', 'booking', 'organization', 'application'];
  for (var k = 0; k < 15; k++) {
    var lid = genId();
    auditLogs.set(lid, {
      id: lid,
      action: actions[k % actions.length],
      entity_type: entities[k % entities.length],
      entity_id: String(Math.floor(Math.random() * 10) + 1),
      actor: k < 5 ? { email: 'admin@entrymyslot.com', name: 'Super Admin' } : { email: 'user' + ((k % 5) + 1) + '@test.com', name: 'User ' + ((k % 5) + 1) },
      metadata: { ip: '192.168.1.' + (10 + k), user_agent: 'Chrome/120' },
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString(),
    });
  }

  // Seed refunds
  for (var r = 0; r < 10; r++) {
    var rid = genId();
    refunds.set(rid, {
      id: rid,
      payment_order_id: 'ORD' + String(1000 + r),
      amount: (Math.floor(Math.random() * 10) + 1) * 5000,
      status: r < 3 ? 'processed' : (r < 7 ? 'pending' : 'rejected'),
      created_at: new Date(Date.now() - Math.floor(Math.random() * 14 * 86400000)).toISOString(),
    });
  }

  // Seed managers
  var mgrData = [
    { name: 'Manager One', email: 'mgr1@test.com', organization_id: '1', is_active: true },
    { name: 'Manager Two', email: 'mgr2@test.com', organization_id: '2', is_active: true },
    { name: 'Manager Three', email: 'mgr3@test.com', organization_id: '3', is_active: false },
  ];
  mgrData.forEach(function(m) {
    var id = genId();
    managers.set(id, Object.assign({ id: id, temp_password: 'temp123' }, m));
  });
})();

// ── Helpers ────────────────────────────────────────────────────────

function hashPassword(password, secret) {
  return crypto.createHash('sha256').update(password + secret).digest('hex');
}

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJWT(payload, secret, ttlMs) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  payload.iat = now;
  payload.exp = now + Math.floor(ttlMs / 1000);
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = headerB64 + '.' + payloadB64;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return data + '.' + signature;
}

function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const data = headerB64 + '.' + payloadB64;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function jsonResponse(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT, PATCH',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise(function(resolve) {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

// Admin auth middleware
function authenticateOrganizer(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  const data = mockOrganizerTokens[token];
  if (!data || data.expiresAt < Date.now()) return null;
  return data;
}

function authenticateUser(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  const session = customerTokens.get(token);
  if (!session || session.expiresAt < Date.now()) return null;
  return { id: session.userId, email: session.email, username: session.username };
}

// Override old authUser to use the correct middleware
const authUser = authenticateUser;
const authenticateAdmin = function(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  const data = adminTokens.get(token);
  if (!data || data.expiresAt < Date.now()) return null;
  return { email: data.email, role: data.role, permissions: data.permissions };
};

// ── Customer: Events (public) ────────────────────────────────────────
}

// Customer auth middleware
function authUser(req) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const payload = verifyJWT(m[1], CUSTOMER_JWT_SECRET);
  if (!payload || !payload.email) return null;
  const user = users.get(payload.email);
  if (!user) return null;
  return user;
}

function paginate(items, page, pageSize) {
  page = Math.max(1, parseInt(page) || 1);
  pageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 10));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return { data: data, pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages } };
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
  for (const [key, val] of adminTokens.entries()) {
    if (val.expiresAt < now) adminTokens.delete(key);
  }
}

// ── Customer Auth Routes ───────────────────────────────────────────

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

  users.set(email, { email, username, passwordHash: hashPassword(password, CUSTOMER_JWT_SECRET), verified: false });
  const otp = generateOTP();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

  try { fs.writeFileSync(otpFile, JSON.stringify({ email, otp, ts: Date.now() }), 'utf8'); } catch {}

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

  const user = users.get(email);
  if (user) user.verified = true;
  otpStore.delete(email);

  const accessToken = signJWT({ email, username: user ? user.username : email }, CUSTOMER_JWT_SECRET, ACCESS_TTL_MS);
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
  console.log('[RESEND] New OTP for ' + email + ': ' + otp);

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
  if (!user || user.passwordHash !== hashPassword(password, CUSTOMER_JWT_SECRET)) {
    return jsonResponse(res, 401, { success: false, message: 'Invalid email or password.' });
  }

  if (!user.verified) {
    return jsonResponse(res, 403, { success: false, message: 'Please verify your email before logging in.' });
  }

  const accessToken = signJWT({ email, username: user.username }, CUSTOMER_JWT_SECRET, ACCESS_TTL_MS);
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

  const accessToken = signJWT({ email: user.email, username: user.username }, CUSTOMER_JWT_SECRET, ACCESS_TTL_MS);
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
  if (email && users.has(email)) {
    const otp = generateOTP();
    otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    console.log('[FORGOT] Reset OTP for ' + email + ': ' + otp);
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
    user.passwordHash = hashPassword(newPassword, CUSTOMER_JWT_SECRET);
    return jsonResponse(res, 200, { success: true, message: 'Password reset successfully.' });
  }

  return jsonResponse(res, 400, { success: false, message: 'Invalid or expired reset token.' });
}

// ── Admin Auth Routes ──────────────────────────────────────────────

async function handleAdminLogin(req, res) {
  const body = await readBody(req);
  const { email, password } = body;

  if (!email || !password) {
    return jsonResponse(res, 400, { success: false, error: 'Email and password are required.' });
  }

  const admin = adminAccounts.get(email);
  if (!admin || admin.passwordHash !== hashPassword(password, ADMIN_JWT_SECRET)) {
    return jsonResponse(res, 401, { success: false, error: 'Invalid email or password.' });
  }

  if (!admin.isActive) {
    return jsonResponse(res, 403, { success: false, error: 'Account is deactivated. Contact Super Admin.' });
  }

  const token = signJWT({ email: admin.email, role: admin.role, permissions: admin.permissions }, ADMIN_JWT_SECRET, ADMIN_JWT_TTL_MS);
  adminTokens.set(token, { email: admin.email, expiresAt: Date.now() + ADMIN_JWT_TTL_MS });

  return jsonResponse(res, 200, {
    success: true,
    data: {
      token: token,
      admin: {
        id: crypto.createHash('md5').update(admin.email).digest('hex').slice(0, 8),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive,
      },
    },
  });
}

async function handleAdminMe(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) {
    return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });
  }

  return jsonResponse(res, 200, {
    success: true,
    data: {
      id: crypto.createHash('md5').update(admin.email).digest('hex').slice(0, 8),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
    },
  });
}

// ── Admin Dashboard Stats ──────────────────────────────────────────

async function handleAdminStats(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) {
    return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });
  }

  const allBookings = Array.from(bookings.values());
  const allEvents = Array.from(events.values());
  const allUsers = Array.from(users.values());

  const bookingStats = {
    total: allBookings.length,
    confirmed: allBookings.filter(function(b) { return b.status === 'confirmed'; }).length,
    cancelled: allBookings.filter(function(b) { return b.status === 'cancelled'; }).length,
    pending: allBookings.filter(function(b) { return b.status === 'pending_payment'; }).length,
    totalTickets: allBookings.reduce(function(s, b) { return s + (b.tickets_count || 1); }, 0),
  };

  const eventStats = {
    total: allEvents.length,
    published: allEvents.filter(function(e) { return e.status === 'published'; }).length,
    draft: allEvents.filter(function(e) { return e.status === 'draft'; }).length,
    pending: allEvents.filter(function(e) { return e.status === 'pending'; }).length,
    cancelled: allEvents.filter(function(e) { return e.status === 'cancelled'; }).length,
  };

  return jsonResponse(res, 200, {
    success: true,
    data: {
      bookings: bookingStats,
      events: eventStats,
      users: allUsers.length,
      organizations: organizations.size,
      checkIns: { total: allBookings.filter(function(b) { return b.checked_in; }).length },
      revenue: allBookings.filter(function(b) { return b.status === 'confirmed'; }).reduce(function(s, b) { return s + (b.amount || 0); }, 0),
    },
  });
}

// ── Admin Events ───────────────────────────────────────────────────

async function handleListEvents(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  const items = Array.from(events.values());
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleCreateEvent(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const body = await readBody(req);
  const id = genId();
  const evt = Object.assign({
    id: id,
    status: 'draft',
    created_at: new Date().toISOString(),
    currency: 'INR',
    organization_id: '0',
  }, body);
  events.set(id, evt);

  return jsonResponse(res, 201, { success: true, data: evt, message: 'Event created successfully.' });
}

async function handleAdminEvent(req, res, eventId) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const evt = events.get(eventId);
  if (!evt) return jsonResponse(res, 404, { success: false, error: 'Event not found.' });

  if (req.method === 'DELETE') {
    events.delete(eventId);
    return jsonResponse(res, 200, { success: true, message: 'Event deleted permanently.' });
  }

  if (req.method === 'PUT') {
    const body = await readBody(req);
    const updated = Object.assign({}, evt, body);
    events.set(eventId, updated);
    return jsonResponse(res, 200, { success: true, data: updated });
  }

  return jsonResponse(res, 405, { success: false, error: 'Method not allowed.' });
}

async function handleAdminEventAction(req, res, eventId, action) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const evt = events.get(eventId);
  if (!evt) return jsonResponse(res, 404, { success: false, error: 'Event not found.' });

  var messages = {
    cancel: 'Event cancelled.',
    publish: 'Event published.',
    hide: 'Event hidden.',
    restore: 'Event restored.',
    featured: 'Featured status updated.',
  };

  switch (action) {
    case 'cancel':
      evt.status = 'cancelled';
      break;
    case 'publish':
      evt.status = 'published';
      break;
    case 'hide':
      evt.status = 'hidden';
      break;
    case 'restore':
      evt.status = 'published';
      break;
    case 'featured':
      const body = await readBody(req);
      evt.featured = !!body.featured;
      break;
  }
  events.set(eventId, evt);

  return jsonResponse(res, 200, { success: true, data: evt, message: messages[action] || 'Done.' });
}

// ── Admin Bookings ─────────────────────────────────────────────────

async function handleListBookings(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(bookings.values());

  if (q.search) {
    const s = q.search.toLowerCase();
    items = items.filter(function(b) {
      return (b.id && b.id.indexOf(s) !== -1) ||
             (b.user_email && b.user_email.toLowerCase().indexOf(s) !== -1) ||
             (b.user_username && b.user_username.toLowerCase().indexOf(s) !== -1) ||
             (b.event_title && b.event_title.toLowerCase().indexOf(s) !== -1);
    });
  }
  if (q.status) {
    items = items.filter(function(b) { return b.status === q.status; });
  }

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleCancelBooking(req, res, bookingId) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const booking = bookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Booking not found.' });

  booking.status = 'cancelled';
  bookings.set(bookingId, booking);

  return jsonResponse(res, 200, { success: true, message: 'Booking cancelled.' });
}

// ── Admin Users ────────────────────────────────────────────────────

async function handleListUsers(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(users.values());

  if (q.search) {
    const s = q.search.toLowerCase();
    items = items.filter(function(u) {
      return (u.email && u.email.toLowerCase().indexOf(s) !== -1) ||
             (u.username && u.username.toLowerCase().indexOf(s) !== -1);
    });
  }

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Admin Organizations ────────────────────────────────────────────

async function handleListOrganizations(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(organizations.values());

  if (q.is_active && q.is_active !== '') {
    items = items.filter(function(o) { return String(o.is_active) === q.is_active; });
  }

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleOrgAction(req, res, orgId, action) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const org = organizations.get(orgId);
  if (!org) return jsonResponse(res, 404, { success: false, error: 'Organization not found.' });

  if (action === 'deactivate') org.is_active = false;
  if (action === 'reactivate') org.is_active = true;
  organizations.set(orgId, org);

  return jsonResponse(res, 200, { success: true, data: org, message: 'Organization ' + (action === 'deactivate' ? 'deactivated' : 'reactivated') });
}

// ── Admin Managers ─────────────────────────────────────────────────

async function handleListManagers(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(managers.values());
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleCreateManager(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const body = await readBody(req);
  const id = genId();
  const tempPassword = 'tmp' + Math.floor(Math.random() * 9000 + 1000);
  const mgr = Object.assign({
    id: id,
    temp_password: tempPassword,
    is_active: true,
  }, body);
  managers.set(id, mgr);

  return jsonResponse(res, 201, { success: true, data: mgr, message: 'Manager created. Temporary password: ' + tempPassword });
}

async function handleManagerAction(req, res, mgrId, action) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const mgr = managers.get(mgrId);
  if (!mgr) return jsonResponse(res, 404, { success: false, error: 'Manager not found.' });

  if (action === 'deactivate') mgr.is_active = false;
  if (action === 'reactivate') mgr.is_active = true;
  managers.set(mgrId, mgr);

  return jsonResponse(res, 200, { success: true, data: mgr });
}

// ── Admin Turf ────────────────────────────────────────────────────

async function handleListTurfBookings(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(turfBookings.values());
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleListAllGrounds(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(turfGrounds.values());
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Admin Cinemas ─────────────────────────────────────────────────

async function handleListCinemas(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(cinemas.values());
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Admin Organizer Applications ───────────────────────────────────

async function handleListOrganizerApps(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(organizerApplications.values());
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleReviewApp(req, res, appId) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const body = await readBody(req);
  const app = organizerApplications.get(appId);
  if (!app) return jsonResponse(res, 404, { success: false, error: 'Application not found.' });

  if (body.action === 'approve') app.status = 'approved';
  else if (body.action === 'reject') app.status = 'rejected';
  else if (body.action === 'soft_reject') app.status = 'rejected';
  else app.status = body.action;

  organizerApplications.set(appId, app);
  return jsonResponse(res, 200, { success: true, data: app, message: 'Application ' + app.status });
}

// ── Admin Audit Logs ───────────────────────────────────────────────

async function handleListAuditLogs(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(auditLogs.values()).sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Admin Refunds ─────────────────────────────────────────────────

async function handleListRefunds(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(refunds.values());
  if (q.search) {
    const s = q.search.toLowerCase();
    items = items.filter(function(r) {
      return (r.id && r.id.indexOf(s) !== -1) || (r.payment_order_id && r.payment_order_id.toLowerCase().indexOf(s) !== -1);
    });
  }
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Admin Team ─────────────────────────────────────────────────────

async function handleListAdmins(req, res) {
  const admin = authenticateAdmin(req);
  if (!admin) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(adminAccounts.values()).map(function(a) {
    return {
      email: a.email,
      name: a.name,
      role: a.role,
      permissions: a.permissions,
      isActive: a.isActive,
    };
  });
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Customer: Events (public) ────────────────────────────────────────

async function handleListCustomerEvents(req, res) {
  const q = url.parse(req.url, true).query;
  let items = Array.from(events.values());

  if (q.status) {
    items = items.filter(function(e) { return e.status === q.status; });
  }
  if (q.category) {
    items = items.filter(function(e) { return e.category === q.category; });
  }
  if (q.city) {
    items = items.filter(function(e) { return (e.city || '').toLowerCase() === q.city.toLowerCase(); });
  }
  if (q.q) {
    const s = q.q.toLowerCase();
    items = items.filter(function(e) {
      return (e.title && e.title.toLowerCase().indexOf(s) !== -1) ||
             (e.venue && e.venue.toLowerCase().indexOf(s) !== -1) ||
             (e.description && e.description.toLowerCase().indexOf(s) !== -1);
    });
  }

  // featured param: only return featured events
  if (q.featured === 'true' || q.featured === '1') {
    items = items.filter(function(e) { return !!e.featured; });
  }

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleGetEvent(req, res, eventId) {
  const evt = events.get(eventId);
  if (!evt) return jsonResponse(res, 404, { success: false, error: 'Event not found.' });
  if (evt.status !== 'published') return jsonResponse(res, 404, { success: false, error: 'Event not found.' });
  return jsonResponse(res, 200, { success: true, data: evt });
}

async function handleGetFeaturedEvents(req, res) {
  const q = url.parse(req.url, true).query;
  const limit = parseInt(q.limit || '10', 10);
  const items = Array.from(events.values())
    .filter(function(e) { return e.status === 'published' && !!e.featured; })
    .slice(0, limit);
  return jsonResponse(res, 200, { success: true, data: items });
}

async function handleGetEventCategories(req, res) {
  const cats = Array.from(new Set(Array.from(events.values()).map(function(e) { return e.category; }).filter(Boolean)));
  return jsonResponse(res, 200, { success: true, data: cats });
}

async function handleGetEventCities(req, res) {
  const cities = Array.from(new Set(Array.from(events.values()).map(function(e) { return e.city; }).filter(Boolean)));
  return jsonResponse(res, 200, { success: true, data: cities });
}

async function handleGetEventStatsPublic(req, res, eventId) {
  const evt = events.get(eventId);
  if (!evt) return jsonResponse(res, 404, { success: false, error: 'Event not found.' });
  const evtBookings = Array.from(bookings.values()).filter(function(b) { return b.event_id === eventId; });
  return jsonResponse(res, 200, {
    success: true,
    data: {
      total_bookings: evtBookings.length,
      confirmed_bookings: evtBookings.filter(function(b) { return b.status === 'confirmed'; }).length,
      pending_bookings: evtBookings.filter(function(b) { return b.status === 'pending_payment'; }).length,
      cancelled_bookings: evtBookings.filter(function(b) { return b.status === 'cancelled'; }).length,
      revenue: evtBookings.filter(function(b) { return b.status === 'confirmed'; }).reduce(function(s, b) { return s + (b.amount || 0); }, 0),
      available_seats: parseInt(evt.capacity || 0) - evtBookings.filter(function(b) { return b.status === 'confirmed'; }).reduce(function(s, b) { return s + (b.tickets_count || 1); }, 0),
    }
  });
}

async function handleGetEventZones(req, res, eventId) {
  const evt = events.get(eventId);
  if (!evt) return jsonResponse(res, 404, { success: false, error: 'Event not found.' });
  const zones = evt.zones || [
    { id: 'zone-1', name: 'General Entry', price: parseInt(evt.price) || 0, capacity: parseInt(evt.capacity) || 100, description: 'Standard entry', currency: evt.currency || 'INR', is_sold_out: false },
  ];
  return jsonResponse(res, 200, { success: true, data: zones });
}

// ── Customer: Event Bookings (authenticated) ─────────────────────────

async function handleCreateBooking(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in to book.' });

  const body = await readBody(req);
  const bid = genId();
  const eventId = body.event_id;
  const evt = events.get(eventId);

  const booking = {
    id: bid,
    type: 'event',
    event_id: eventId,
    event_title: evt ? evt.title : 'Event',
    event_date: evt ? evt.event_date : '',
    event_venue: evt ? (evt.venue || '') : '',
    event_city: evt ? (evt.city || '') : '',
    user_id: user.id || user.email,
    user_email: user.email,
    user_username: user.username || user.name || '',
    tickets_count: body.tickets_count || body.quantity || 1,
    ticket_type: body.ticket_type || body.zone_id || 'general',
    zone_id: body.zone_id || 'zone-1',
    seat_numbers: body.seat_numbers || [],
    totalAmount: body.total_amount || body.amount || 0,
    amount: body.amount || body.total_amount || 0,
    currency: body.currency || (evt ? evt.currency : 'INR'),
    status: 'pending_payment',
    payment_status: 'pending',
    payment_method: body.payment_method || 'online',
    gateway_order_id: 'ORD-' + bid,
    contact_name: body.contact_name || (user.username || user.name || ''),
    contact_phone: body.contact_phone || '',
    notes: body.notes || '',
    created_at: new Date().toISOString(),
  };
  bookings.set(bid, booking);

  return jsonResponse(res, 201, {
    success: true,
    data: booking,
    message: 'Booking created. Proceed to payment.',
  });
}

async function handleCreateEventPaymentOrder(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });

  const q = url.parse(req.url, true).query;
  const eventId = q.event_id;
  const bookingId = q.booking_id;

  if (!bookingId) return jsonResponse(res, 400, { success: false, error: 'booking_id is required.' });

  const booking = bookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Booking not found.' });
  if (booking.user_id !== user.id && booking.user_email !== user.email) {
    return jsonResponse(res, 403, { success: false, error: 'Not your booking.' });
  }

  const orderId = 'ORD-' + bookingId + '-' + Date.now().toString(36);
  booking.gateway_order_id = orderId;
  booking.payment_status = 'pending';
  bookings.set(bookingId, booking);

  return jsonResponse(res, 200, {
    success: true,
    data: {
      order_id: orderId,
      amount: booking.amount,
      currency: booking.currency || 'INR',
      booking_id: bookingId,
      payment_url: '/payment/checkout?order_id=' + orderId,
    }
  });
}

async function handleGetMyBookings(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(bookings.values()).filter(function(b) {
    return b.user_id === user.id || b.user_email === user.email;
  });

  if (q.type) items = items.filter(function(b) { return b.type === q.type; });
  if (q.status) items = items.filter(function(b) { return b.status === q.status; });

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleGetBooking(req, res, bookingId) {
  const booking = bookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Booking not found.' });
  return jsonResponse(res, 200, { success: true, data: booking });
}

async function handleCancelBookingCustomer(req, res, bookingId) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });

  const booking = bookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Booking not found.' });
  if (booking.user_id !== user.id && booking.user_email !== user.email) {
    return jsonResponse(res, 403, { success: false, error: 'Not your booking.' });
  }
  if (booking.status === 'cancelled') {
    return jsonResponse(res, 400, { success: false, error: 'Booking already cancelled.' });
  }

  booking.status = 'cancelled';
  booking.payment_status = 'cancelled';
  bookings.set(bookingId, booking);

  return jsonResponse(res, 200, { success: true, message: 'Booking cancelled.' });
}

async function handleVerifyBookingPayment(req, res, bookingId) {
  const booking = bookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Booking not found.' });
  booking.payment_status = 'paid';
  booking.status = 'confirmed';
  bookings.set(bookingId, booking);
  return jsonResponse(res, 200, { success: true, data: booking, message: 'Payment verified.' });
}

async function handleBookingPdf(req, res, bookingId) {
  const booking = bookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Booking not found.' });
  const html = '<html><body style="font-family:Arial,sans-serif;padding:40px;"><h1>Booking Confirmation</h1>' +
    '<p><strong>Booking ID:</strong> ' + booking.id + '</p>' +
    '<p><strong>Event:</strong> ' + (booking.event_title || 'N/A') + '</p>' +
    '<p><strong>Date:</strong> ' + (booking.event_date || 'N/A') + '</p>' +
    '<p><strong>Tickets:</strong> ' + (booking.tickets_count || 1) + '</p>' +
    '<p><strong>Amount:</strong> ' + (booking.currency || 'INR') + ' ' + (booking.amount || 0) + '</p>' +
    '<p><strong>Status:</strong> ' + booking.status + '</p>' +
    '<p style="margin-top:40px;color:#888;">EMS — EntryMySlot</p></body></html>';
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

// ── Customer: Movies (public) ────────────────────────────────────────

async function handleListMovies(req, res) {
  const q = url.parse(req.url, true).query;
  let items = Array.from(movies.values()).filter(function(m) { return m.is_active; });

  if (q.q) {
    const s = q.q.toLowerCase();
    items = items.filter(function(m) {
      return (m.title && m.title.toLowerCase().indexOf(s) !== -1) ||
             (m.genre && m.genre.toLowerCase().indexOf(s) !== -1);
    });
  }
  if (q.genre) items = items.filter(function(m) { return m.genre === q.genre; });
  if (q.language) items = items.filter(function(m) { return m.language === q.language; });
  if (q.featured === 'true') items = items.filter(function(m) { return !!m.featured; });

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleGetMovieGenres(req, res) {
  const genres = Array.from(new Set(Array.from(movies.values()).map(function(m) { return m.genre; }).filter(Boolean)));
  return jsonResponse(res, 200, { success: true, data: genres });
}

async function handleGetMovieLanguages(req, res) {
  const langs = Array.from(new Set(Array.from(movies.values()).map(function(m) { return m.language; }).filter(Boolean)));
  return jsonResponse(res, 200, { success: true, data: langs });
}

async function handleSearchMovies(req, res) {
  return handleListMovies(req, res);
}

async function handleGetFeaturedMovies(req, res) {
  const q = url.parse(req.url, true).query;
  const limit = parseInt(q.limit || '10', 10);
  const items = Array.from(movies.values()).filter(function(m) { return m.is_active && !!m.featured; }).slice(0, limit);
  return jsonResponse(res, 200, { success: true, data: items });
}

// ── Customer: Cinemas (public) ───────────────────────────────────────

async function handleListCinemas(req, res) {
  const q = url.parse(req.url, true).query;
  let items = Array.from(cinemas.values()).filter(function(c) { return c.is_active; });
  if (q.city) items = items.filter(function(c) { return (c.city || '').toLowerCase() === q.city.toLowerCase(); });
  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleGetCinemasByCity(req, res) {
  const city = req.url.split('/').pop();
  const decodedCity = decodeURIComponent(city);
  let items = Array.from(cinemas.values()).filter(function(c) { return c.is_active && (c.city || '').toLowerCase() === decodedCity.toLowerCase(); });
  return jsonResponse(res, 200, { success: true, data: items });
}

// ── Customer: Showtimes (public) ─────────────────────────────────────

async function handleListShowtimes(req, res) {
  const q = url.parse(req.url, true).query;
  let items = [];
  // Generate mock showtimes from cinemas and movies
  var cids = Array.from(cinemas.keys());
  var mids = Array.from(movies.keys());
  for (var i = 0; i < 20; i++) {
    var cin = cinemas.get(cids[i % cids.length]);
    var mov = movies.get(mids[i % mids.length]);
    items.push({
      id: 'showtime-' + i,
      cinema_id: cin ? cin.id : cids[i % cids.length],
      cinema_name: cin ? cin.name : 'Cinema',
      cinema_city: cin ? (cin.city || '') : '',
      movie_id: mov ? mov.id : mids[i % mids.length],
      movie_title: mov ? mov.title : 'Movie',
      movie_genre: mov ? mov.genre : '',
      movie_language: mov ? mov.language : '',
      screen: 'Screen ' + ((i % 8) + 1),
      show_date: '2026-0' + (4 + (i % 6)) + '-' + String(10 + (i % 20)).padStart(2, '0'),
      show_time: String((9 + (i % 12)).toString().padStart(2, '0')) + ':' + (i % 4 === 0 ? '00' : '30'),
      end_time: String((10 + (i % 12)).toString().padStart(2, '0')) + ':' + (i % 4 === 0 ? '30' : '00'),
      price: (Math.floor(Math.random() * 15) + 5) * 100,
      available_seats: Math.floor(Math.random() * 100) + 10,
      total_seats: 120,
      format: ['2D', '3D', 'IMAX'][i % 3],
      language: mov ? mov.language : 'English',
    });
  }
  if (q.movie_id) items = items.filter(function(s) { return s.movie_id === q.movie_id; });
  if (q.cinema_id) items = items.filter(function(s) { return s.cinema_id === q.cinema_id; });
  if (q.city) items = items.filter(function(s) { return (s.cinema_city || '').toLowerCase() === q.city.toLowerCase(); });
  if (q.date) items = items.filter(function(s) { return s.show_date === q.date; });
  if (q.movie) items = items.filter(function(s) { return (s.movie_title || '').toLowerCase().indexOf(q.movie.toLowerCase()) !== -1; });

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleGetShowtimeCities(req, res) {
  const cities = Array.from(new Set(Array.from(cinemas.values()).map(function(c) { return c.city; }).filter(Boolean)));
  return jsonResponse(res, 200, { success: true, data: cities });
}

async function handleGetSeatLayout(req, res, showtimeId) {
  var rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var seats = [];
  var taken = [3, 7, 12, 15, 20, 25, 30, 33, 38, 42, 55, 60, 65, 70, 78, 82, 88, 91, 95, 100];
  var takenSet = new Set(taken);
  rows.forEach(function(row) {
    for (var i = 1; i <= 12; i++) {
      var num = seats.length + 1;
      seats.push({ id: row + '-' + i, row: row, number: i, type: (i <= 2 || i >= 11) ? 'premium' : 'standard', price: (i <= 2 || i >= 11) ? 350 : 250, status: takenSet.has(num) ? 'occupied' : 'available' });
    }
  });
  return jsonResponse(res, 200, { success: true, data: { showtime_id: showtimeId, rows: rows, total_seats: seats.length, available: seats.length - taken.length, seats: seats } });
}

async function handleCalculatePrices(req, res, showtimeId) {
  const body = await readBody(req);
  var seatIds = body.seat_ids || [];
  var price = 250;
  if (seatIds.length > 0 && seatIds[0].indexOf && (seatIds[0].indexOf('A-') === 0 || seatIds[0].indexOf('B-') === 0 || seatIds[0].indexOf('G-') === 0 || seatIds[0].indexOf('H-') === 0)) {
    price = 350;
  }
  const total = price * seatIds.length;
  return jsonResponse(res, 200, { success: true, data: { showtime_id: showtimeId, seat_ids: seatIds, unit_price: price, convenience_fee: Math.round(total * 0.02), gst: Math.round(total * 0.18), total: total + Math.round(total * 0.02) + Math.round(total * 0.18) } });
}

// ── Customer: Movie Bookings (authenticated) ─────────────────────────

async function handleCreateMovieBooking(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in to book.' });

  const body = await readBody(req);
  const bid = genId();
  const showtimeId = body.showtime_id;
  var showtime = null;
  for (var key in mockShowtimes) {
    if (mockShowtimes[key].id === showtimeId) { showtime = mockShowtimes[key]; break; }
  }

  const booking = {
    id: bid,
    reference: 'MOV-' + bid.toUpperCase(),
    type: 'movie',
    showtime_id: showtimeId,
    movie_title: showtime ? showtime.movie_title : 'Movie',
    cinema_name: showtime ? showtime.cinema_name : 'Cinema',
    screen: showtime ? showtime.screen : 'Screen 1',
    show_date: showtime ? showtime.show_date : '',
    show_time: showtime ? showtime.show_time : '',
    user_id: user.id || user.email,
    user_email: user.email,
    user_username: user.username || user.name || '',
    seat_ids: body.seat_ids || [],
    seats_count: (body.seat_ids || []).length,
    total_amount: body.total_amount || 0,
    status: 'pending_payment',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
  };
  bookings.set(bid, booking);
  return jsonResponse(res, 201, { success: true, data: booking });
}

async function handleConfirmMovieBooking(req, res) {
  const body = await readBody(req);
  const booking = bookings.get(body.booking_id);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Booking not found.' });
  booking.payment_status = 'paid';
  booking.status = 'confirmed';
  bookings.set(body.booking_id, booking);
  return jsonResponse(res, 200, { success: true, data: booking });
}

async function handleGetMyMovieBookings(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });
  const items = Array.from(bookings.values()).filter(function(b) { return b.type === 'movie' && (b.user_id === user.id || b.user_email === user.email); });
  const result = paginate(items, 1, 20);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Customer: Movie Seat Holds (authenticated) ───────────────────────

async function handleHoldSeats(req, res) {
  const body = await readBody(req);
  const holdKey = 'hold-' + Date.now().toString(36);
  mockHolds[holdKey] = {
    key: holdKey,
    showtime_id: body.showtime_id,
    seat_ids: body.seat_ids || [],
    expires_at: Date.now() + 5 * 60 * 1000,
  };
  return jsonResponse(res, 200, { success: true, data: { hold_key: holdKey, expires_in: 300 } });
}

async function handleReleaseSeats(req, res, holdKey) {
  delete mockHolds[holdKey];
  return jsonResponse(res, 200, { success: true, message: 'Seats released.' });
}

async function handleCheckHold(req, res, holdKey) {
  var hold = mockHolds[holdKey];
  if (!hold) return jsonResponse(res, 404, { success: false, error: 'Hold not found or expired.' });
  if (Date.now() > hold.expires_at) { delete mockHolds[holdKey]; return jsonResponse(res, 410, { success: false, error: 'Hold expired.' }); }
  return jsonResponse(res, 200, { success: true, data: hold });
}

// ── Customer: Turf (public + authenticated) ──────────────────────────

async function handleGetTurfGround(req, res, groundId) {
  const ground = turfGrounds.get(groundId);
  if (!ground) return jsonResponse(res, 404, { success: false, error: 'Turf ground not found.' });
  return jsonResponse(res, 200, { success: true, data: ground });
}

async function handleGetResourceAvailability(req, res, resourceId, date) {
  const slots = [];
  for (var h = 6; h < 22; h++) {
    slots.push({ hour: h, slot: h + ':00 - ' + (h + 1) + ':00', available: Math.random() > 0.3, price: (Math.floor(Math.random() * 5) + 3) * 1000 });
  }
  return jsonResponse(res, 200, { success: true, data: { resource_id: resourceId, date: date || '', slots: slots } });
}

async function handleCreateTurfBooking(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });

  const body = await readBody(req);
  const bid = genId();
  const groundId = body.ground_id;
  const ground = turfGrounds.get(groundId);
  const booking = {
    id: bid,
    type: 'turf',
    ground_id: groundId,
    ground_name: ground ? ground.name : 'Turf',
    user_id: user.id || user.email,
    user_email: user.email,
    user_name: user.username || user.name || '',
    date: body.date || '',
    slot: body.slot || '',
    slots: body.slots || [body.slot].filter(Boolean),
    duration_hours: body.duration_hours || 1,
    sport: body.sport || (ground ? ground.sport : 'Football'),
    players_count: body.players_count || 0,
    amount: body.amount || body.total_amount || 0,
    total_amount: body.amount || body.total_amount || 0,
    status: 'pending_payment',
    payment_status: 'pending',
    contact_name: body.contact_name || '',
    contact_phone: body.contact_phone || '',
    notes: body.notes || '',
    created_at: new Date().toISOString(),
  };
  turfBookings.set(bid, booking);
  return jsonResponse(res, 201, { success: true, data: booking });
}

async function handleGetMyTurfBookings(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });
  const items = Array.from(turfBookings.values()).filter(function(b) { return b.user_id === user.id || b.user_email === user.email; });
  const result = paginate(items, 1, 20);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

// ── Organizer Auth ────────────────────────────────────────────────────

async function handleOrganizerLogin(req, res) {
  const body = await readBody(req);
  const { email, password } = body;

  if (!email || !password) {
    return jsonResponse(res, 400, { success: false, error: 'Email and password are required.' });
  }

  // Check organizations for organizer credentials
  const org = Array.from(organizations.values()).find(function(o) {
    return o.email === email || o.contact_email === email;
  });

  let organizer;
  if (org) {
    // Verify password (simple comparison for mock)
    const expectedHash = hashPassword('org123', CUSTOMER_JWT_SECRET);
    const inputHash = hashPassword(password, CUSTOMER_JWT_SECRET);
    if (org._passwordHash !== inputHash && password !== 'org123') {
      return jsonResponse(res, 401, { success: false, error: 'Invalid email or password.' });
    }
    organizer = { id: org.id, email: org.email || org.contact_email, name: org.name, type: org.type || 'organization', organization_id: org.id };
  } else {
    // Check managers
    const mgr = Array.from(managers.values()).find(function(m) { return m.email === email; });
    if (!mgr) return jsonResponse(res, 401, { success: false, error: 'Invalid email or password.' });
    const inputHash = hashPassword(password, CUSTOMER_JWT_SECRET);
    if (mgr._passwordHash !== inputHash && password !== 'mgr123') {
      return jsonResponse(res, 401, { success: false, error: 'Invalid email or password.' });
    }
    organizer = { id: mgr.id, email: mgr.email, name: mgr.name, type: 'manager', organization_id: mgr.organization_id, manager_id: mgr.id };
  }

  const token = signJWT({ email: organizer.email, role: 'organizer', type: organizer.type, organization_id: organizer.organization_id }, CUSTOMER_JWT_SECRET, ADMIN_JWT_TTL_MS);
  mockOrganizerTokens[token] = { email: organizer.email, type: organizer.type, organization_id: organizer.organization_id, expiresAt: Date.now() + ADMIN_JWT_TTL_MS };

  return jsonResponse(res, 200, { success: true, data: { token: token, organizer: organizer } });
}

async function handleOrganizerRefresh(req, res) {
  const body = await readBody(req);
  const oldToken = body.token;
  const data = mockOrganizerTokens[oldToken];
  if (!data || data.expiresAt < Date.now()) return jsonResponse(res, 401, { success: false, error: 'Token expired.' });

  const newToken = signJWT({ email: data.email, role: 'organizer', type: data.type, organization_id: data.organization_id }, CUSTOMER_JWT_SECRET, ADMIN_JWT_TTL_MS);
  mockOrganizerTokens[newToken] = { email: data.email, type: data.type, organization_id: data.organization_id, expiresAt: Date.now() + ADMIN_JWT_TTL_MS };
  delete mockOrganizerTokens[oldToken];

  return jsonResponse(res, 200, { success: true, data: { token: newToken } });
}

async function handleOrganizerLogout(req, res) {
  const body = await readBody(req);
  if (body.token) delete mockOrganizerTokens[body.token];
  return jsonResponse(res, 200, { success: true, message: 'Logged out.' });
}

// ── Organizer/Owner Dashboard Data ───────────────────────────────────

async function handleOwnerDashboard(req, res) {
  const token = req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : '';
  const authData = mockOrganizerTokens[token];
  if (!authData) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  var orgEvents = Array.from(events.values()).filter(function(e) { return e.organization_id === authData.organization_id; });
  var orgBookings = Array.from(bookings.values()).filter(function(b) {
    var evt = events.get(b.event_id);
    return evt && evt.organization_id === authData.organization_id;
  });
  var orgManagers = Array.from(managers.values()).filter(function(m) { return m.organization_id === authData.organization_id; });

  return jsonResponse(res, 200, {
    success: true,
    data: {
      stats: {
        total_events: orgEvents.length,
        published_events: orgEvents.filter(function(e) { return e.status === 'published'; }).length,
        total_bookings: orgBookings.length,
        total_revenue: orgBookings.filter(function(b) { return b.status === 'confirmed'; }).reduce(function(s, b) { return s + (b.amount || 0); }, 0),
        total_managers: orgManagers.length,
      },
      recent_events: orgEvents.slice(0, 5),
      recent_bookings: orgBookings.slice(0, 10),
    }
  });
}

async function handleOwnerManagers(req, res) {
  const token = req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : '';
  const authData = mockOrganizerTokens[token];
  if (!authData) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const q = url.parse(req.url, true).query;
  let items = Array.from(managers.values()).filter(function(m) { return m.organization_id === authData.organization_id; });

  if (q.search) {
    const s = q.search.toLowerCase();
    items = items.filter(function(m) { return (m.name && m.name.toLowerCase().indexOf(s) !== -1) || (m.email && m.email.toLowerCase().indexOf(s) !== -1); });
  }

  const result = paginate(items, q.page, q.pageSize);
  return jsonResponse(res, 200, { success: true, data: result.data, pagination: result.pagination });
}

async function handleCreateOwnerManager(req, res) {
  const token = req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : '';
  const authData = mockOrganizerTokens[token];
  if (!authData) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  const body = await readBody(req);
  const id = genId();
  const tempPassword = 'mgr' + Math.floor(Math.random() * 9000 + 1000);
  const mgr = Object.assign({
    id: id,
    organization_id: authData.organization_id,
    temp_password: tempPassword,
    is_active: true,
    permissions: body.permissions || ['view_bookings', 'manage_events'],
  }, body);
  managers.set(id, mgr);
  return jsonResponse(res, 201, { success: true, data: mgr, message: 'Manager created. Temporary password: ' + tempPassword });
}

async function handleOrganizerMe(req, res) {
  const token = req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : '';
  const authData = mockOrganizerTokens[token];
  if (!authData) return jsonResponse(res, 401, { success: false, error: 'Not authenticated.' });

  if (authData.type === 'organization') {
    const org = Array.from(organizations.values()).find(function(o) { return o.id === authData.organization_id; });
    return jsonResponse(res, 200, { success: true, data: Object.assign({ id: org.id, email: org.email || org.contact_email, name: org.name, type: 'organization' }, org) });
  }
  const mgr = managers.get(authData.email) || Array.from(managers.values()).find(function(m) { return m.id === authData.organization_id; });
  return jsonResponse(res, 200, { success: true, data: Object.assign({ id: mgr ? mgr.id : authData.organization_id, email: authData.email, name: mgr ? mgr.name : authData.email, type: 'manager' }, mgr || {}) });
}

// ── Customer: Turf Bookings (authenticated) ──────────────────────────

async function handleGetMyTurfBooking(req, res, bookingId) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });
  const booking = turfBookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Turf booking not found.' });
  if (booking.user_id !== user.id && booking.user_email !== user.email) return jsonResponse(res, 403, { success: false, error: 'Not your booking.' });
  return jsonResponse(res, 200, { success: true, data: booking });
}

async function handleCancelTurfBooking(req, res, bookingId) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });
  const booking = turfBookings.get(bookingId);
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Turf booking not found.' });
  if (booking.user_id !== user.id && booking.user_email !== user.email) return jsonResponse(res, 403, { success: false, error: 'Not your booking.' });
  booking.status = 'cancelled';
  turfBookings.set(bookingId, booking);
  return jsonResponse(res, 200, { success: true, message: 'Turf booking cancelled.' });
}

// ── Payments (shared) ────────────────────────────────────────────────

async function handleManagerAction(req, res) {
  const q = url.parse(req.url, true).query;
  return jsonResponse(res, 200, { success: true, data: { id: q.id || 'mock', action: 'ok' } });
}

async function handleInitiatePayment(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });
  const body = await readBody(req);
  const orderId = 'PAY-' + Date.now().toString(36);
  return jsonResponse(res, 200, { success: true, data: { order_id: orderId, amount: body.amount, currency: body.currency || 'INR', gateway: 'mock', payment_url: '/mock-payment/' + orderId } });
}

async function handleVerifyPayment(req, res) {
  const body = await readBody(req);
  return jsonResponse(res, 200, { success: true, data: { order_id: body.order_id, status: 'success', transaction_id: 'TXN-' + Date.now().toString(36) } });
}

async function handleRefundPayment(req, res) {
  const user = authUser(req);
  if (!user) return jsonResponse(res, 401, { success: false, error: 'Please log in.' });
  const body = await readBody(req);
  return jsonResponse(res, 200, { success: true, data: { refund_id: 'REF-' + Date.now().toString(36), order_id: body.order_id, amount: body.amount, status: 'processed' } });
}

// ── Locations ────────────────────────────────────────────────────────

async function handleListDistricts(req, res) {
  const districts = ['Coimbatore', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune'];
  return jsonResponse(res, 200, { success: true, data: districts });
}

async function handleListCities(req, res) {
  const cities = ['Coimbatore', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune', 'Erode', 'Tirupur', 'Salem'];
  return jsonResponse(res, 200, { success: true, data: cities });
}

// ── Scan Verify ──────────────────────────────────────────────────────

async function handleScanVerify(req, res) {
  const q = url.parse(req.url, true).query;
  const code = q.code || q.ticket_code || '';
  const booking = Array.from(bookings.values()).find(function(b) {
    return (b.id === code) || (b.reference && b.reference === code);
  });
  if (!booking) return jsonResponse(res, 404, { success: false, error: 'Invalid ticket code.' });
  return jsonResponse(res, 200, { success: true, data: { valid: true, booking: booking, action: booking.status === 'confirmed' ? 'allow_entry' : 'deny' } });
}

// ── Router ─────────────────────────────────────────────────────────

const routes = {
  // Customer auth
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

  // Admin auth
  'POST:/api/v1/admin/login': handleAdminLogin,
  'GET:/api/v1/admin/me': handleAdminMe,

  // Admin dashboard
  'GET:/api/v1/admin/stats': handleAdminStats,

  // Admin events
  'GET:/api/v1/admin/events': handleListEvents,
  'POST:/api/v1/admin/events': handleCreateEvent,
  'GET:/api/v1/admin/events/*': handleAdminEvent,
  'PUT:/api/v1/admin/events/*': handleAdminEvent,
  'DELETE:/api/v1/admin/events/*': handleAdminEvent,
  'POST:/api/v1/admin/events/*/cancel': handleAdminEventAction,
  'POST:/api/v1/admin/events/*/publish': handleAdminEventAction,
  'POST:/api/v1/admin/events/*/hide': handleAdminEventAction,
  'POST:/api/v1/admin/events/*/restore': handleAdminEventAction,
  'POST:/api/v1/admin/events/*/featured': handleAdminEventAction,

  // Admin bookings
  'GET:/api/v1/admin/bookings': handleListBookings,
  'POST:/api/v1/admin/bookings/*/cancel': handleCancelBooking,

  // Admin users
  'GET:/api/v1/admin/users': handleListUsers,

  // Admin organizations
  'GET:/api/v1/admin/organizations': handleListOrganizations,
  'POST:/api/v1/admin/organizations/*/deactivate': handleOrgAction,
  'POST:/api/v1/admin/organizations/*/reactivate': handleOrgAction,

  // Admin managers
  'GET:/api/v1/admin/managers': handleListManagers,
  'POST:/api/v1/admin/managers': handleCreateManager,
  'POST:/api/v1/admin/managers/*/deactivate': handleManagerAction,
  'POST:/api/v1/admin/managers/*/reactivate': handleManagerAction,

  // Admin turf
  'GET:/api/v1/turf/grounds': handleListTurfsPublic,
  'GET:/api/v1/admin/turf/grounds': handleListAllGrounds,
  'GET:/api/v1/turf/bookings': handleListTurfBookings,
  'GET:/api/v1/admin/turf/bookings': handleListTurfBookings,

  // Admin cinemas
  'GET:/api/v1/admin/movies/cinemas': handleListCinemas,

  // Admin organizer apps
  'GET:/api/v1/admin/organizer-applications': handleListOrganizerApps,
  'POST:/api/v1/admin/organizer-applications/*/review': handleReviewApp,

  // Admin audit logs
  'GET:/api/v1/admin/audit-logs': handleListAuditLogs,

  // Admin refunds
  'GET:/api/v1/admin/refunds': handleListRefunds,

  // Admin team
  'GET:/api/v1/admin/admins': handleListAdmins,

  // Customer movies (public)
  'GET:/api/v1/movies': handleListMovies,
  'GET:/api/v1/movies/genres': handleGetMovieGenres,
  'GET:/api/v1/movies/languages': handleGetMovieLanguages,
  'GET:/api/v1/movies/search': handleSearchMovies,
  'GET:/api/v1/movies/featured': handleGetFeaturedMovies,
  'GET:/api/v1/movies/:slugOrId': handleListMovies,
  'POST:/api/v1/movies/bookings': handleCreateMovieBooking,
  'POST:/api/v1/movies/bookings/confirm': handleConfirmMovieBooking,
  'GET:/api/v1/movies/bookings/:reference': handleListMovies,
  'POST:/api/v1/movies/bookings/:reference/cancel': handleCancelBookingCustomer,
  'GET:/api/v1/movies/bookings/my': handleGetMyMovieBookings,
  'POST:/api/v1/movies/hold-seats': handleHoldSeats,
  'POST:/api/v1/movies/hold-seats/*/release': handleReleaseSeats,
  'GET:/api/v1/movies/hold-seats/*/status': handleCheckHold,

  // Customer event bookings (authenticated)
  'POST:/api/v1/bookings': handleCreateBooking,
  'GET:/api/v1/bookings/my': handleGetMyBookings,
  'GET:/api/v1/bookings/:id': handleGetBooking,
  'POST:/api/v1/bookings/:id/cancel': handleCancelBookingCustomer,
  'POST:/api/v1/bookings/:id/verify': handleVerifyBookingPayment,
  'GET:/api/v1/bookings/:id/pdf': handleBookingPdf,
  'POST:/api/v1/bookings/create-payment-order': handleCreateEventPaymentOrder,

  // Customer event public
  'GET:/api/v1/events': handleListCustomerEvents,
  'GET:/api/v1/events/featured': handleGetFeaturedEvents,
  'GET:/api/v1/events/categories': handleGetEventCategories,
  'GET:/api/v1/events/cities': handleGetEventCities,
  'GET:/api/v1/events/:id': handleGetEvent,
  'GET:/api/v1/events/:id/stats': handleGetEventStatsPublic,
  'GET:/api/v1/events/:id/zones': handleGetEventZones,

  // Customer turf
  'GET:/api/v1/turf/grounds': handleListTurfsPublic,
  'GET:/api/v1/turf/grounds/:id': handleGetTurfGround,
  'GET:/api/v1/turf/resources/:id/availability': handleGetResourceAvailability,
  'POST:/api/v1/turf/bookings': handleCreateTurfBooking,
  'GET:/api/v1/turf/my/bookings': handleGetMyTurfBookings,
  'GET:/api/v1/turf/my/bookings/:id': handleGetMyTurfBooking,
  'POST:/api/v1/turf/my/bookings/:id/cancel': handleCancelTurfBooking,
  'POST:/api/v1/turf/payments/create-order': handleCreateEventPaymentOrder,
  'POST:/api/v1/turf/payments/verify': handleVerifyBookingPayment,

  // Customer cinemas
  'GET:/api/v1/cinemas': handleListCinemas,
  'GET:/api/v1/cinemas/city/:city': handleGetCinemasByCity,
  'GET:/api/v1/cinemas/:id': handleListCinemas,
  'GET:/api/v1/cinemas/:id/screens': handleListCinemas,

  // Customer showtimes
  'GET:/api/v1/showtimes': handleListShowtimes,
  'GET:/api/v1/showtimes/cities': handleGetShowtimeCities,
  'GET:/api/v1/showtimes/:id': handleListShowtimes,
  'GET:/api/v1/showtimes/:id/seats': handleGetSeatLayout,
  'POST:/api/v1/showtimes/:id/calculate-prices': handleCalculatePrices,

  // Payments
  'POST:/api/v1/payments/initialize': handleInitiatePayment,
  'POST:/api/v1/payments/verify': handleVerifyPayment,
  'POST:/api/v1/payments/refund': handleRefundPayment,
  'GET:/api/v1/payments/status/:orderId': handleInitiatePayment,

  // Locations
  'GET:/api/v1/locations/districts': handleListDistricts,
  'GET:/api/v1/locations/cities': handleListCities,

  // Organizer auth
  'POST:/api/v1/organizer/auth/login': handleOrganizerLogin,
  'POST:/api/v1/organizer/auth/refresh': handleOrganizerRefresh,
  'POST:/api/v1/organizer/auth/logout': handleOrganizerLogout,
  'GET:/api/v1/organizer/auth/me': handleOrganizerMe,

  // Organizer/Owner dashboard
  'GET:/api/v1/organizer/dashboard': handleOwnerDashboard,
  'GET:/api/v1/organizer/events': handleListEvents,
  'GET:/api/v1/organizer/managers': handleOwnerManagers,
  'POST:/api/v1/organizer/managers': handleCreateOwnerManager,

  // Organizer/Owner dashboard (alias: owner/ → organizer/)
  'GET:/api/v1/owner/dashboard': handleOwnerDashboard,
  'GET:/api/v1/owner/settlements': handleOwnerDashboard,
  'GET:/api/v1/owner/movies/analytics': handleOwnerDashboard,
  'GET:/api/v1/owner/events/analytics': handleOwnerDashboard,
  'GET:/api/v1/owner/managers': handleOwnerManagers,
  'POST:/api/v1/owner/managers': handleCreateOwnerManager,
  'GET:/api/v1/owner/managers/:id': handleOwnerManagers,
  'POST:/api/v1/owner/managers/:id/disable': handleManagerAction,
  'POST:/api/v1/owner/managers/:id/enable': handleManagerAction,
  'POST:/api/v1/owner/managers/:id/reset-password': handleManagerAction,
  'DELETE:/api/v1/owner/managers/:id': handleManagerAction,
  'GET:/api/v1/owner/managers/analytics': handleOwnerDashboard,
  'GET:/api/v1/organizer/dashboard': handleOwnerDashboard,
  'GET:/api/v1/organizer/events': handleListCustomerEvents,
  'POST:/api/v1/organizer/events': handleCreateEvent,
  'PUT:/api/v1/organizer/events/:id': handleAdminEvent,
  'DELETE:/api/v1/organizer/events/:id': handleAdminEvent,
  'GET:/api/v1/organizer/me': handleOrganizerMe,
  'POST:/api/v1/organizer/auth/login': handleOrganizerLogin,
  'POST:/api/v1/organizer/auth/refresh': handleOrganizerRefresh,
  'POST:/api/v1/organizer/auth/logout': handleOrganizerLogout,
  'GET:/api/v1/organizer/auth/me': handleOrganizerMe,
  'GET:/api/v1/turf/organizer/venues': handleListTurfsPublic,
  'GET:/api/v1/turf/organizer/grounds': handleListTurfsPublic,
  'POST:/api/v1/turf/organizer/grounds': handleCreateEvent,
  'PUT:/api/v1/turf/organizer/grounds/:id': handleAdminEvent,
  'DELETE:/api/v1/turf/organizer/grounds/:id': handleAdminEvent,

  // Turf Manager
  'GET:/api/v1/turf/manager/organizations/:orgId/attendance': handleOwnerManagers,
  'GET:/api/v1/turf/manager/organizations/:orgId/daily-report': handleOwnerDashboard,
  'GET:/api/v1/turf/manager/organizations/:orgId/entry-logs': handleListAuditLogs,
  'POST:/api/v1/turf/manager/organizations/:orgId/validate-qr': handleScanVerify,
  'POST:/api/v1/turf/manager/organizations/:orgId/bookings/:id/cancel': handleCancelBookingCustomer,
  'POST:/api/v1/turf/manager/organizations/:orgId/offline-booking': handleCreateTurfBooking,

  // Scan verify
  'GET:/api/v1/scan/verify': handleScanVerify,
};

function matchRoute(method, pathname) {
  // Exact match first
  var key = method + ':' + pathname;
  if (routes[key]) return { handler: routes[key], params: {} };

  // Wildcard matching for /admin/events/:id/action
  var parts = pathname.split('/').filter(Boolean);
  var methodParts = (method + ':' + pathname).split('/');

  for (var rk in routes) {
    var routeParts = rk.split('/');
    if (routeParts[0] !== method) continue;

    var matched = true;
    var params = {};
    for (var i = 1; i < routeParts.length; i++) {
      if (routeParts[i] === '*') {
        params['wildcard'] = parts[i - 1] || '';
      } else if (routeParts[i].startsWith(':')) {
        var paramName = routeParts[i].slice(1);
        params[paramName] = parts[i - 1] || '';
      } else if (routeParts[i] !== (parts[i - 1] || '')) {
        matched = false;
        break;
      }
    }
    if (matched) return { handler: routes[rk], params: params };
  }

  return null;
}

const server = http.createServer(async function(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT, PATCH',
    });
    res.end();
    return;
  }

  cleanExpired();

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  var matched = matchRoute(method, pathname);

  if (!matched) {
    return jsonResponse(res, 404, { success: false, error: 'Not found: ' + method + ' ' + pathname });
  }

  try {
    // Handle wildcard routes that need param extraction
    if (pathname.match(/^\/api\/v1\/admin\/events\/\d+\/(cancel|publish|hide|restore|featured)$/)) {
      var m = pathname.match(/\/events\/(\d+)\/(\w+)$/);
      if (m) return await handleAdminEventAction(req, res, m[1], m[2]);
    }
    if (pathname.match(/^\/api\/v1\/admin\/events\/\d+$/)) {
      var m2 = pathname.match(/\/events\/(\d+)$/);
      if (m2) return await handleAdminEvent(req, res, m2[1]);
    }
    if (pathname.match(/^\/api\/v1\/admin\/bookings\/\d+\/cancel$/)) {
      var m3 = pathname.match(/\/bookings\/(\d+)\/cancel$/);
      if (m3) return await handleCancelBooking(req, res, m3[1]);
    }
    if (pathname.match(/^\/api\/v1\/admin\/organizations\/\d+\/(deactivate|reactivate)$/)) {
      var m4 = pathname.match(/\/organizations\/(\d+)\/(\w+)$/);
      if (m4) return await handleOrgAction(req, res, m4[1], m4[2]);
    }
    if (pathname.match(/^\/api\/v1\/admin\/managers\/\d+\/(deactivate|reactivate)$/)) {
      var m5 = pathname.match(/\/managers\/(\d+)\/(\w+)$/);
      if (m5) return await handleManagerAction(req, res, m5[1], m5[2]);
    }
    if (pathname.match(/^\/api\/v1\/admin\/organizer-applications\/\d+\/review$/)) {
      var m6 = pathname.match(/\/organizer-applications\/(\d+)\/review$/);
      if (m6) return await handleReviewApp(req, res, m6[1]);
    }

    await matched.handler(req, res);
  } catch (err) {
    console.error('[ERROR] ' + method + ' ' + pathname + ':', err);
    jsonResponse(res, 500, { success: false, error: 'Internal server error.' });
  }
});

server.listen(PORT, function() {
  console.log('\n  EMS Mock Backend running at http://98.130.20.52:' + PORT);
  console.log('  Customer auth:  http://98.130.20.52:' + PORT + '/api/v1/auth/*');
  console.log('  Admin auth:     http://98.130.20.52:' + PORT + '/api/v1/admin/*');
  console.log('  Admin login:    admin@entrymyslot.com / admin123');
  console.log('\n  Press Ctrl+C to stop.\n');
});
