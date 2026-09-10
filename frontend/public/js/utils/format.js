/**
 * Format and escape utilities.
 */

const FormatUtil = (function () {
  'use strict';

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escHtml(str) {
    if (str == null) return '';
    const s = String(str);
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return s.replace(/[&<>"']/g, c => map[c]);
  }

  /**
   * Format an ISO datetime string for display.
   * @param {string} iso
   * @returns {string}
   */
  function formatDateTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi;
    } catch (_) {
      return '—';
    }
  }

  /**
   * Format an ISO date string for display.
   * @param {string} iso
   * @returns {string}
   */
  function formatDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return dd + '/' + mm + '/' + yyyy;
    } catch (_) {
      return '—';
    }
  }

  /**
   * Format an ISO time string (HH:MM:SS) for display.
   * @param {string} time
   * @returns {string}
   */
  function formatTime(time) {
    if (!time) return '—';
    return time.substring(0, 5);
  }

  /**
   * Truncate a string to a given length with ellipsis.
   * @param {string} str
   * @param {number} maxLen
   * @returns {string}
   */
  function truncate(str, maxLen) {
    if (!str) return '';
    const s = String(str);
    return s.length > maxLen ? s.substring(0, maxLen) + '…' : s;
  }

  /**
   * Format a count with commas.
   * @param {number} n
   * @returns {string}
   */
  function formatCount(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-IN');
  }

  return Object.freeze({
    escHtml,
    formatDateTime,
    formatDate,
    formatTime,
    truncate,
    formatCount,
  });
})();
