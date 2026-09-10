/**
 * Money utilities for the Super Admin dashboard.
 *
 * Backend uses multiple representations:
 *  - Events: price as normal numeric (major units)
 *  - Showtimes, promotions, refunds: integer paise
 *  - Refunds: amount may be a numeric string
 */

const MoneyUtil = (function () {
  'use strict';

  /**
   * Convert paise (integer or string) to rupees (number).
   * @param {number|string} paise
   * @returns {number} rupees
   */
  function paiseToRupees(paise) {
    const n = typeof paise === 'string' ? parseFloat(paise) : paise;
    if (typeof n !== 'number' || isNaN(n)) return 0;
    return Math.round(n) / 100;
  }

  /**
   * Convert rupees to integer paise.
   * @param {number} rupees
   * @returns {number} paise (rounded to integer)
   */
  function rupeesToPaise(rupees) {
    if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
    return Math.round(rupees * 100);
  }

  /**
   * Format a paise value as INR currency string.
   * @param {number|string} paise
   * @returns {string} e.g. "₹1,250.00"
   */
  function formatINRFromPaise(paise) {
    const rupees = paiseToRupees(paise);
    return formatINR(rupees);
  }

  /**
   * Format a rupee number as INR currency string.
   * @param {number} rupees
   * @returns {string} e.g. "₹1,250.00"
   */
  function formatINR(rupees) {
    if (typeof rupees !== 'number' || isNaN(rupees)) return '₹0.00';
    const fixed = rupees.toFixed(2);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '₹' + parts.join('.');
  }

  /**
   * Format a rupee number compactly (no decimals) for tables.
   * @param {number} rupees
   * @returns {string} e.g. "₹1,250"
   */
  function formatINRCompact(rupees) {
    if (typeof rupees !== 'number' || isNaN(rupees)) return '₹0';
    const rounded = Math.round(rupees);
    return '₹' + String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return Object.freeze({
    paiseToRupees,
    rupeesToPaise,
    formatINRFromPaise,
    formatINR,
    formatINRCompact,
  });
})();
