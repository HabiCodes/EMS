/**
 * EMS Auth — customer-facing authentication wrapper
 *
 * Backend auth flow:
 *   1. Registration: POST /auth/register-enhanced → sends OTP to email
 *   2. Verify OTP: POST /auth/verify-registration-otp → creates account, returns tokens
 *   3. Login: POST /auth/login → returns tokens + user
 *   4. Session restore: GET /auth/me (Bearer access token) or POST /auth/refresh-token
 *   5. Logout: POST /auth/logout (revokes refresh token)
 *
 * Storage keys used:
 *   ems_access_token  — JWT access token (15min, Bearer auth)
 *   ems_refresh_token — refresh token (30d, for rotating access tokens)
 *   ems_auth_user     — cached user object (mirrors GET /auth/me response)
 *
 * All endpoints POST/GET /api/v1/auth/...
 * Authorization header: Bearer <accessToken>
 */

const EMS_AUTH = (() => {
  // Build full API base from config: BASE_URL + /api/v1
  // Falls back to relative path /api/v1 if config not loaded
  var _cfg = {};
  try { _cfg = window.EMS_API_CONFIG || {}; } catch (e) { /* noop */ }
  var _base = (_cfg.BASE_URL || '').replace(/\/+$/, '');
  var API_BASE = _base ? (_base + '/api/v1') : '/api/v1';
  const STORAGE_KEYS = {
    ACCESS_TOKEN: 'ems_access_token',
    REFRESH_TOKEN: 'ems_refresh_token',
    USER: 'ems_auth_user',
  };

  // ---- helpers ----
  function getAccessToken() {
    try { return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN); } catch { return null; }
  }
  function getRefreshToken() {
    try { return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN); } catch { return null; }
  }
  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'); } catch { return null; }
  }
  function setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
  function setUser(user) {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.USER);
  }
  function clearAll() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
  function isLoggedIn() {
    return !!getAccessToken();
  }
  function getUser() {
    return getStoredUser();
  }
  function headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = getAccessToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  async function request(path, opts = {}) {
    const url = API_BASE + path;
    const method = (opts.method || 'GET').toUpperCase();
    const init = {
      ...opts,
      method: method,
      headers: { ...headers(), ...(opts.headers || {}) },
    };
    // Strip body for GET/HEAD — some servers reject it
    if (method === 'GET' || method === 'HEAD') {
      delete init.body;
    }
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || 'application/json';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }
    return { ok: res.ok, status: res.status, data };
  }

  // ---- user mapping ----

  /** Map backend user shape { username, email, ... } → UI shape { name, ... } for compatibility */
  function mapUserForUI(raw) {
    if (!raw) return raw;
    return Object.assign({}, raw, { name: raw.username || raw.name || raw.email });
  }

  // ---- session ----
  async function restoreSession() {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const r = await request('/auth/me');
      if (r.ok && r.data && r.data.success && r.data.data) {
        const uiUser = mapUserForUI(r.data.data);
        setUser(uiUser);
        return uiUser;
      }
      // Token invalid — try refresh
      return await tryRefresh();
    } catch (e) {
      console.error('Session restore failed:', e);
      return null;
    }
  }

  async function tryRefresh() {
    const rt = getRefreshToken();
    if (!rt) { clearAll(); return null; }
    try {
      const r = await request('/auth/refresh-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (r.ok && r.data && r.data.success && r.data.data) {
        const { accessToken, refreshToken: newRt } = r.data.data;
        setTokens(accessToken, newRt || rt);
        const me = await request('/auth/me');
        if (me.ok && me.data && me.data.success && me.data.data) {
          const uiUser = mapUserForUI(me.data.data);
          setUser(uiUser);
          return uiUser;
        }
      }
      clearAll();
      return null;
    } catch (e) {
      clearAll();
      return null;
    }
  }

  // ---- registration (OTP flow) ----

  /**
   * Step 1: Request OTP registration — sends a 6-digit verification code to email.
   * POST /auth/register-enhanced
   *   Body: { email, username?, password }
   *   Response: 202 { success: true, message, expiresInMinutes }
   *   No account is created yet — OTP must be verified.
   */
  async function register({ email, username, password }) {
    const r = await request('/auth/register-enhanced', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    return r;
  }

  /**
   * Step 2: Verify registration OTP — creates account and logs user in.
   * POST /auth/verify-registration-otp
   *   Body: { email, otp }
   *   Response: 201 { success: true, message, data: { tokens: { accessToken, refreshToken }, user, isNewUser } }
   */
  async function verifyRegistrationOtp(email, otp) {
    const r = await request('/auth/verify-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (r.ok && r.data && r.data.success && r.data.data) {
      const { tokens, user } = r.data.data;
      const uiUser = mapUserForUI(user);
      setTokens(tokens.accessToken, tokens.refreshToken);
      setUser(uiUser);
    }
    return r;
  }

  /**
   * Resend registration OTP — invalidates old code, sends new one.
   * POST /auth/resend-registration-otp
   *   Body: { email }
   *   Response: 200 { success: true, message }
   */
  async function resendRegistrationOtp(email) {
    return request('/auth/resend-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // ---- login ----

  /**
   * POST /auth/login
   *   Body: { email, password }
   *   Response: 200 { success: true, data: { user: UserPublic, tokens: { accessToken, refreshToken } } }
   */
  async function login(email, password) {
    const r = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (r.ok && r.data && r.data.success && r.data.data) {
      const { user, tokens } = r.data.data;
      const uiUser = mapUserForUI(user);
      setTokens(tokens.accessToken, tokens.refreshToken);
      setUser(uiUser);
    }
    return r;
  }

  // ---- password reset ----

  /**
   * POST /auth/forgot-password
   *   Body: { email }
   *   Response: 200 { success: true, message }
   *   Always returns success (prevents email enumeration).
   */
  async function forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * POST /auth/reset-password
   *   Body: { token, newPassword }
   *   Response: 200 { success: true, message }
   */
  async function resetPassword(token, newPassword) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ---- logout ----

  /**
   * POST /auth/logout
   *   Body: { refreshToken }
   *   Response: 200 { success: true, message }
   */
  async function logout() {
    const rt = getRefreshToken();
    try {
      if (rt) {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: rt }),
        });
      }
    } finally {
      clearAll();
    }
  }

  // ---- profile ----

  /**
   * GET /auth/me
   *   Response: 200 { success: true, data: { id, email, username, isVerified, isActive, ... } }
   */
  async function getProfile() {
    return request('/auth/me');
  }

  // ---- organizer auth (for manager-dash & owner-dash) ----

  const ORGANIZER_STORAGE_KEYS = {
    TOKEN: 'ems_organizer_token',
    USER: 'ems_organizer_user',
  };

  function getOrganizerToken() {
    try { return localStorage.getItem(ORGANIZER_STORAGE_KEYS.TOKEN); } catch { return null; }
  }
  function getStoredOrganizerUser() {
    try { return JSON.parse(localStorage.getItem(ORGANIZER_STORAGE_KEYS.USER) || 'null'); } catch { return null; }
  }
  function setOrganizerToken(token) {
    if (token) localStorage.setItem(ORGANIZER_STORAGE_KEYS.TOKEN, token);
    else localStorage.removeItem(ORGANIZER_STORAGE_KEYS.TOKEN);
  }
  function setOrganizerUser(user) {
    if (user) localStorage.setItem(ORGANIZER_STORAGE_KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(ORGANIZER_STORAGE_KEYS.USER);
  }
  function clearOrganizerAuth() {
    Object.values(ORGANIZER_STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
  function organizerHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const t = getOrganizerToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  /**
   * POST /organizer/auth/login
   *   Body: { email, password }
   *   Response: 200 { success: true, data: { token, organizer: {...} } }
   */
  async function organizerLogin(email, password) {
    const url = API_BASE + '/organizer/auth/login';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const contentType = res.headers.get('content-type') || 'application/json';
    const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };
    const result = { ok: res.ok, status: res.status, data };

    if (res.ok && data && data.success && data.data) {
      setOrganizerToken(data.data.token);
      setOrganizerUser(data.data.organizer || data.data.user || null);
    }
    return result;
  }

  /**
   * POST /organizer/auth/refresh
   *   Body: { token }
   *   Response: 200 { success: true, data: { token } }
   */
  async function organizerRefresh() {
    const token = getOrganizerToken();
    if (!token) return null;
    try {
      const r = await request('/organizer/auth/refresh', {
        method: 'POST',
        headers: organizerHeaders(),
        body: JSON.stringify({ token }),
      });
      if (r.ok && r.data && r.data.success && r.data.data) {
        setOrganizerToken(r.data.data.token);
        return r.data.data.token;
      }
    } catch (e) { /* ignore */ }
    clearOrganizerAuth();
    return null;
  }

  function isOrganizerLoggedIn() {
    return !!getOrganizerToken();
  }

  function getOrganizerUser() {
    return getStoredOrganizerUser();
  }

  async function organizerLogout() {
    try {
      const token = getOrganizerToken();
      if (token) {
        await fetch(API_BASE + '/organizer/auth/logout', {
          method: 'POST',
          headers: { ...organizerHeaders() },
          body: JSON.stringify({ token }),
        });
      }
    } catch (e) { /* ignore */ }
    clearOrganizerAuth();
  }

  // ---- expose ----
  return {
    API_BASE,
    restoreSession,
    register,
    verifyRegistrationOtp,
    resendRegistrationOtp,
    login,
    forgotPassword,
    resetPassword,
    logout,
    getProfile,
    isLoggedIn,
    getUser,
    setUser,
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearAll,

    // Organizer auth
    organizerLogin,
    organizerLogout,
    organizerRefresh,
    isOrganizerLoggedIn,
    getOrganizerUser,
    setOrganizerUser,
    setOrganizerToken,
    clearOrganizerAuth,
    organizerHeaders,
  };
})();
