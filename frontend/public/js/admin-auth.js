/**
 * Admin Auth — login, logout, session management.
 *
 * Bridges the API layer with UI state.
 * Uses a separate localStorage key from customer auth to avoid collisions.
 */

const AdminAuth = (function () {
  'use strict';

  let _initialized = false;

  function init() {
    if (_initialized) return;
    _initialized = true;

    // Register 401 handler with the HTTP client
    AdminAPI.onUnauthorized(handleUnauthorized);

    // Listen for logout events from AuthState
    EventBus.on('auth:logout', handleLogout);

    // Restore session on load
    restoreSession();
  }

  async function restoreSession() {
    try {
      const response = await AdminAuthAPI.me();
      const data = extractData(response);
      if (data) {
        AuthState.init(data);
        EventBus.emit('auth:login', AuthState.getState());
      }
    } catch (_) {
      // No valid session — show login
    }
  }

  async function login(email, password) {
    const response = await AdminAuthAPI.login(email, password);
    const data = extractData(response);
    if (data) {
      // Token is already set by AdminAPI client from the response
      // But let's make sure
      if (data.token) {
        AdminAPI.setToken(data.token);
      }
      AuthState.set(data.admin || data);
      EventBus.emit('auth:login', AuthState.getState());
      return { success: true, data };
    }
    return response;
  }

  async function logout() {
    try {
      await AdminAuthAPI.logout();
    } catch (_) {
      // Ignore logout errors
    } finally {
      AdminAPI.clearToken();
      AuthState.logout();
      EventBus.emit('auth:logout');
    }
  }

  function handleUnauthorized() {
    AdminAPI.clearToken();
    AuthState.logout();
    navigateToLogin();
  }

  function handleLogout() {
    navigateToLogin();
  }

  function navigateToLogin() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
      renderLogin(app);
    }
  }

  function isAuthenticated() {
    return AuthState.isLoggedIn();
  }

  function getState() {
    return AuthState.getState();
  }

  function hasPermission(key) {
    return AuthState.hasPermission(key);
  }

  function hasAny(keys) {
    return AuthState.hasAny(keys);
  }

  function extractData(response) {
    if (!response) return null;
    if (response.data) return response.data;
    if (response.success && response.data) return response.data;
    return response;
  }

  return Object.freeze({
    init,
    login,
    logout,
    restoreSession,
    isAuthenticated,
    getState,
    hasPermission,
    hasAny,
  });
})();
