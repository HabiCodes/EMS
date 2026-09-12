/**
 * EntryMySlot - Integration Verification
 * Run in browser console after page load.
 * - Phase 1: Global existence checks
 * - Phase 2: API smoke tests (GET endpoints that return public data)
 */

(function () {
    var results = [];
    var SMOKE_TESTS_ENABLED = false; // Set true to run live API smoke tests

    function check(name, fn) {
        try {
            var ok = !!fn();
            results.push(ok ? 'PASS ' + name : 'FAIL ' + name);
        } catch (e) {
            results.push('FAIL ' + name + ' (error: ' + e.message + ')');
        }
    }

    // ── Config ──────────────────────────────────────────────────

    check('EMS_CONFIG exists', function () { return !!window.EMS_CONFIG; });
    check('EMS_CONFIG.apiBaseUrl', function () { return window.EMS_CONFIG && window.EMS_CONFIG.apiBaseUrl === 'https://api.entrymyslot.com/api/v1'; });
    check('EMS_CONFIG.storage keys', function () {
        if (!window.EMS_CONFIG || !window.EMS_CONFIG.storage) return false;
        var s = window.EMS_CONFIG.storage;
        return !!s.customerAccess && !!s.customerRefresh && !!s.organizerAccess && !!s.organizerRefresh && !!s.adminToken;
    });

    // ── API Client ──────────────────────────────────────────────

    check('EMSApi exists', function () { return !!window.EMSApi; });
    check('EMSApi.get', function () { return typeof window.EMSApi.get === 'function'; });
    check('EMSApi.post', function () { return typeof window.EMSApi.post === 'function'; });
    check('EMSApi.patch', function () { return typeof window.EMSApi.patch === 'function'; });
    check('EMSApi.delete', function () { return typeof window.EMSApi.delete === 'function'; });
    check('EMSApi.request (core)', function () { return typeof window.EMSApi.request === 'function'; });
    check('EMSApi.logoutCustomer', function () { return typeof window.EMSApi.logoutCustomer === 'function'; });
    check('EMSApi.logoutOrganizer', function () { return typeof window.EMSApi.logoutOrganizer === 'function'; });
    check('EMSApi.logoutAdmin', function () { return typeof window.EMSApi.logoutAdmin === 'function'; });
    check('EMSApi.refreshOrganizerToken', function () { return typeof window.EMSApi.refreshOrganizerToken === 'function'; });

    // ── Mappers ─────────────────────────────────────────────────

    check('EMSMappers', function () { return !!window.EMSMappers; });
    check('EMSMappers.toCamel', function () { return typeof window.EMSMappers.toCamel === 'function'; });
    check('EMSMappers.mapKeys', function () { return typeof window.EMSMappers.mapKeys === 'function'; });
    check('formatMoney (global)', function () { return typeof window.formatMoney === 'function'; });
    check('FormatMoneyUtil', function () { return !!window.FormatMoneyUtil; });
    check('MoneyUtil', function () { return !!window.MoneyUtil; });
    check('MoneyUtil.formatINR', function () { return typeof window.MoneyUtil.formatINR === 'function'; });
    check('MoneyUtil.paiseToRupees', function () { return typeof window.MoneyUtil.paiseToRupees === 'function'; });

    // ── Auth ────────────────────────────────────────────────────

    check('EMSAuth', function () { return !!window.EMSAuth; });
    check('EMSAuth.login', function () { return typeof window.EMSAuth.login === 'function'; });
    check('EMSAuth.register', function () { return typeof window.EMSAuth.register === 'function'; });
    check('EMSAuth.restoreSession', function () { return typeof window.EMSAuth.restoreSession === 'function'; });
    check('EMSAuth.logout', function () { return typeof window.EMSAuth.logout === 'function'; });
    check('EMSAuth.forgotPassword', function () { return typeof window.EMSAuth.forgotPassword === 'function'; });
    check('EMSAuth.resetPassword', function () { return typeof window.EMSAuth.resetPassword === 'function'; });
    check('EMSAuth.updateProfile', function () { return typeof window.EMSAuth.updateProfile === 'function'; });
    check('EMSOrganizerAuth', function () { return !!window.EMSOrganizerAuth; });
    check('EMSOrganizerAuth.login', function () { return typeof window.EMSOrganizerAuth.login === 'function'; });
    check('EMSOrganizerAuth.refresh', function () { return typeof window.EMSOrganizerAuth.refresh === 'function'; });
    check('EMSAdminAuth', function () { return !!window.EMSAdminAuth; });

    // ── Router ──────────────────────────────────────────────────

    check('EMSRouter', function () { return !!window.EMSRouter; });
    check('EMSRouter.get', function () { return typeof window.EMSRouter.get === 'function'; });
    check('EMSRouter.navigate', function () { return typeof window.EMSRouter.navigate === 'function'; });
    check('EMSRouter.match', function () { return typeof window.EMSRouter.match === 'function'; });
    check('EMSRouter.setResolveInitial', function () { return typeof window.EMSRouter.setResolveInitial === 'function'; });

    // ── Utilities ───────────────────────────────────────────────

    check('DOM', function () { return !!window.DOM; });
    check('DOM.el', function () { return typeof window.DOM.el === 'function'; });
    check('FormatUtil', function () { return !!window.FormatUtil; });
    check('FormatUtil.formatDate', function () { return typeof window.FormatUtil.formatDate === 'function'; });
    check('FormatUtil.formatDateTime', function () { return typeof window.FormatUtil.formatDateTime === 'function'; });
    check('FormatUtil.formatTime', function () { return typeof window.FormatUtil.formatTime === 'function'; });

    // ── Components ──────────────────────────────────────────────

    check('showToast', function () { return typeof window.showToast === 'function'; });
    check('renderLoading', function () { return typeof window.renderLoading === 'function'; });
    check('renderEmpty', function () { return typeof window.renderEmpty === 'function'; });
    check('escapeHtml', function () { return typeof window.escapeHtml === 'function'; });
    check('statusBadge', function () { return typeof window.statusBadge === 'function'; });
    check('Components', function () { return !!window.Components; });
    check('Components.showToast', function () { return typeof window.Components.showToast === 'function'; });
    check('Components.confirmDialog', function () { return typeof window.Components.confirmDialog === 'function'; });

    // ── Location ────────────────────────────────────────────────

    check('EMSLocation', function () { return !!window.EMSLocation || !!window.EMS_LOCATION; });
    check('EMSLocation.setSelected', function () { return typeof (window.EMSLocation || window.EMS_LOCATION).setSelected === 'function'; });
    check('EMSLocation.getSelected', function () { return typeof (window.EMSLocation || window.EMS_LOCATION).getSelected === 'function'; });
    check('EMSLocation.showOverlay', function () { return typeof (window.EMSLocation || window.EMS_LOCATION).showOverlay === 'function'; });

    // ── Page Modules ────────────────────────────────────────────

    check('EMSCustomerPages', function () { return !!window.EMSCustomerPages; });
    check('EMSCustomerPages.registerRoutes', function () { return typeof window.EMSCustomerPages.registerRoutes === 'function'; });
    check('EMSCustomerPages.citySlug', function () { return typeof window.EMSCustomerPages.citySlug === 'function'; });
    check('EMSAdminPages', function () { return !!window.EMSAdminPages; });
    check('EMSAdminPages.registerRoutes', function () { return typeof window.EMSAdminPages.registerRoutes === 'function'; });
    check('EMSPartnerPages', function () { return !!window.EMSPartnerPages; });
    check('EMSPartnerPages.registerRoutes', function () { return typeof window.EMSPartnerPages.registerRoutes === 'function'; });

    // ── API Endpoints ───────────────────────────────────────────

    check('EMSMovieApi', function () { return !!window.EMSMovieApi; });
    check('EMSMovieApi.list', function () { return typeof window.EMSMovieApi.list === 'function'; });
    check('EMSMovieApi.holdSeats', function () { return typeof window.EMSMovieApi.holdSeats === 'function'; });
    check('EMSMovieApi.releaseSeats', function () { return typeof window.EMSMovieApi.releaseSeats === 'function'; });
    check('EMSMovieApi.createBooking', function () { return typeof window.EMSMovieApi.createBooking === 'function'; });
    check('EMSEventApi', function () { return !!window.EMSEventApi; });
    check('EMSEventApi.createBooking', function () { return typeof window.EMSEventApi.createBooking === 'function'; });
    check('EMSTurfApi', function () { return !!window.EMSTurfApi; });
    check('EMSTurfApi.getAvailability', function () { return typeof window.EMSTurfApi.getAvailability === 'function'; });
    check('EMSTurfApi.createBooking', function () { return typeof window.EMSTurfApi.createBooking === 'function'; });
    check('EMSBookingApi', function () { return !!window.EMSBookingApi; });
    check('EMSBookingApi.getMy', function () { return typeof window.EMSBookingApi.getMy === 'function'; });
    check('EMSBookingApi.verifyPayment', function () { return typeof window.EMSBookingApi.verifyPayment === 'function'; });
    check('EMSBookingApi.createPaymentOrder', function () { return typeof window.EMSBookingApi.createPaymentOrder === 'function'; });

    // ── Smoke tests (optional, runs only when SMOKE_TESTS_ENABLED = true) ──

    async function runSmokeTests() {
        if (!SMOKE_TESTS_ENABLED) {
            console.log('Smoke tests: disabled (set SMOKE_TESTS_ENABLED = true in source to enable)');
            return;
        }
        var base = window.EMS_CONFIG && window.EMS_CONFIG.apiBaseUrl;
        if (!base) { console.log('Smoke tests: skipped — no API base URL'); return; }

        var smoke = [];
        function s(name, promise) {
            smoke.push({ name: name, promise: promise });
        }

        // Public GET endpoints (no auth needed)
        s('GET /movies/featured', window.EMSMovieApi.getFeatured());
        s('GET /events/featured', window.EMSEventApi.getFeatured());
        s('GET /turf/grounds', window.EMSTurfApi.list());

        var smokeResults = await Promise.allSettled(smoke.map(function (t) { return t.promise.then(function (r) { return { name: t.name, ok: r.ok, status: r.status, success: r.ok && !!r.data }; }); }));
        smokeResults.forEach(function (sr, i) {
            try {
                var d = smokeResults[i].value;
                var prefix = d.ok && d.success ? 'PASS' : 'FAIL';
                results.push(prefix + ' SMOKE ' + smoke[i].name + ' (HTTP ' + d.status + ')');
            } catch (e) {
                results.push('FAIL SMOKE ' + smoke[i].name + ' (exception)');
            }
        });
    }

    // ── Output ──────────────────────────────────────────────────

    console.log('=== EntryMySlot Integration Check ===');
    results.forEach(function (r) { console.log(r); });
    var passed = results.filter(function (r) { return r.charAt(0) === 'P'; }).length;
    var failed = results.filter(function (r) { return r.charAt(0) === 'F'; }).length;
    console.log('=== ' + passed + ' passed, ' + failed + ' failed ===');

    if (SMOKE_TESTS_ENABLED) {
        console.log('Running smoke tests...');
        runSmokeTests().then(function () {
            console.log('=== Smoke tests complete ===');
        });
    }

    window.EMSVerify = { results: results, passed: passed, failed: failed };
    return { passed: passed, failed: failed, results: results };
})();
