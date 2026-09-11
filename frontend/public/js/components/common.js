/**
 * Shared UI components.
 * Reusable building blocks used across pages.
 * Exposed globally so any page module can call helpers directly.
 */

(function (global) {
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

    // ─── HTML Empty State (string-based for inline rendering) ────
    function renderEmpty(title, subtitle, action) {
        var html = '<div class="text-center py-20">' +
            '<div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-3xl"><i class="fa-regular fa-calendar"></i></div>' +
            '<h3 class="text-lg font-extrabold text-gray-900 mb-2">' + title + '</h3>' +
            '<p class="text-sm text-gray-500 font-medium mb-6">' + subtitle + '</p>';
        if (action) html += '<button onclick="' + action + '" class="bg-custom-light text-white font-extrabold px-8 py-3 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Browse</button>';
        html += '</div>';
        return html;
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
            if (overlay.parentNode) document.body.removeChild(overlay);
            if (typeof onCancel === 'function') onCancel();
        });

        var confirmBtn = DOM.el('button', { className: 'btn btn--danger', textContent: 'Confirm' });
        confirmBtn.addEventListener('click', function () {
            if (overlay.parentNode) document.body.removeChild(overlay);
            if (typeof onConfirm === 'function') onConfirm();
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
        modal.appendChild(footer);
        overlay.appendChild(modal);
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

    // ─── Render Helpers (commonly needed across pages) ────
    function renderLoading(text) {
        text = text || 'Loading...';
        return '<div class="flex flex-col items-center justify-center py-20"><div class="w-10 h-10 border-4 border-gray-100 border-t-custom-light rounded-full animate-spin mb-4"></div><p class="text-gray-500 font-bold text-sm">' + text + '</p></div>';
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function statusBadge(status) {
        var s = String(status || '').toLowerCase();
        var color = 'gray';
        if (['confirmed', 'completed', 'paid', 'published'].indexOf(s) !== -1) color = 'green';
        else if (['pending_payment', 'pending', 'processing', 'held'].indexOf(s) !== -1) color = 'amber';
        else if (['cancelled', 'canceled', 'failed', 'expired', 'refunded'].indexOf(s) !== -1) color = 'red';
        var colors = {
            green: 'bg-green-50 text-green-700 border-green-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200',
            red: 'bg-red-50 text-red-700 border-red-200',
            gray: 'bg-gray-100 text-gray-600 border-gray-200'
        };
        return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ' + (colors[color] || colors.gray) + '">' + escapeHtml(status.replace(/_/g, ' ')) + '</span>';
    }

    global.Components = Object.freeze({
        spinner: spinner,
        emptyState: emptyState,
        errorState: errorState,
        badge: badge,
        confirmDialog: confirmDialog,
        showToast: showToast,
        renderLoading: renderLoading,
        renderEmpty: renderEmpty,
        escapeHtml: escapeHtml,
        statusBadge: statusBadge,
    });

    // Also expose as globals for convenience (page modules call these directly)
    global.showToast = showToast;
    global.renderLoading = renderLoading;
    global.renderEmpty = renderEmpty;
    global.escapeHtml = escapeHtml;
    global.statusBadge = statusBadge;

})(window);
