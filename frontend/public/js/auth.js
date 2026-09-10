/**
 * EMS Auth — customer-facing authentication wrapper
 *
 * Source of truth: /Users/habishek/Downloads/booking/backend/src/
 * Auth controller:  controllers/authController.ts
 * Auth routes:      routes/authRoutes.ts
 *
 * Storage keys used:
 *   ems_access_token  — JWT access token (short-lived)
 *   ems_refresh_token — refresh token (long-lived)
 *   ems_auth_user     — cached user object (mirrors GET /api/v1/auth/me response)
 *
 * All endpoints POST/GET /api/v1/auth/...
 * Authorization header: Bearer <accessToken>
 */

const EMS_AUTH = (() => {
  const config = window.EMS_API_CONFIG || {};
  const origin = (config.BASE_URL || 'https://api.entrymyslot.com').replace(/\/+$/, '');
  const apiPath = (config.API_BASE || '/api/v1').replace(/\/+$/, '');
  const API_BASE = origin + apiPath;
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
    const res = await fetch(url, {
      ...opts,
      headers: { ...headers(), ...(opts.headers || {}) },
    });
    const contentType = res.headers.get('content-type') || 'application/json';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      // Never render a hosting-provider HTML error page inside the auth alert.
      await res.text();
      data = { message: 'Authentication service returned an unexpected response.' };
    }
    return { ok: res.ok, status: res.status, data };
  }

  // ---- session ----
  async function restoreSession() {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const r = await request('/auth/me');
      if (r.ok && r.data && r.data.success && r.data.data) {
        setUser(r.data.data);
        return r.data.data;
      }
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
          setUser(me.data.data);
          return me.data.data;
        }
      }
      clearAll();
      return null;
    } catch (e) {
      clearAll();
      return null;
    }
  }

  // ---- registration ----
  function storeAuthResult(data) {
    if (!data) return;
    const { user, tokens } = data;
    if (!user || !tokens) return;
    setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(user);
  }

  async function register({ email, username, password }) {
    return request('/auth/register-enhanced', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }

  async function login(email, password) {
    const r = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (r.ok && r.data && r.data.success && r.data.data) {
      storeAuthResult(r.data.data);
    }
    return r;
  }

  async function verifyRegistrationOtp(email, otp) {
    const r = await request('/auth/verify-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (r.ok && r.data && r.data.success && r.data.data) {
      storeAuthResult(r.data.data);
    }
    return r;
  }

  function resendRegistrationOtp(email) {
    return request('/auth/resend-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  function forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

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

  async function getProfile() {
    return request('/auth/me');
  }

  return {
    API_BASE,
    restoreSession,
    register,
    login,
    verifyRegistrationOtp,
    resendRegistrationOtp,
    forgotPassword,
    logout,
    getProfile,
    isLoggedIn,
    getUser,
    setUser,
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearAll,
  };
})();
