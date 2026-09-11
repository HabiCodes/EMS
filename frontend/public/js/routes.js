/**
 * EntryMySlot - Route Registration
 * Registers all routes from page modules after they load.
 * This file must be loaded AFTER all page module scripts.
 */

(function (global) {
    'use strict';

    function registerAllRoutes() {
        if (typeof global.EMSCustomerPages !== 'undefined' && typeof global.EMSCustomerPages.registerRoutes === 'function') {
            global.EMSCustomerPages.registerRoutes();
        }
        if (typeof global.EMSAdminPages !== 'undefined' && typeof global.EMSAdminPages.registerRoutes === 'function') {
            global.EMSAdminPages.registerRoutes();
        }
        if (typeof global.EMSPartnerPages !== 'undefined' && typeof global.EMSPartnerPages.registerRoutes === 'function') {
            global.EMSPartnerPages.registerRoutes();
        }
        // Signal router that all routes are registered and initial URL can resolve.
        if (typeof global.EMSRouter !== 'undefined' && typeof global.EMSRouter.setResolveInitial === 'function') {
            global.EMSRouter.setResolveInitial(true);
        }
    }

    // Register after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerAllRoutes);
    } else {
        registerAllRoutes();
    }

    // Also register when app is ready
    if (typeof global.__emsAppReady === 'function') {
        var original = global.__emsAppReady;
        global.__emsAppReady = function () {
            original();
            registerAllRoutes();
        };
    }

})(window);
