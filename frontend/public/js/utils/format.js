/**
 * EntryMySlot - Format and escape utilities.
 * Attached to window as global.FormatUtil for use across all modules.
 */

(function (global) {
    'use strict';

    function escHtml(str) {
        if (str == null) return '';
        var s = String(str);
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return s.replace(/[&<>"']/g, function (c) { return map[c]; });
    }

    function formatDateTime(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            var dd = String(d.getDate()).padStart(2, '0');
            var mm = String(d.getMonth() + 1).padStart(2, '0');
            var yyyy = d.getFullYear();
            var hh = String(d.getHours()).padStart(2, '0');
            var mi = String(d.getMinutes()).padStart(2, '0');
            return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi;
        } catch (_) {
            return '—';
        }
    }

    function formatDate(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            var dd = String(d.getDate()).padStart(2, '0');
            var mm = String(d.getMonth() + 1).padStart(2, '0');
            var yyyy = d.getFullYear();
            return dd + '/' + mm + '/' + yyyy;
        } catch (_) {
            return '—';
        }
    }

    function formatTime(time) {
        if (!time) return '—';
        return time.substring(0, 5);
    }

    function truncate(str, maxLen) {
        if (!str) return '';
        var s = String(str);
        return s.length > maxLen ? s.substring(0, maxLen) + '…' : s;
    }

    function formatCount(n) {
        if (n == null || isNaN(n)) return '0';
        return Number(n).toLocaleString('en-IN');
    }

    global.FormatUtil = Object.freeze({
        escHtml: escHtml,
        formatDateTime: formatDateTime,
        formatDate: formatDate,
        formatTime: formatTime,
        truncate: truncate,
        formatCount: formatCount,
    });

})(window);
