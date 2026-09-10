/**
 * Shared UI components.
 * Reusable building blocks used across pages.
 */

const Components = (function () {
  'use strict';

  // ─── Spinner ────────────────────────────────
  function spinner(text) {
    text = text || 'Loading…';
    return DOM.el('div', { className: 'loading-spinner' }, [
      DOM.el('div', { className: 'loading-spinner__icon' }),
      DOM.el('div', { className: 'loading-spinner__text', textContent: text }),
    ]);
  }

  // ─── Empty State ───────────────────────────
  function emptyState(icon, title, message, action) {
    var wrap = DOM.el('div', { className: 'empty-state' });
    if (icon) wrap.appendChild(DOM.el('div', { className: 'empty-state__icon', textContent: icon }));
    if (title) wrap.appendChild(DOM.el('div', { className: 'empty-state__title', textContent: title }));
    if (message) wrap.appendChild(DOM.el('div', { className: 'empty-state__text', textContent: message }));
    if (action) wrap.appendChild(action);
    return wrap;
  }

  // ─── Error State ───────────────────────────
  function errorState(message, onRetry) {
    var wrap = DOM.el('div', { className: 'error-state' });
    wrap.appendChild(DOM.el('div', { className: 'error-state__icon', textContent: '⚠️' }));
    wrap.appendChild(DOM.el('div', { className: 'error-state__title', textContent: 'Something went wrong' }));
    if (message) wrap.appendChild(DOM.el('div', { className: 'error-state__text', textContent: message }));
    if (onRetry) {
      var btn = DOM.el('button', { className: 'btn btn--secondary mt-4', textContent: 'Retry' });
      btn.addEventListener('click', onRetry);
      wrap.appendChild(btn);
    }
    return wrap;
  }

  // ─── Badge ─────────────────────────────────
  function badge(text, variant) {
    var cls = 'badge';
    if (variant) cls += ' badge--' + variant;
    return DOM.el('span', { className: cls, textContent: text });
  }

  // ─── Confirmation Dialog ───────────────────
  function confirmDialog(title, message, onConfirm, onCancel) {
    var overlay = DOM.el('div', { className: 'modal-overlay modal-overlay--visible' });
    var modal = DOM.el('div', { className: 'modal modal--sm' });

    var header = DOM.el('div', { className: 'modal__header' });
    var h2 = DOM.el('h2', { className: 'modal__title', textContent: title });
    header.appendChild(h2);
    modal.appendChild(header);

    var body = DOM.el('div', { className: 'modal__body' });
    if (message) body.appendChild(DOM.el('p', { textContent: message }));
    modal.appendChild(body);

    var footer = DOM.el('div', { className: 'modal__footer' });

    var cancelBtn = DOM.el('button', { className: 'btn btn--secondary', textContent: 'Cancel' });
    cancelBtn.addEventListener('click', function () {
      document.body.removeChild(overlay);
      if (typeof onCancel === 'function') onCancel();
    });

    var confirmBtn = DOM.el('button', { className: 'btn btn--danger', textContent: 'Confirm' });
    confirmBtn.addEventListener('click', function () {
      document.body.removeChild(overlay);
      if (typeof onConfirm === 'function') onConfirm();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        if (typeof onCancel === 'function') onCancel();
      }
    });

    document.body.appendChild(overlay);
    confirmBtn.focus();
  }

  // ─── Toast System ──────────────────────────
  function showToast(message, type, detail) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = DOM.el('div', { className: 'toast toast--' + type });
    var icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
    toast.appendChild(DOM.el('div', { className: 'toast__icon', textContent: icons[type] || icons.info }));

    var content = DOM.el('div', { className: 'toast__content' });
    content.appendChild(DOM.el('div', { className: 'toast__message', textContent: message }));
    if (detail) {
      content.appendChild(DOM.el('div', { className: 'toast__detail', textContent: detail }));
    }
    toast.appendChild(content);

    var dismiss = DOM.el('button', {
      className: 'toast__dismiss',
      textContent: '×',
      'aria-label': 'Dismiss',
    });
    dismiss.addEventListener('click', function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
    toast.appendChild(dismiss);

    container.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 5000);
  }

  return Object.freeze({
    spinner,
    emptyState,
    errorState,
    badge,
    confirmDialog,
    showToast,
  });
})();
