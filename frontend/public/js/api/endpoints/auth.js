/**
 * Admin auth API endpoints.
 *
 * Uses the centralized AdminAPI client.
 * Storage key: ems_admin_token (managed by AdminAPI client).
 *
 * Endpoints:
 *   POST /admin/login                — super admin login
 *   GET  /admin/me                   — current admin profile
 *   POST /admin/logout               — super admin logout
 */

const AdminAuthAPI = (function () {
  'use strict';

  /**
   * POST /admin/login
   * Body: { email, password }
   * Response: { success, data: { admin, token, permissions } }
   */
  async function login(email, password) {
    return AdminAPI.post('/admin/login', { email, password });
  }

  /**
   * POST /admin/logout
   * Body: {} (or empty)
   * Response: { success, message }
   */
  async function logout() {
    return AdminAPI.post('/admin/logout', {});
  }

  /**
   * GET /admin/me
   * Response: { success, data: { id, name, email, role, permissions, ... } }
   */
  async function me() {
    return AdminAPI.get('/admin/me');
  }

  return Object.freeze({
    login,
    logout,
    me,
  });
})();
