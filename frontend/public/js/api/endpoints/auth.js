/**
 * Admin auth API endpoints.
 *
 * Uses the centralized AdminAPI client.
 * Storage key: ems_admin_token (managed by AdminAPI client).
 *
 * Endpoints:
 *   POST /admin/auth/login           — super admin login
 *   POST /admin/auth/logout          — super admin logout
 *   GET  /admin/auth/me              — current admin profile
 *   POST /admin/auth/refresh         — refresh token (NOTE: guide says no refresh-token route exists; this is a no-op that throws)
 */

const AdminAuthAPI = (function () {
  'use strict';

  /**
   * POST /admin/auth/login
   * Body: { email, password }
   * Response: { success, data: { admin, token, permissions } }
   */
  async function login(email, password) {
    return AdminAPI.post('/admin/auth/login', { email, password });
  }

  /**
   * POST /admin/auth/logout
   * Body: {} (or empty)
   * Response: { success, message }
   */
  async function logout() {
    return AdminAPI.post('/admin/auth/logout', {});
  }

  /**
   * GET /admin/auth/me
   * Response: { success, data: { id, name, email, role, permissions, ... } }
   */
  async function me() {
    return AdminAPI.get('/admin/auth/me');
  }

  /**
   * Refresh token endpoint.
   * NOTE: Per the integration guide, no refresh-token route exists for super_admin.
   * 401 must cause logout, not retry. This function is included for completeness
   * but will throw if called.
   */
  async function refresh() {
    throw new Error('No refresh-token endpoint exists for super_admin. 401 triggers logout.');
  }

  return Object.freeze({
    login,
    logout,
    me,
    refresh,
  });
})();
