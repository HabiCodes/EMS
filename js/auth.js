/**
 * auth.js — Authentication service
 * Handles user registration, login, OTP, password reset, session management.
 *
 * Token storage: localStorage key "ems_token" (user JWT, 15 min)
 * Admin/Organizer JWTs are stored separately for their portals.
 */
window.EMS_AUTH = (function () {
  'use strict';

  var API = window.EMS_API;
  var CFG = window.EMS_API_CONFIG;

  // ── Current user state ─────────────────────────────────────────
  var _currentUser = null;
  var _listeners = [];

  function _notifyListeners(event, user) {
    _listeners.forEach(function (fn) { try { fn(event, user); } catch (e) {} });
  }

  function onChange(fn) {
    _listeners.push(fn);
    return function () {
      _listeners = _listeners.filter(function (f) { return f !== fn; });
    };
  }

  // ── Token helpers (scoped to user tokens) ──────────────────────
  function getUserToken() {
    return localStorage.getItem('ems_token');
  }

  function setUserToken(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('ems_token', accessToken);
    else localStorage.removeItem('ems_token');
    if (refreshToken) localStorage.setItem('ems_refresh_token', refreshToken);
  }

  function clearUserToken() {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_refresh_token');
    _currentUser = null;
  }

  function isLoggedIn() {
    return !!getUserToken();
  }

  // ── Restore session on page load ───────────────────────────────
  async function restoreSession() {
    var token = getUserToken();
    if (!token) return null;

    try {
      var result = await API.get('/auth/me');
      if (result.ok && result.data && result.data.success) {
        _currentUser = result.data.data;
        _notifyListeners('login', _currentUser);
        return _currentUser;
      } else {
        // Token expired or invalid
        clearUserToken();
        return null;
      }
    } catch (e) {
      clearUserToken();
      return null;
    }
  }

  // ── Registration ───────────────────────────────────────────────
  async function register(data) {
    // data: { name, email, phone, password, confirmPassword, acceptTerms }
    var result = await API.post('/auth/register', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });
    // Registration typically returns the token directly (auto-login) or requires OTP verification.
    if (result.ok && result.data && result.data.success) {
      var tokenData = result.data.data || {};
      var token = tokenData.accessToken || tokenData.token;
      var refreshToken = tokenData.refreshToken || tokenData.refresh_token;
      if (token) setUserToken(token, refreshToken);
      _currentUser = tokenData.user || null;
      _notifyListeners('login', _currentUser);
    }
    return result;
  }

  // ── OTP Verification ───────────────────────────────────────────
  async function verifyOtp(email, otp) {
    var result = await API.post('/auth/verify-otp', {
      email: email,
      otp: otp,
    });
    if (result.ok && result.data && result.data.success) {
      var tokenData = result.data.data || {};
      var token = tokenData.accessToken || tokenData.token;
      var refreshToken = tokenData.refreshToken || tokenData.refresh_token;
      if (token) setUserToken(token, refreshToken);
      _currentUser = tokenData.user || null;
      _notifyListeners('login', _currentUser);
    }
    return result;
  }

  async function resendOtp(email) {
    return API.post('/auth/resend-otp', { email: email });
  }

  // ── Login ──────────────────────────────────────────────────────
  // Backend POST /auth/login { email, password }
  // Response: { success, data: { tokens: { accessToken, refreshToken, expiresIn }, user, sessionId } }
  // Note: tokens are nested under .tokens, NOT top-level.
  async function login(email, password) {
    var result = await API.post('/auth/login', {
      email: email,
      password: password,
    });
    if (result.ok && result.data && result.data.success) {
      var tokenData = result.data.data || {};
      // Backend returns { tokens: { accessToken, refreshToken, expiresIn }, user, sessionId }
      var tokens = tokenData.tokens || {};
      var token = tokens.accessToken || tokenData.accessToken || tokenData.token;
      var refreshToken = tokens.refreshToken || tokenData.refreshToken || tokenData.refresh_token;
      if (token) setUserToken(token, refreshToken);
      _currentUser = tokenData.user || null;
      _notifyListeners('login', _currentUser);
    }
    return result;
  }

  // ── Forgot / Reset Password ────────────────────────────────────
  async function forgotPassword(email) {
    return API.post('/auth/forgot-password', { email: email });
  }

  async function resetPassword(token, newPassword) {
    return API.post('/auth/reset-password', {
      token: token,
      password: newPassword,
    });
  }

  // ── Profile ────────────────────────────────────────────────────
  async function getProfile() {
    var result = await API.get('/auth/me');
    if (result.ok && result.data && result.data.success) {
      _currentUser = result.data.data;
      _notifyListeners('profile-update', _currentUser);
    }
    return result;
  }

  async function updateProfile(data) {
    // data: { name, phone, ... }
    var result = await API.put('/auth/me', data);
    if (result.ok && result.data && result.data.success) {
      _currentUser = result.data.data;
      _notifyListeners('profile-update', _currentUser);
    }
    return result;
  }

  // ── Logout ─────────────────────────────────────────────────────
  async function logout() {
    try {
      await API.post('/auth/logout');
    } catch (e) { /* best effort */ }
    clearUserToken();
    _notifyListeners('logout', null);
  }

  // ── Admin Auth (separate from user) ────────────────────────────
  var _adminToken = null;

  function getAdminToken() {
    return localStorage.getItem('ems_admin_token');
  }

  function setAdminToken(token) {
    if (token) localStorage.setItem('ems_admin_token', token);
    else localStorage.removeItem('ems_admin_token');
  }

  /**
   * Admin login — backend POST /admin/login { email, password }
   * Response: { success, data: { token: string, admin: { id, email, name, role, permissions } } }
   * Note: admin token is SINGULAR "token" field, NOT "accessToken".
   * Note: admin has NO refresh token. JWT lasts 12h.
   */
  async function adminLogin(email, password) {
    var result = await API.post('/admin/login', {
      email: email,
      password: password,
    }, { skipAuth: true });
    if (result.ok && result.data && result.data.success) {
      var tokenData = result.data.data || {};
      // Backend returns "token" (singular string), not "accessToken"
      var token = tokenData.token;
      if (token) setAdminToken(token);
    }
    return result;
  }

  function adminLogout() {
    localStorage.removeItem('ems_admin_token');
  }

  // ── Organizer Auth ─────────────────────────────────────────────
  var _organizerToken = null;

  function getOrganizerToken() {
    return localStorage.getItem('ems_organizer_token');
  }

  function setOrganizerToken(token) {
    if (token) localStorage.setItem('ems_organizer_token', token);
    else localStorage.removeItem('ems_organizer_token');
  }

  async function organizerLogin(email, password) {
    var result = await API.post('/organizer/auth/login', {
      email: email,
      password: password,
    }, { skipAuth: true });
    if (result.ok && result.data && result.data.success) {
      var tokenData = result.data.data || {};
      var token = tokenData.accessToken || tokenData.token;
      var refreshToken = tokenData.refreshToken || tokenData.refresh_token;
      if (token) setOrganizerToken(token);
      if (refreshToken) localStorage.setItem('ems_organizer_refresh', refreshToken);
    }
    return result;
  }

  function organizerLogout() {
    localStorage.removeItem('ems_organizer_token');
    localStorage.removeItem('ems_organizer_refresh');
  }

  // ── Auth-expired handler ───────────────────────────────────────
  function initAuthListener() {
    window.addEventListener('ems:auth-expired', function () {
      _currentUser = null;
      EMS_UI.toast('Your session has expired. Please log in again.', 'warning');
      setTimeout(function () {
        var loginPage = findLoginPage();
        if (loginPage) window.location.href = loginPage;
        else location.reload();
      }, 1500);
    });
  }

  function findLoginPage() {
    var path = window.location.pathname;
    if (path.includes('dash') || path.includes('admin') || path.includes('super')) return 'auth.html?role=admin';
    if (path.includes('owner') || path.includes('organizer')) return 'auth.html?role=organizer';
    return 'auth.html';
  }

  // Initialize on load
  initAuthListener();

  return {
    // User
    getUserToken: getUserToken,
    setUserToken: setUserToken,
    isLoggedIn: isLoggedIn,
    getUser: function () { return _currentUser; },
    restoreSession: restoreSession,
    onChange: onChange,
    register: register,
    verifyOtp: verifyOtp,
    resendOtp: resendOtp,
    login: login,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    getProfile: getProfile,
    updateProfile: updateProfile,
    logout: logout,

    // Admin
    getAdminToken: getAdminToken,
    setAdminToken: setAdminToken,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    isAdminLoggedIn: function () { return !!getAdminToken(); },

    // Organizer
    getOrganizerToken: getOrganizerToken,
    setOrganizerToken: setOrganizerToken,
    organizerLogin: organizerLogin,
    organizerLogout: organizerLogout,
    isOrganizerLoggedIn: function () { return !!getOrganizerToken(); },
  };
})();
