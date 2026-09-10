// frontend/public/js/api/endpoints/audit-logs.js
const AuditLogsAPI = {
  async fetchLogs(params = {}) {
    try {
      const response = await fetch('/api/v1/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return { success: false, data: [] };
    }
  }
};

window.AuditLogsAPI = AuditLogsAPI;