/**
 * Auth state management.
 * Tracks current admin, permissions, and login state.
 */
const AuthState = (function () {
  'use strict';

  let _admin = null;
  let _permissions = {};
  let _isLoggedIn = false;

  function init(adminData) {
    _admin = adminData || null;
    _permissions = (adminData && adminData.permissions) ? { ...adminData.permissions } : {};
    _isLoggedIn = !!adminData;
  }

  function set(adminData) {
    _admin = adminData || null;
    _permissions = (adminData && adminData.permissions) ? { ...adminData.permissions } : {};
    _isLoggedIn = !!adminData;
    EventBus.emit('auth:change', getState());
  }

  function logout() {
    _admin = null;
    _permissions = {};
    _isLoggedIn = false;
    EventBus.emit('auth:logout');
  }

  function getState() {
    return {
      admin: _admin ? { ..._admin } : null,
      permissions: { ..._permissions },
      isLoggedIn: _isLoggedIn,
    };
  }

  function hasPermission(key) {
    if (!_permissions) return false;
    return !!_permissions[key];
  }

  function hasAny(keys) {
    return keys.some(k => hasPermission(k));
  }

  function isLoggedIn() {
    return _isLoggedIn;
  }

  function isSuperAdmin() {
    return _admin && _admin.role === 'super_admin';
  }

  function getAdmin() {
    return _admin;
  }

  return Object.freeze({
    init,
    set,
    logout,
    getState,
    hasPermission,
    hasAny,
    isLoggedIn,
    isSuperAdmin,
    getAdmin,
  });
})();
