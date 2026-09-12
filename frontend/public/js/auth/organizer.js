/**
 * EntryMySlot - Organizer Auth Manager
 * Uses /api/v1/organizer/auth/* endpoints
 *
 * RESPONSE CONTRACT (from API client):
 *   result.ok      — boolean
 *   result.status  — HTTP status
 *   result.data    — UNWRAPPED payload (not { success, data })
 *   result.raw     — full raw response with { success, data, pagination? }
 */

(function (global) {
  'use strict';

  var CFG = global.EMS_CONFIG;
  var _user = null;

  function getUser() {
    if (_user) return _user;
    try {
      var stored = localStorage.getItem(CFG.storage.organizerUser);
      _user = stored ? JSON.parse(stored) : null;
    } catch (_) { _user = null; }
    return _user;
  }

  function setUser(user) {
    _user = user || null;
    if (user) localStorage.setItem(CFG.storage.organizerUser, JSON.stringify(user));
    else localStorage.removeItem(CFG.storage.organizerUser);
  }

  function isLoggedIn() {
    return !!localStorage.getItem(CFG.storage.organizerAccess);
  }

  function clear() {
    _user = null;
    global.EMSApi.logoutOrganizer();
  }

  async function restoreSession() {
    if (!isLoggedIn()) return null;
    try {
      // Organizer backend does not have a /me endpoint; restore from stored user
      var stored = getUser();
      if (stored) return stored;
      return null;
    } catch (_) {
      clear();
      return null;
    }
  }

  async function login(email, password) {
    var result = await global.EMSApi.post('/organizer/auth/login', {
      email: email,
      password: password,
    }, { authScope: 'organizer', skipAuth: true });
    // result.data is unwrapped: { user, accessToken, refreshToken }
    if (result.ok && result.data) {
      var d = result.data;
      if (d.accessToken) localStorage.setItem(CFG.storage.organizerAccess, d.accessToken);
      if (d.refreshToken) localStorage.setItem(CFG.storage.organizerRefresh, d.refreshToken);
      if (d.user) {
        _user = d.user;
        localStorage.setItem(CFG.storage.organizerUser, JSON.stringify(_user));
      }
    }
    return result;
  }

  async function refresh() {
    var rt = localStorage.getItem(CFG.storage.organizerRefresh);
    if (!rt) return { ok: false };
    return global.EMSApi.refreshOrganizerToken(rt);
  }

  async function logout() {
    try {
      var token = localStorage.getItem(CFG.storage.organizerAccess);
      if (token) await global.EMSApi.post('/organizer/auth/logout', { token: token }, { skipAuth: true });
    } catch (_) { /* best effort */ }
    clear();
  }

  function getOrganizationId() {
    var u = getUser();
    return u ? (u.organization_id || u.organizationId || null) : null;
  }

  function isOwner() {
    var u = getUser();
    return u && (u.type === 'organization' || u.role === 'owner');
  }

  function isManager() {
    var u = getUser();
    return u && u.type === 'manager';
  }

  global.EMSOrganizerAuth = Object.freeze({
    getUser: getUser,
    setUser: setUser,
    isLoggedIn: isLoggedIn,
    clear: clear,
    restoreSession: restoreSession,
    login: login,
    refresh: refresh,
    logout: logout,
    getOrganizationId: getOrganizationId,
    isOwner: isOwner,
    isManager: isManager,
  });

})(window);
