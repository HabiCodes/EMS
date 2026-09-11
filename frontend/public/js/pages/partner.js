/**
 * EntryMySlot - Partner / Organizer Dashboard Pages
 */

(function (global) {
    'use strict';

    var _dashboardData = null;

    // ── DASHBOARD ──────────────────────────────────────────────

    async function loadDashboardData() {
        if (_dashboardData) return _dashboardData;
        var orgId = EMSOrganizerAuth.getOrganizationId();
        var data = {
            totalBookings: 0,
            revenue: 0,
            turfCount: 0,
            eventCount: 0,
            movieCount: 0,
            pendingBookings: 0,
            recentBookings: [],
        };

        try {
            var orgFilter = orgId ? '?organizationId=' + orgId : '';
            // Aggregate from multiple endpoints
            var results = await Promise.allSettled([
                global.EMSApi.get('/owner/bookings' + orgFilter, { authScope: 'organizer' }),
                global.EMSApi.get('/owner/turfs' + orgFilter, { authScope: 'organizer' }),
                global.EMSApi.get('/owner/events' + orgFilter, { authScope: 'organizer' }),
                global.EMSApi.get('/owner/movies' + orgFilter, { authScope: 'organizer' }),
            ]);

            var bookings = (results[0].status === 'fulfilled' && results[0].value && results[0].value.data && results[0].value.data.success) ? results[0].value.data.data : [];
            var turfs = (results[1].status === 'fulfilled' && results[1].value && results[1].value.data && results[1].value.data.success) ? results[1].value.data.data : [];
            var events = (results[2].status === 'fulfilled' && results[2].value && results[2].value.data && results[2].value.data.success) ? results[2].value.data.data : [];
            var movies = (results[3].status === 'fulfilled' && results[3].value && results[3].value.data && results[3].value.data.success) ? results[3].value.data.data : [];

            data.totalBookings = bookings.length;
            data.revenue = bookings.reduce(function (sum, b) { return sum + (parseInt(b.amount) || parseInt(b.totalAmount) || 0); }, 0);
            data.turfCount = turfs.length;
            data.eventCount = events.length;
            data.movieCount = movies.length;
            data.pendingBookings = bookings.filter(function (b) { return b.status === 'payment_pending' || b.status === 'pending'; }).length;
            data.recentBookings = bookings.slice(0, 5);
        } catch (_) {
            // Use defaults if fetch fails
        }
        _dashboardData = data;
        return data;
    }

    async function renderPartnerDashboard() {
        if (!EMSOrganizerAuth.isLoggedIn()) { EMSRouter.navigate('/partner/login'); return; }
        var main = document.getElementById('mainContent');
        if (!main) return;
        main.innerHTML = renderLoading('Loading dashboard...');

        try {
            var data = await loadDashboardData();
            var user = EMSOrganizerAuth.getUser();
            var orgId = EMSOrganizerAuth.getOrganizationId();

            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="mb-8">');
            html.push('    <h1 class="text-3xl font-extrabold text-gray-900 mb-2">Partner Dashboard</h1>');
            html.push('    <p class="text-gray-500 font-medium">Welcome, ' + escapeHtml((user && (user.name || user.organization_name)) || 'Partner') + (orgId ? ' <span class="text-xs text-gray-400">(Org #' + escapeHtml(String(orgId)) + ')</span>' : '') + '</p>');
            html.push('  </div>');

            // Stat cards
            html.push('  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">');
            var cards = [
                { label: 'Total Bookings', value: data.totalBookings || 0, icon: 'fa-ticket', color: 'bg-custom-light' },
                { label: 'Revenue', value: formatMoney(data.revenue || 0), icon: 'fa-indian-rupee-sign', color: 'bg-green-500' },
                { label: 'My Turfs', value: data.turfCount || 0, icon: 'fa-futbol', color: 'bg-custom-dark' },
                { label: 'My Events', value: data.eventCount || 0, icon: 'fa-calendar', color: 'bg-purple-500' },
            ];
            cards.forEach(function (c) {
                html.push('    <div class="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">');
                html.push('      <div class="w-12 h-12 ' + c.color + ' rounded-2xl flex items-center justify-center text-white mb-4"><i class="fa-solid ' + c.icon + ' text-lg"></i></div>');
                html.push('      <p class="text-sm text-gray-500 font-medium mb-1">' + c.label + '</p>');
                html.push('      <p class="text-2xl font-extrabold text-gray-900">' + c.value + '</p>');
                html.push('    </div>');
            });
            html.push('  </div>');

            // Quick actions
            html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-8">');
            html.push('    <h2 class="font-extrabold text-gray-900 mb-4">Manage</h2>');
            html.push('    <div class="flex flex-wrap gap-3">');
            html.push('      <a href="/partner/turfs" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">My Turfs</a>');
            html.push('      <a href="/partner/events" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">My Events</a>');
            html.push('      <a href="/partner/movies" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">My Movies</a>');
            html.push('      <a href="/partner/bookings" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">Bookings</a>');
            html.push('    </div>');
            html.push('  </div>');

            // Recent bookings
            if (data.recentBookings && data.recentBookings.length) {
                html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">');
                html.push('    <h2 class="font-extrabold text-gray-900 mb-4">Recent Bookings</h2>');
                html.push('    <div class="space-y-3">');
                data.recentBookings.forEach(function (b) {
                    html.push('      <div class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">');
                    html.push('        <div><p class="font-extrabold text-sm text-gray-900">#' + escapeHtml(b.reference || b.id || '') + '</p><p class="text-xs text-gray-500">' + escapeHtml(b.userName || b.userEmail || 'Customer') + '</p></div>');
                    html.push('        <div class="flex items-center gap-4">' + statusBadge(b.status) + '<span class="font-extrabold text-sm">' + formatMoney(b.amount || b.totalAmount || 0) + '</span></div>');
                    html.push('      </div>');
                });
                html.push('    </div>');
                html.push('  </div>');
            }

            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Partner Dashboard — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load dashboard', 'Please refresh.');
        }
    }

    // ── TURFS ──────────────────────────────────────────────────

    async function renderPartnerTurfs() {
        if (!EMSOrganizerAuth.isLoggedIn()) { EMSRouter.navigate('/partner/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading your turfs...');
        try {
            var orgId = EMSOrganizerAuth.getOrganizationId();
            var result = await global.EMSApi.get('/owner/turfs' + (orgId ? '?organizationId=' + orgId : ''), { authScope: 'organizer' });
            var turfs = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="flex items-center justify-between mb-8"><h1 class="text-3xl font-extrabold text-gray-900">My Turfs</h1><button onclick="showToast(\'Add turf via owner portal\', \'success\')" class="bg-custom-light text-white font-extrabold px-6 py-3 rounded-xl text-sm">+ Add Turf</button></div>');
            if (!turfs.length) {
                html.push(renderEmpty('No Turfs', 'You haven\'t listed any turfs yet.'));
            } else {
                html.push('  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">');
                turfs.forEach(function (t) {
                    html.push('    <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-5">');
                    html.push('      <h3 class="font-extrabold text-gray-900 text-base mb-2">' + escapeHtml(t.name || '') + '</h3>');
                    html.push('      <p class="text-sm text-gray-500 font-medium">' + escapeHtml(t.sport || '') + ' — ' + escapeHtml(t.city || '') + '</p>');
                    html.push('      <div class="mt-3 flex items-center justify-between">' + statusBadge(t.status || t.isActive ? 'active' : 'inactive') + '<span class="text-sm font-extrabold">' + formatMoney(t.pricePerHour || 0) + '/hr</span></div>');
                    html.push('    </div>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'My Turfs — Partner';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load turfs', 'Please refresh.');
        }
    }

    // ── EVENTS ──────────────────────────────────────────────────

    async function renderPartnerEvents() {
        if (!EMSOrganizerAuth.isLoggedIn()) { EMSRouter.navigate('/partner/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading your events...');
        try {
            var orgId = EMSOrganizerAuth.getOrganizationId();
            var result = await global.EMSApi.get('/owner/events' + (orgId ? '?organizationId=' + orgId : ''), { authScope: 'organizer' });
            var events = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="flex items-center justify-between mb-8"><h1 class="text-3xl font-extrabold text-gray-900">My Events</h1><button onclick="showToast(\'Add event via owner portal\', \'success\')" class="bg-custom-light text-white font-extrabold px-6 py-3 rounded-xl text-sm">+ Add Event</button></div>');
            if (!events.length) {
                html.push(renderEmpty('No Events', 'You haven\'t listed any events yet.'));
            } else {
                html.push('  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">');
                events.forEach(function (e) {
                    html.push('    <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">');
                    html.push('      <div class="h-48 bg-gray-100 relative"><img src="' + escapeHtml(e.imageUrl || '') + '" class="w-full h-full object-cover"></div>');
                    html.push('      <div class="p-5"><h3 class="font-extrabold text-gray-900 text-base mb-1">' + escapeHtml(e.title || '') + '</h3>');
                    html.push('        <p class="text-sm text-gray-500 font-medium">' + escapeHtml(e.eventDate || '') + ' — ' + escapeHtml(e.city || '') + '</p>');
                    html.push('        <div class="mt-2">' + statusBadge(e.status) + '</div>');
                    html.push('      </div></div>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'My Events — Partner';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load events', 'Please refresh.');
        }
    }

    // ── MOVIES ─────────────────────────────────────────────────

    async function renderPartnerMovies() {
        if (!EMSOrganizerAuth.isLoggedIn()) { EMSRouter.navigate('/partner/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading your movies...');
        try {
            var orgId = EMSOrganizerAuth.getOrganizationId();
            var result = await global.EMSApi.get('/owner/movies' + (orgId ? '?organizationId=' + orgId : ''), { authScope: 'organizer' });
            var movies = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="flex items-center justify-between mb-8"><h1 class="text-3xl font-extrabold text-gray-900">My Movies</h1><button onclick="showToast(\'Add movie via owner portal\', \'success\')" class="bg-custom-light text-white font-extrabold px-6 py-3 rounded-xl text-sm">+ Add Movie</button></div>');
            if (!movies.length) {
                html.push(renderEmpty('No Movies', 'You haven\'t listed any movies yet.'));
            } else {
                html.push('  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">');
                movies.forEach(function (m) {
                    html.push('    <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">');
                    html.push('      <img src="' + escapeHtml(m.posterUrl || '') + '" class="w-full aspect-[2/3] object-cover">');
                    html.push('      <div class="p-3"><h3 class="font-extrabold text-sm text-gray-900">' + escapeHtml(m.title || '') + '</h3>');
                    html.push('        <div class="mt-1">' + statusBadge(m.status) + '</div>');
                    html.push('      </div></div>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'My Movies — Partner';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load movies', 'Please refresh.');
        }
    }

    // ── BOOKINGS ───────────────────────────────────────────────

    async function renderPartnerBookings() {
        if (!EMSOrganizerAuth.isLoggedIn()) { EMSRouter.navigate('/partner/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading bookings...');
        try {
            var orgId = EMSOrganizerAuth.getOrganizationId();
            var result = await global.EMSApi.get('/owner/bookings' + (orgId ? '?organizationId=' + orgId : ''), { authScope: 'organizer' });
            var bookings = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Partner Bookings</h1>');
            if (!bookings.length) {
                html.push(renderEmpty('No Bookings', 'No bookings found.'));
            } else {
                html.push('  <div class="space-y-4">');
                bookings.forEach(function (b) {
                    html.push('    <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 flex items-center justify-between">');
                    html.push('      <div><h3 class="font-extrabold text-gray-900">#' + escapeHtml(b.reference || b.id || '') + '</h3><p class="text-sm text-gray-500">' + escapeHtml(b.userEmail || b.userName || '') + '</p></div>');
                    html.push('      <div class="flex items-center gap-4">' + statusBadge(b.status) + '<span class="font-extrabold">' + formatMoney(b.totalAmount || b.amount || 0) + '</span></div>');
                    html.push('    </div>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Partner Bookings — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load', 'Please refresh.');
        }
    }

    // ── PROMOTIONS ─────────────────────────────────────────────

    async function renderPartnerPromotions() {
        if (!EMSOrganizerAuth.isLoggedIn()) { EMSRouter.navigate('/partner/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading promotions...');
        try {
            var orgId = EMSOrganizerAuth.getOrganizationId();
            var result = await global.EMSApi.get('/promotions/organizer' + (orgId ? '?organizationId=' + orgId : ''), { authScope: 'organizer' });
            var promos = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="flex items-center justify-between mb-8"><h1 class="text-3xl font-extrabold text-gray-900">Promotions</h1><button onclick="showToast(\'Create promotion via owner portal\', \'success\')" class="bg-custom-light text-white font-extrabold px-6 py-3 rounded-xl text-sm">+ New Promotion</button></div>');
            if (!promos.length) {
                html.push(renderEmpty('No Promotions', 'You haven\'t created any promotions yet.'));
            } else {
                html.push('  <div class="space-y-4">');
                promos.forEach(function (p) {
                    html.push('    <div class="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex items-center justify-between">');
                    html.push('      <div><h3 class="font-extrabold text-gray-900">' + escapeHtml(p.title || p.name || '') + '</h3><p class="text-sm text-gray-500">' + escapeHtml(p.description || '') + '</p></div>');
                    html.push('      <div>' + statusBadge(p.isActive ? 'active' : 'inactive') + '</div>');
                    html.push('    </div>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Promotions — Partner';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load promotions', 'Please refresh.');
        }
    }

    // ── REGISTER ROUTES ────────────────────────────────────────

    function registerRoutes() {
        if (typeof global.EMSRouter === 'undefined') return;
        global.EMSRouter.get('/partner/dashboard', renderPartnerDashboard);
        global.EMSRouter.get('/partner/turfs', renderPartnerTurfs);
        global.EMSRouter.get('/partner/events', renderPartnerEvents);
        global.EMSRouter.get('/partner/movies', renderPartnerMovies);
        global.EMSRouter.get('/partner/bookings', renderPartnerBookings);
        global.EMSRouter.get('/partner/promotions', renderPartnerPromotions);
        global.EMSRouter.get('/partner/login', function () {
            if (EMSOrganizerAuth.isLoggedIn()) { EMSRouter.navigate('/partner/dashboard'); return; }
            showPartnerLogin();
        });
    }

    global.EMSPartnerPages = Object.freeze({
        renderPartnerDashboard: renderPartnerDashboard,
        renderPartnerTurfs: renderPartnerTurfs,
        renderPartnerEvents: renderPartnerEvents,
        renderPartnerMovies: renderPartnerMovies,
        renderPartnerBookings: renderPartnerBookings,
        renderPartnerPromotions: renderPartnerPromotions,
        registerRoutes: registerRoutes,
    });

})(window);
