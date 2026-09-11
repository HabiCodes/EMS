/**
 * EntryMySlot - Admin Auth Manager
 * Uses /api/v1/admin/* endpoints
 */

(function (global) {
  'use strict';

  var CFG = global.EMS_CONFIG;
  var _user = null;
  var _permissions = {};

  function getUser() {
    if (_user) return _user;
    try {
      var stored = localStorage.getItem(CFG.storage.adminUser);
      _user = stored ? JSON.parse(stored) : null;
    } catch (_) { _user = null; }
    return _user;
  }

  function setUser(user) {
    _user = user || null;
    _permissions = {};
    if (user) {
      localStorage.setItem(CFG.storage.adminUser, JSON.stringify(user));
      if (user.permissions) _permissions = user.permissions;
      if (user.admin && user.admin.permissions) _permissions = user.admin.permissions;
    } else {
      localStorage.removeItem(CFG.storage.adminUser);
    }
  }

  function getPermissions() { return _permissions; }

  function isLoggedIn() {
    return !!localStorage.getItem(CFG.storage.adminToken);
  }

  function clear() {
    _user = null;
    _permissions = {};
    global.EMSApi.logoutAdmin();
  }

  async function restoreSession() {
    if (!isLoggedIn()) return null;
    try {
      var result = await global.EMSApi.get('/admin/me', { authScope: 'admin' });
      if (result.ok && result.data) {
        var adminData = result.data;
        if (adminData.admin) adminData = adminData.admin;
        setUser(adminData);
        return getUser();
      }
      clear();
      return null;
    } catch (_) {
      clear();
      return null;
    }
  }

  async function login(email, password) {
    var result = await global.EMSApi.post('/admin/login', {
      email: email,
      password: password,
    }, { skipAuth: true });
    if (result.ok && result.data && result.data.success && result.data.data) {
      var d = result.data.data;
      if (d.token) localStorage.setItem(CFG.storage.adminToken, d.token);
      if (d.admin) {
        setUser(d.admin);
      }
    }
    return result;
  }

  async function logout() {
    clear();
  }

  function hasPermission(key) {
    if (_permissions.all) return true;
    return !!_permissions[key];
  }

  function hasAny(keys) {
    if (!keys || !keys.length) return true;
    return keys.some(function (k) { return hasPermission(k); });
  }

  function isSuperAdmin() {
    var admin = getUser();
    return admin && (admin.role === 'super_admin' || admin.permissions && admin.permissions.all);
  }

  global.EMSAdminAuth = Object.freeze({
    getUser: getUser,
    setUser: setUser,
    getPermissions: getPermissions,
    isLoggedIn: isLoggedIn,
    clear: clear,
    restoreSession: restoreSession,
    login: login,
    logout: logout,
    hasPermission: hasPermission,
    hasAny: hasAny,
    isSuperAdmin: isSuperAdmin,
  });

})(window);
