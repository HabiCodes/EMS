/**
 * EntryMySlot - Admin Dashboard Pages
 * All admin modules with backend integration.
 */

(function (global) {
    'use strict';

    // ── DASHBOARD ──────────────────────────────────────────────

    async function renderAdminDashboard() {
        if (!EMSAdminAuth.isLoggedIn()) { EMSRouter.navigate('/admin/login'); return; }
        var main = document.getElementById('mainContent');
        if (!main) return;
        main.innerHTML = renderLoading('Loading dashboard...');

        try {
            var statsResult = await global.EMSApi.get('/admin/stats', { authScope: 'admin' });
            var stats = (statsResult.ok && statsResult.data && statsResult.data.success) ? statsResult.data.data : {};

            var bookings = stats.bookings || {};
            var events = stats.events || {};
            var turf = stats.turfBookings || {};

            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="flex items-center justify-between mb-8">');
            html.push('    <div><h1 class="text-3xl font-extrabold text-gray-900">Dashboard</h1><p class="text-sm text-gray-500 font-medium mt-1">Welcome back, Admin</p></div>');
            html.push('    <span class="text-sm text-gray-500 font-medium">' + new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</span>');
            html.push('  </div>');

            // Stat cards
            html.push('  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">');
            var cards = [
                { label: 'Total Bookings', value: bookings.total || 0, icon: 'fa-ticket', color: 'bg-custom-light' },
                { label: 'Total Revenue', value: formatMoney(stats.revenue || 0), icon: 'fa-indian-rupee-sign', color: 'bg-green-500' },
                { label: 'Active Events', value: events.active || 0, icon: 'fa-calendar', color: 'bg-custom-dark' },
                { label: 'Organizations', value: stats.organizations || 0, icon: 'fa-building', color: 'bg-purple-500' },
            ];
            cards.forEach(function(c) {
                html.push('    <div class="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">');
                html.push('      <div class="w-12 h-12 ' + c.color + ' rounded-2xl flex items-center justify-center text-white mb-4"><i class="fa-solid ' + c.icon + ' text-lg"></i></div>');
                html.push('      <p class="text-sm text-gray-500 font-medium mb-1">' + c.label + '</p>');
                html.push('      <p class="text-2xl font-extrabold text-gray-900">' + c.value + '</p>');
                html.push('    </div>');
            });
            html.push('  </div>');

            // Quick actions
            html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-8">');
            html.push('    <h2 class="font-extrabold text-gray-900 mb-4">Quick Actions</h2>');
            html.push('    <div class="flex flex-wrap gap-3">');
            html.push('      <a href="/admin/users" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">Manage Users</a>');
            html.push('      <a href="/admin/organizations" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">Organizations</a>');
            html.push('      <a href="/admin/events" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">Events</a>');
            html.push('      <a href="/admin/movies" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">Movies</a>');
            html.push('      <a href="/admin/turfs" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">Turfs</a>');
            html.push('      <a href="/admin/bookings" class="text-sm font-bold text-custom-dark bg-custom-dark/5 px-4 py-2 rounded-xl hover:bg-custom-dark hover:text-white transition">Bookings</a>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Admin Dashboard — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load dashboard', 'Please refresh.');
        }
    }

    // ── USERS ──────────────────────────────────────────────────

    async function renderAdminUsers() {
        if (!EMSAdminAuth.isLoggedIn()) { EMSRouter.navigate('/admin/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading users...');
        try {
            var result = await global.EMSApi.get('/admin/users', { authScope: 'admin' });
            var users = result.ok ? result.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Users</h1>');
            if (!users.length) {
                html.push(renderEmpty('No Users', 'No users found.'));
            } else {
                html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">');
                html.push('    <table class="w-full text-sm">');
                html.push('      <thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Name</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Email</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Status</th></tr></thead>');
                html.push('      <tbody class="divide-y divide-gray-100">');
                users.forEach(function(u) {
                    html.push('        <tr class="hover:bg-gray-50"><td class="px-6 py-4 font-bold text-gray-900">' + escapeHtml(u.name || u.username || '') + '</td><td class="px-6 py-4 text-gray-600 font-medium">' + escapeHtml(u.email || '') + '</td><td class="px-6 py-4">' + statusBadge(u.isActive !== false ? 'active' : 'inactive') + '</td></tr>');
                });
                html.push('      </tbody></table></div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Users — Admin';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load users', 'Please refresh.');
        }
    }

    // ── ORGANIZATIONS ──────────────────────────────────────────

    async function renderAdminOrganizations() {
        if (!EMSAdminAuth.isLoggedIn()) { EMSRouter.navigate('/admin/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading organizations...');
        try {
            var result = await global.EMSApi.get('/admin/organizations', { authScope: 'admin' });
            var orgs = result.ok ? result.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="flex items-center justify-between mb-8"><h1 class="text-3xl font-extrabold text-gray-900">Organizations</h1><button class="bg-custom-light text-white font-extrabold px-6 py-3 rounded-xl text-sm">Add Organization</button></div>');
            if (!orgs.length) {
                html.push(renderEmpty('No Organizations', 'No organizations found.'));
            } else {
                html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">');
                html.push('    <table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Name</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Type</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">City</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Status</th></tr></thead><tbody class="divide-y divide-gray-100">');
                orgs.forEach(function(o) {
                    html.push('      <tr class="hover:bg-gray-50"><td class="px-6 py-4 font-bold text-gray-900">' + escapeHtml(o.name || '') + '</td><td class="px-6 py-4 text-gray-600">' + escapeHtml(o.type || '') + '</td><td class="px-6 py-4 text-gray-600">' + escapeHtml(o.city || '') + '</td><td class="px-6 py-4">' + statusBadge(o.isActive ? 'active' : 'inactive') + '</td></tr>');
                });
                html.push('    </tbody></table></div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Organizations — Admin';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load organizations', 'Please refresh.');
        }
    }

    // ── GENERIC ADMIN PAGE BUILDER ────────────────────────────

    function renderAdminListPage(title, endpoint, columns) {
        if (!EMSAdminAuth.isLoggedIn()) { EMSRouter.navigate('/admin/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading ' + title.toLowerCase() + '...');
        global.EMSApi.get(endpoint, { authScope: 'admin' }).then(function(result) {
            var items = result.ok ? result.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <div class="flex items-center justify-between mb-8"><h1 class="text-3xl font-extrabold text-gray-900">' + title + '</h1><button class="bg-custom-light text-white font-extrabold px-6 py-3 rounded-xl text-sm">+ Add ' + title.replace(/s$/, '') + '</button></div>');
            if (!items.length) {
                html.push(renderEmpty('No ' + title, 'No ' + title.toLowerCase() + ' found.'));
            } else {
                html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">');
                html.push('    <table class="w-full text-sm">');
                html.push('      <thead class="bg-gray-50"><tr>');
                columns.forEach(function(col) {
                    html.push('        <th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">' + col.label + '</th>');
                });
                html.push('          <th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Actions</th>');
                html.push('        </tr></thead><tbody class="divide-y divide-gray-100">');
                items.forEach(function(item) {
                    html.push('        <tr class="hover:bg-gray-50">');
                    columns.forEach(function(col) {
                        var val = col.value(item);
                        html.push('          <td class="px-6 py-4 ' + (col.bold ? 'font-bold text-gray-900' : 'text-gray-600 font-medium') + '">' + val + '</td>');
                    });
                    html.push('          <td class="px-6 py-4"><button class="text-custom-light font-extrabold text-xs hover:underline">Edit</button></td>');
                    html.push('        </tr>');
                });
                html.push('      </tbody></table></div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = title + ' — Admin';
        }).catch(function() {
            main.innerHTML = renderEmpty('Unable to load ' + title.toLowerCase(), 'Please refresh.');
        });
    }

    // ── EVENT BOOKINGS (Admin) ─────────────────────────────────

    async function renderAdminBookings() {
        if (!EMSAdminAuth.isLoggedIn()) { EMSRouter.navigate('/admin/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading bookings...');
        try {
            var result = await global.EMSApi.get('/admin/bookings', { authScope: 'admin' });
            var bookings = result.ok ? result.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <h1 class="text-3xl font-extrabold text-gray-900 mb-8">All Bookings</h1>');
            if (!bookings.length) {
                html.push(renderEmpty('No Bookings', 'No bookings found.'));
            } else {
                html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">');
                html.push('    <table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Reference</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Customer</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Type</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Amount</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Status</th></tr></thead><tbody class="divide-y divide-gray-100">');
                bookings.forEach(function(b) {
                    html.push('      <tr class="hover:bg-gray-50"><td class="px-6 py-4 font-extrabold text-gray-900">#' + escapeHtml(b.reference || b.id || '') + '</td><td class="px-6 py-4 text-gray-600">' + escapeHtml(b.userEmail || b.userName || '') + '</td><td class="px-6 py-4 text-gray-600 capitalize">' + escapeHtml(b.type || '') + '</td><td class="px-6 py-4 font-bold">' + formatMoney(b.totalAmount || b.amount || 0) + '</td><td class="px-6 py-4">' + statusBadge(b.status) + '</td></tr>');
                });
                html.push('    </tbody></table></div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Bookings — Admin';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load bookings', 'Please refresh.');
        }
    }

    // ── REFUNDS ────────────────────────────────────────────────

    async function renderAdminRefunds() {
        if (!EMSAdminAuth.isLoggedIn()) { EMSRouter.navigate('/admin/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading refunds...');
        try {
            var result = await global.EMSApi.get('/admin/refunds', { authScope: 'admin' });
            var refunds = result.ok ? result.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
            html.push('  <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Refunds</h1>');
            if (!refunds.length) {
                html.push(renderEmpty('No Refunds', 'No refunds found.'));
            } else {
                html.push('  <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">');
                html.push('    <table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">ID</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Amount</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Status</th><th class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase">Date</th></tr></thead><tbody class="divide-y divide-gray-100">');
                refunds.forEach(function(r) {
                    html.push('      <tr class="hover:bg-gray-50"><td class="px-6 py-4 font-extrabold text-gray-900">#' + escapeHtml(r.id || '') + '</td><td class="px-6 py-4 font-bold">' + formatMoney(r.amount || 0) + '</td><td class="px-6 py-4">' + statusBadge(r.status) + '</td><td class="px-6 py-4 text-gray-500">' + escapeHtml(r.createdAt || '') + '</td></tr>');
                });
                html.push('    </tbody></table></div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Refunds — Admin';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load refunds', 'Please refresh.');
        }
    }

    // ── BANNERS ────────────────────────────────────────────────

    async function renderAdminBanners() {
        renderAdminListPage('Banners', '/admin/banners', [
            { label: 'Title', value: function(b) { return escapeHtml(b.title || ''); }, bold: true },
            { label: 'Type', value: function(b) { return escapeHtml(b.type || ''); } },
            { label: 'Position', value: function(b) { return escapeHtml(b.position || ''); } },
            { label: 'Status', value: function(b) { return statusBadge(b.isActive ? 'active' : 'inactive'); }, bold: false },
        ]);
    }

    // ── MEDIA ──────────────────────────────────────────────────

    async function renderAdminMedia() {
        renderAdminListPage('Media', '/admin/media', [
            { label: 'Filename', value: function(m) { return escapeHtml(m.filename || ''); }, bold: true },
            { label: 'Type', value: function(m) { return escapeHtml(m.type || ''); } },
            { label: 'Size', value: function(m) { return (m.size || 0) > 1024 ? Math.round(m.size / 1024) + ' KB' : m.size + ' B'; } },
            { label: 'Uploaded', value: function(m) { return escapeHtml(m.createdAt || ''); } },
        ]);
    }

    // ── AUDIT LOGS ─────────────────────────────────────────────

    async function renderAdminAuditLogs() {
        renderAdminListPage('Audit Logs', '/admin/audit-logs', [
            { label: 'Action', value: function(l) { return escapeHtml(l.action || ''); }, bold: true },
            { label: 'Entity', value: function(l) { return escapeHtml(l.entityType || '') + ' #' + escapeHtml(l.entityId || ''); } },
            { label: 'Actor', value: function(l) { return escapeHtml(l.actor && l.actor.name ? l.actor.name : ''); } },
            { label: 'Date', value: function(l) { return escapeHtml(l.createdAt || ''); } },
        ]);
    }

    // ── ROUTE REGISTRATION ─────────────────────────────────────

    function registerRoutes() {
        if (typeof global.EMSRouter === 'undefined') return;
        global.EMSRouter.get('/admin/dashboard', renderAdminDashboard);
        global.EMSRouter.get('/admin/users', renderAdminUsers);
        global.EMSRouter.get('/admin/organizations', renderAdminOrganizations);
        global.EMSRouter.get('/admin/events', function() {
            renderAdminListPage('Events', '/admin/events', [
                { label: 'Title', value: function(e) { return escapeHtml(e.title || ''); }, bold: true },
                { label: 'Category', value: function(e) { return escapeHtml(e.category || ''); } },
                { label: 'City', value: function(e) { return escapeHtml(e.city || ''); } },
                { label: 'Status', value: function(e) { return statusBadge(e.status); } },
                { label: 'Date', value: function(e) { return escapeHtml(e.eventDate || ''); } },
            ]);
        });
        global.EMSRouter.get('/admin/movies', function() {
            renderAdminListPage('Movies', '/admin/movies', [
                { label: 'Title', value: function(m) { return escapeHtml(m.title || ''); }, bold: true },
                { label: 'Genre', value: function(m) { return escapeHtml(m.genre || ''); } },
                { label: 'Language', value: function(m) { return escapeHtml(m.language || ''); } },
                { label: 'Status', value: function(m) { return statusBadge(m.status); } },
            ]);
        });
        global.EMSRouter.get('/admin/turfs', function() {
            renderAdminListPage('Turfs', '/admin/turfs', [
                { label: 'Name', value: function(t) { return escapeHtml(t.name || ''); }, bold: true },
                { label: 'City', value: function(t) { return escapeHtml(t.city || ''); } },
                { label: 'Address', value: function(t) { return escapeHtml(t.address || ''); } },
                { label: 'Status', value: function(t) { return statusBadge(t.status); } },
            ]);
        });
        global.EMSRouter.get('/admin/cinemas', function() {
            renderAdminListPage('Cinemas', '/admin/cinemas', [
                { label: 'Name', value: function(c) { return escapeHtml(c.name || ''); }, bold: true },
                { label: 'City', value: function(c) { return escapeHtml(c.city || ''); } },
                { label: 'Screens', value: function(c) { return c.screenCount || 0; } },
                { label: 'Status', value: function(c) { return statusBadge(c.isActive ? 'active' : 'inactive'); } },
            ]);
        });
        global.EMSRouter.get('/admin/screens', function() {
            renderAdminListPage('Screens', '/admin/screens', [
                { label: 'Name', value: function(s) { return escapeHtml(s.name || ''); }, bold: true },
                { label: 'Cinema', value: function(s) { return escapeHtml(s.cinemaName || ''); } },
                { label: 'Capacity', value: function(s) { return s.totalSeats || 0; } },
                { label: 'Status', value: function(s) { return statusBadge(s.isActive ? 'active' : 'inactive'); } },
            ]);
        });
        global.EMSRouter.get('/admin/showtimes', function() {
            renderAdminListPage('Showtimes', '/admin/showtimes', [
                { label: 'Movie', value: function(s) { return escapeHtml(s.movieTitle || ''); }, bold: true },
                { label: 'Cinema', value: function(s) { return escapeHtml(s.cinemaName || ''); } },
                { label: 'Date', value: function(s) { return escapeHtml(s.showDate || ''); } },
                { label: 'Time', value: function(s) { return escapeHtml(s.showTime || ''); } },
            ]);
        });
        global.EMSRouter.get('/admin/bookings', renderAdminBookings);
        global.EMSRouter.get('/admin/refunds', renderAdminRefunds);
        global.EMSRouter.get('/admin/banners', renderAdminBanners);
        global.EMSRouter.get('/admin/media', renderAdminMedia);
        global.EMSRouter.get('/admin/audit-logs', renderAdminAuditLogs);
    }

    global.EMSAdminPages = Object.freeze({
        renderAdminDashboard: renderAdminDashboard,
        registerRoutes: registerRoutes,
    });

})(window);
