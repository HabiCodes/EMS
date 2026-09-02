/**
 * ui.js — Shared UI helpers (loading, toasts, modals, error display)
 */
window.EMS_UI = (function () {
  'use strict';

  // ── Toast notifications ────────────────────────────────────────
  var toastContainer = null;

  function getContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'ems-toast-container';
      toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;

    var container = getContainer();
    var toast = document.createElement('div');
    var colors = {
      success: { bg: '#10b981', text: '#fff', icon: 'fa-check-circle' },
      error:   { bg: '#ef4444', text: '#fff', icon: 'fa-circle-exclamation' },
      warning: { bg: '#f59e0b', text: '#fff', icon: 'fa-triangle-exclamation' },
      info:    { bg: '#3b82f6', text: '#fff', icon: 'fa-circle-info' },
    };
    var c = colors[type] || colors.info;

    toast.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:8px;color:' + c.text + ';background:' + c.bg + ';font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);pointer-events:auto;transform:translateX(120%);transition:transform 0.3s ease,opacity 0.3s ease;max-width:380px;';
    toast.innerHTML = '<i class="fa-solid ' + c.icon + '"></i><span style="flex:1;line-height:1.4;">' + escapeHtml(message) + '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:16px;padding:0;opacity:0.8;">&times;</button>';
    toast.setAttribute('role', 'alert');

    container.appendChild(toast);
    requestAnimationFrame(function () { toast.style.transform = 'translateX(0)'; });

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);

    return toast;
  }

  // ── Loading overlay ────────────────────────────────────────────
  function showLoading(target, text) {
    text = text || 'Loading...';
    target = target || document.body;

    var overlay = target.querySelector('.ems-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'ems-loading-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:50;border-radius:inherit;';
      overlay.innerHTML = '<div class="ems-spinner" style="width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#FA580B;border-radius:50%;animation:ems-spin 0.8s linear infinite;"></div><p style="margin-top:12px;color:#6b7280;font-size:14px;font-family:system-ui,-apple-system,sans-serif;">' + escapeHtml(text) + '</p>';
      target.style.position = target.style.position || 'relative';
      target.appendChild(overlay);
    }

    if (!document.getElementById('ems-spin-style')) {
      var s = document.createElement('style');
      s.id = 'ems-spin-style';
      s.textContent = '@keyframes ems-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }
  }

  function hideLoading(target) {
    target = target || document.body;
    var overlay = target.querySelector('.ems-loading-overlay');
    if (overlay) overlay.remove();
  }

  // ── Error display ──────────────────────────────────────────────
  function showError(target, message) {
    target = target || document.body;
    var existing = target.querySelector('.ems-error-banner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.className = 'ems-error-banner';
    banner.style.cssText = 'background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:12px 16px;border-radius:8px;display:flex;align-items:center;gap:8px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;';
    banner.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i><span style="flex:1;">' + escapeHtml(message) + '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:#991b1b;">&times;</button>';
    target.insertBefore(banner, target.firstChild);

    setTimeout(function () { banner.remove(); }, 5000);
  }

  // ── Empty state ────────────────────────────────────────────────
  function showEmpty(target, icon, message) {
    target = target || document.body;
    var empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;padding:60px 20px;color:#9ca3af;';
    empty.innerHTML = '<i class="fa-solid ' + (icon || 'fa-inbox') + '" style="font-size:48px;margin-bottom:16px;display:block;"></i><p style="font-size:16px;font-family:system-ui,-apple-system,sans-serif;">' + escapeHtml(message || 'No data found.') + '</p>';
    target.appendChild(empty);
  }

  // ── Modal helpers ──────────────────────────────────────────────
  function openModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');
    el.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    el.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Close on backdrop click
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('ems-modal-overlay')) {
      e.target.style.display = 'none';
      e.target.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // ── Utility ────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatCurrency(amount) {
    var cfg = window.EMS_API_CONFIG || {};
    return cfg.CURRENCY_SYMBOL || '₹' + ' ' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    // Handle HH:MM format
    var parts = String(timeStr).split(':');
    if (parts.length < 2) return timeStr;
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
  }

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  return {
    toast: showToast,
    success: function (msg) { showToast(msg, 'success'); },
    error: function (msg) { showToast(msg, 'error'); },
    warning: function (msg) { showToast(msg, 'warning'); },
    info: function (msg) { showToast(msg, 'info'); },
    showLoading: showLoading,
    hideLoading: hideLoading,
    showError: showError,
    showEmpty: showEmpty,
    openModal: openModal,
    closeModal: closeModal,
    escapeHtml: escapeHtml,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    formatTime: formatTime,
    generateId: generateId,
  };
})();
