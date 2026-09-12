/**
 * EntryMySlot - Main Application Bootstrap
 * Loads config, API client, mappers, auth, router, and initializes the app.
 */

(function (global) {
    'use strict';

    // ── Immediate redirect ──────────────────────────────────────────
    // When served from a subdirectory (e.g. /frontend/public/), redirect to root.
    var pathname = global.location.pathname;
    if (pathname.indexOf('/index.html') !== -1 || pathname === '/frontend/public/' || pathname.indexOf('/frontend/public/') === 0) {
        global.location.replace('/');
        return;
    }

    // ── Script loader ──────────────────────────────────────────────────

    function loadScripts(paths, index) {
        index = index || 0;
        if (index >= paths.length) {
            if (typeof global.__emsAppReady === 'function') global.__emsAppReady();
            return;
        }
        var script = document.createElement('script');
        script.src = paths[index];
        script.onerror = function () {
            console.warn('Failed to load script: ' + paths[index]);
            loadScripts(paths, index + 1);
        };
        script.onload = function () { loadScripts(paths, index + 1); };
        document.head.appendChild(script);
    }

    // ── Init ───────────────────────────────────────────────────────────

    function init() {
        // Restore all auth sessions
        if (typeof EMSAuth !== 'undefined') {
            EMSAuth.restoreSession().catch(function () {});
        }
        if (typeof EMSOrganizerAuth !== 'undefined') {
            EMSOrganizerAuth.restoreSession().catch(function () {});
        }
        if (typeof EMSAdminAuth !== 'undefined') {
            EMSAdminAuth.restoreSession().catch(function () {});
        }

        if (typeof EMSLocation !== 'undefined' && typeof EMSLocation.init === 'function') {
            EMSLocation.init();
        }

        // Initial route handling
        if (typeof EMSRouter !== 'undefined' && EMSRouter.getRoutes().length === 0) {
            // Routes will be registered by routes.js
        }

        // Trigger app ready
        if (typeof global.__emsAppReady === 'function') {
            global.__emsAppReady();
        }
    }

    // ── Auto-init ──────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
