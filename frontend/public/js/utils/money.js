/**
 * Money utilities for the Super Admin dashboard.
 *
 * Backend uses multiple representations:
 *  - Events: price as normal numeric (major units)
 *  - Showtimes, promotions, refunds: integer paise
 *  - Refunds: amount may be a numeric string
 */

(function (global) {
  'use strict';

  function paiseToRupees(paise) {
    const n = typeof paise === 'string' ? parseFloat(paise) : paise;
    if (typeof n !== 'number' || isNaN(n)) return 0;
    return Math.round(n) / 100;
  }
  function rupeesToPaise(rupees) {
    if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
    return Math.round(rupees * 100);
  }
  function formatINRFromPaise(paise) { return formatINR(paiseToRupees(paise)); }
  function formatINR(rupees) {
    if (typeof rupees !== 'number' || isNaN(rupees)) return '₹0.00';
    const fixed = rupees.toFixed(2);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '₹' + parts.join('.');
  }
  function formatINRCompact(rupees) {
    if (typeof rupees !== 'number' || isNaN(rupees)) return '₹0';
    return '₹' + String(Math.round(rupees)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  global.MoneyUtil = Object.freeze({
    paiseToRupees, rupeesToPaise, formatINRFromPaise, formatINR, formatINRCompact,
  });

})(window);
