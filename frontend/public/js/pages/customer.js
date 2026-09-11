/**
 * EntryMySlot - Customer Pages Controllers
 * Handles rendering for home, movies, events, turfs, booking, profile, etc.
 */

(function (global) {
    'use strict';

    var CFG = global.EMS_CONFIG;
    var _selectedMovie = null;
    var _selectedTurf = null;
    var _selectedEvent = null;
    var _bookingState = {};

    // renderLoading, showToast, escapeHtml, statusBadge, renderEmpty are provided by global.Components

    // ── Helpers ────────────────────────────────────────────────

    function setBookingState(key, val) { _bookingState[key] = val; }
    function getBookingState(key) { return _bookingState[key]; }
    function clearBookingState() { _bookingState = {}; }

    function starRating(rating) {
        if (!rating) return '';
        var r = Math.round(rating);
        var html = '';
        for (var i = 0; i < 5; i++) {
            if (i < r) html += '<i class="fa-solid fa-star text-yellow-400"></i>';
            else html += '<i class="fa-regular fa-star text-gray-300"></i>';
        }
        return html;
    }

    // ── HOME PAGE ──────────────────────────────────────────────

    async function renderHome(params) {
        var city = (params && params.city) || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Discovering events, movies & turfs near you...');

        try {
            var results = await Promise.allSettled([
                global.EMSTurfApi.getFeatured(),
                global.EMSEventApi.getFeatured(),
                global.EMSMovieApi.getFeatured(),
            ]);

            var turfs = (results[0].status === 'fulfilled' && results[0].value && results[0].value.success) ? results[0].value.data : [];
            var events = (results[1].status === 'fulfilled' && results[1].value && results[1].value.success) ? results[1].value.data : [];
            var movies = (results[2].status === 'fulfilled' && results[2].value && results[2].value.success) ? results[2].value.data : [];

            var html = [];

            // Hero Banner
            html.push('<div class="relative overflow-hidden rounded-none sm:rounded-[32px] m-0 sm:m-4 lg:m-8 shadow-2xl">');
            html.push('  <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1400&h=600&fit=crop" alt="Hero" class="w-full h-[300px] sm:h-[450px] object-cover">');
            html.push('  <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>');
            html.push('  <div class="absolute inset-0 flex items-center px-4 sm:px-8 lg:px-16 py-8">');
            html.push('    <div class="max-w-2xl">');
            html.push('      <div class="flex items-center gap-2 mb-4"><span class="bg-custom-light text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Sports Booking</span></div>');
            html.push('      <h1 class="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4">Book Your<br>Favorite <span class="text-custom-light">Turf</span></h1>');
            html.push('      <p class="text-gray-300 text-sm sm:text-lg font-medium mb-6 sm:mb-8 max-w-md">Find and book the best sports venues near you. From cricket to football — all in one place.</p>');
            html.push('      <a href="/explore/home' + (city ? '/' + citySlug(city) : '') + '" class="inline-flex items-center bg-custom-light text-white font-extrabold px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow text-sm sm:text-base">Explore Turfs <i class="fa-solid fa-arrow-right ml-2"></i></a>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');

            // Featured Turfs
            if (turfs.length > 0) {
                html.push('<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
                html.push('  <div class="flex items-center justify-between mb-8">');
                html.push('    <div><h2 class="text-2xl font-extrabold text-gray-900">Featured Turfs</h2><p class="text-sm text-gray-500 font-medium mt-1">Top rated sports venues</p></div>');
                html.push('    <a href="/explore/home/' + citySlug(city || 'Coimbatore') + '" class="text-custom-light font-extrabold text-sm hover:underline">View All <i class="fa-solid fa-arrow-right ml-1"></i></a>');
                html.push('  </div>');
                html.push('  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">');
                turfs.forEach(function(turf) {
                    html.push('    <a href="/explore/turf/' + citySlug(city || 'Coimbatore') + '/' + turf.id + '" class="card-zoom group block bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-xl transition-all">');
                    html.push('      <div class="relative h-48 overflow-hidden">');
                    html.push('        <img src="' + (turf.images && turf.images[0] || '/assets/images/turf-placeholder.jpg') + '" class="card-zoom-image w-full h-full object-cover">');
                    html.push('        <div class="absolute top-3 left-3"><span class="bg-custom-dark/80 backdrop-blur text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">' + escapeHtml(turf.sport || 'Turf') + '</span></div>');
                    html.push('        <div class="absolute top-3 right-3 flex items-center bg-white/90 backdrop-blur px-2 py-1 rounded-full"><i class="fa-solid fa-star text-yellow-400 text-xs mr-1"></i><span class="text-xs font-extrabold">' + (turf.rating || '4.0') + '</span></div>');
                    html.push('      </div>');
                    html.push('      <div class="p-5">');
                    html.push('        <h3 class="font-extrabold text-gray-900 text-base mb-1 group-hover:text-custom-light transition">' + escapeHtml(turf.name) + '</h3>');
                    html.push('        <p class="text-sm text-gray-500 font-medium mb-3 flex items-center gap-1"><i class="fa-solid fa-location-dot text-custom-light"></i>' + escapeHtml(turf.city || turf.address || '') + '</p>');
                    html.push('        <div class="flex items-center justify-between pt-3 border-t border-gray-50">');
                    html.push('          <div><span class="text-lg font-extrabold text-custom-dark">' + formatMoney(turf.pricePerHour || 0) + '</span><span class="text-xs text-gray-500 font-medium"> /hour</span></div>');
                    html.push('          <span class="text-custom-light text-xs font-extrabold">Book <i class="fa-solid fa-arrow-right ml-1"></i></span>');
                    html.push('        </div>');
                    html.push('      </div>');
                    html.push('    </a>');
                });
                html.push('  </div>');
                html.push('</section>');
            }

            // Featured Events
            if (events.length > 0) {
                html.push('<section class="bg-white py-12 border-y border-gray-100">');
                html.push('  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">');
                html.push('    <div class="flex items-center justify-between mb-8">');
                html.push('      <div><h2 class="text-2xl font-extrabold text-gray-900">Upcoming Events</h2><p class="text-sm text-gray-500 font-medium mt-1">Concerts, shows & experiences</p></div>');
                html.push('      <a href="/explore/events/' + citySlug(city || 'Coimbatore') + '" class="text-custom-light font-extrabold text-sm hover:underline">View All <i class="fa-solid fa-arrow-right ml-1"></i></a>');
                html.push('    </div>');
                html.push('    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">');
                events.forEach(function(ev) {
                    html.push('      <a href="/explore/event/' + citySlug(city || 'Coimbatore') + '/' + ev.id + '" class="card-zoom group block bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-xl transition-all">');
                    html.push('        <div class="relative h-52 overflow-hidden">');
                    html.push('          <img src="' + (ev.imageUrl || '/assets/images/event-placeholder.jpg') + '" class="card-zoom-image w-full h-full object-cover">');
                    html.push('          <div class="absolute top-3 left-3"><span class="bg-custom-dark/80 backdrop-blur text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">' + escapeHtml(ev.category || 'Event') + '</span></div>');
                    html.push('        </div>');
                    html.push('        <div class="p-5">');
                    html.push('          <h3 class="font-extrabold text-gray-900 text-base mb-1 group-hover:text-custom-light transition">' + escapeHtml(ev.title) + '</h3>');
                    html.push('          <p class="text-sm text-gray-500 font-medium mb-2 flex items-center gap-1"><i class="fa-regular fa-calendar text-custom-light"></i> ' + escapeHtml(ev.eventDate || '') + '</p>');
                    html.push('          <p class="text-sm text-gray-500 font-medium mb-3 flex items-center gap-1"><i class="fa-solid fa-location-dot text-custom-light"></i> ' + escapeHtml(ev.venue || ev.city || '') + '</p>');
                    html.push('          <div class="flex items-center justify-between pt-3 border-t border-gray-50">');
                    html.push('            <span class="text-lg font-extrabold text-custom-dark">' + formatMoney(ev.price) + '</span>');
                    html.push('            <span class="text-custom-light text-xs font-extrabold">View <i class="fa-solid fa-arrow-right ml-1"></i></span>');
                    html.push('          </div>');
                    html.push('        </div>');
                    html.push('      </a>');
                });
                html.push('    </div>');
                html.push('  </div>');
                html.push('</section>');
            }

            // Now Showing Movies
            if (movies.length > 0) {
                html.push('<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
                html.push('  <div class="flex items-center justify-between mb-8">');
                html.push('    <div><h2 class="text-2xl font-extrabold text-gray-900">Now Showing</h2><p class="text-sm text-gray-500 font-medium mt-1">Catch the latest movies</p></div>');
                html.push('    <a href="/explore/movies/' + citySlug(city || 'Coimbatore') + '" class="text-custom-light font-extrabold text-sm hover:underline">View All <i class="fa-solid fa-arrow-right ml-1"></i></a>');
                html.push('  </div>');
                html.push('  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">');
                movies.forEach(function(movie) {
                    html.push('    <a href="/explore/movie/' + citySlug(city || 'Coimbatore') + '/' + movie.id + '" class="group block">');
                    html.push('      <div class="relative rounded-2xl overflow-hidden mb-3 shadow-soft hover:shadow-xl transition-all">');
                    html.push('        <img src="' + (movie.posterUrl || '/assets/images/movie-placeholder.jpg') + '" alt="' + escapeHtml(movie.title) + '" class="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500">');
                    html.push('        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4"><span class="bg-white text-custom-dark text-[10px] font-extrabold px-3 py-1.5 rounded-full">Book Tickets</span></div>');
                    html.push('      </div>');
                    html.push('      <h3 class="font-extrabold text-gray-900 text-sm truncate">' + escapeHtml(movie.title) + '</h3>');
                    html.push('      <p class="text-xs text-gray-500 font-medium">' + escapeHtml(movie.genre || '') + ' ' + (movie.language ? '<span class="text-gray-300 mx-1">|</span>' + escapeHtml(movie.language) : '') + '</p>');
                    html.push('    </a>');
                });
                html.push('  </div>');
                html.push('</section>');
            }

            // CTA Section
            html.push('<section class="bg-custom-dark py-16">');
            html.push('  <div class="max-w-4xl mx-auto px-4 text-center">');
            html.push('    <h2 class="text-3xl font-extrabold text-white mb-4">Want to list your venue?</h2>');
            html.push('    <p class="text-gray-300 mb-8 font-medium">Join thousands of venues on EntryMySlot and reach more customers.</p>');
            html.push('    <a href="/partner/register" class="inline-block bg-custom-light text-white font-extrabold px-10 py-4 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Partner With Us <i class="fa-solid fa-arrow-right ml-2"></i></a>');
            html.push('  </div>');
            html.push('</section>');

            main.innerHTML = html.join('');
            document.title = 'EntryMySlot — Book Sports Venues, Events & Movies';

        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load', 'Something went wrong. Please try again later.', '/explore/home');
        }
    }

    // ── MOVIES LISTING ─────────────────────────────────────────

    async function renderMovies(params) {
        var city = (params && params.city) || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Finding movies near you...');
        try {
            var result = await global.EMSMovieApi.list();
            var movies = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <div class="mb-10">');
            html.push('    <h1 class="text-4xl font-extrabold text-gray-900">Movies</h1>');
            html.push('    <p class="text-gray-500 mt-2 font-medium">Browse and book movie tickets</p>');
            html.push('  </div>');

            if (!movies.length) {
                html.push(renderEmpty('No Movies Yet', 'No movies are currently listed.'));
            } else {
                html.push('  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">');
                movies.forEach(function(movie) {
                    html.push('    <a href="/explore/movie/' + citySlug(city || 'Coimbatore') + '/' + movie.id + '" class="group block">');
                    html.push('      <div class="relative rounded-2xl overflow-hidden mb-3 shadow-soft hover:shadow-xl transition-all">');
                    html.push('        <img src="' + (movie.posterUrl || '/assets/images/movie-placeholder.jpg') + '" alt="' + escapeHtml(movie.title) + '" class="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500">');
                    html.push('      </div>');
                    html.push('      <h3 class="font-extrabold text-gray-900 text-sm truncate">' + escapeHtml(movie.title) + '</h3>');
                    html.push('      <p class="text-xs text-gray-500 font-medium">' + escapeHtml(movie.language || '') + ' ' + (movie.genre ? '<span class="text-gray-300 mx-1">|</span>' + escapeHtml(movie.genre) : '') + '</p>');
                    html.push('    </a>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Movies — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load', 'Please try again later.');
        }
    }

    // ── MOVIE DETAIL ───────────────────────────────────────────

    async function renderMovieDetail(params) {
        var movieId = params.id;
        var city = params.city || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading movie details...');
        try {
            var movieResult = await global.EMSMovieApi.get(movieId);
            if (!movieResult.ok || !movieResult.data || !movieResult.data.success) {
                main.innerHTML = renderEmpty('Movie Not Found', 'This movie could not be found.', '/explore/movies');
                return;
            }
            var movie = movieResult.data.data;
            _selectedMovie = movie;

            // Find cinemas for this movie
            var cinemasResult = await global.EMSMovieApi.searchCinemas(movieId);
            var cinemas = (cinemasResult.ok && cinemasResult.data && cinemasResult.data.success) ? cinemasResult.data.data : [];

            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <a href="/explore/movies/' + citySlug(city || 'Coimbatore') + '" class="inline-flex items-center text-sm font-bold text-gray-500 hover:text-custom-dark transition mb-6"><i class="fa-solid fa-arrow-left mr-2"></i> Back to Movies</a>');
            html.push('  <div class="flex flex-col md:flex-row gap-8 lg:gap-12 mb-12">');
            html.push('    <div class="w-full md:w-64 flex-shrink-0 mx-auto md:mx-0">');
            html.push('      <img src="' + (movie.posterUrl || '/assets/images/movie-placeholder.jpg') + '" alt="' + escapeHtml(movie.title) + '" class="w-full aspect-[2/3] object-cover rounded-3xl shadow-2xl">');
            html.push('    </div>');
            html.push('    <div class="flex-1">');
            html.push('      <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">' + escapeHtml(movie.title) + '</h1>');
            html.push('      <div class="flex flex-wrap items-center gap-3 mb-4">');
            html.push('        <span class="text-sm font-bold text-gray-600">' + escapeHtml(movie.language || '') + '</span>');
            if (movie.genre) html.push('          <span class="text-gray-300">|</span><span class="text-sm font-bold text-gray-600">' + escapeHtml(movie.genre) + '</span>');
            if (movie.duration) html.push('          <span class="text-gray-300">|</span><span class="text-sm font-bold text-gray-600">' + escapeHtml(movie.duration) + '</span>');
            if (movie.rating) html.push('          <span class="text-gray-300">|</span><span class="text-sm font-bold text-custom-light">' + escapeHtml(movie.rating) + '/5</span>');
            html.push('      </div>');
            if (movie.description) html.push('      <p class="text-gray-600 font-medium leading-relaxed mb-6">' + escapeHtml(movie.description) + '</p>');
            html.push('      <div class="flex flex-wrap gap-4">');
            if (movie.trailerUrl) html.push('        <a href="' + escapeHtml(movie.trailerUrl) + '" target="_blank" class="inline-flex items-center bg-gray-900 text-white font-extrabold px-6 py-3 rounded-xl hover:bg-gray-800 transition"><i class="fa-solid fa-play mr-2"></i> Watch Trailer</a>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('  </div>');

            // Showtimes
            html.push('  <div class="border-t border-gray-100 pt-10">');
            html.push('    <h2 class="text-2xl font-extrabold text-gray-900 mb-6">Select Cinema</h2>');

            if (!cinemas.length) {
                html.push('<p class="text-gray-500 text-center py-8 font-medium">No showtimes available currently.</p>');
            } else {
                // Group cinemas by name
                var cinemaMap = {};
                cinemas.forEach(function(sc) {
                    var key = sc.cinemaName + '|' + sc.cinemaCity;
                    if (!cinemaMap[key]) cinemaMap[key] = { name: sc.cinemaName, city: sc.cinemaCity, id: sc.cinemaId, showtimes: [] };
                    cinemaMap[key].showtimes.push(sc);
                });
                Object.keys(cinemaMap).forEach(function(key) {
                    var cin = cinemaMap[key];
                    html.push('    <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 mb-4">');
                    html.push('      <div class="flex items-center gap-2 mb-4"><i class="fa-solid fa-building-columns text-custom-light text-lg"></i>');
                    html.push('        <div><h3 class="font-extrabold text-gray-900">' + escapeHtml(cin.name) + '</h3><p class="text-xs text-gray-500 font-medium">' + escapeHtml(cin.city || '') + '</p></div></div>');
                    // Showtimes
                    var byDate = {};
                    cin.showtimes.forEach(function(st) {
                        if (!byDate[st.showDate]) byDate[st.showDate] = [];
                        byDate[st.showDate].push(st);
                    });
                    Object.keys(byDate).forEach(function(date) {
                        html.push('        <div class="mb-4"><p class="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">' + formatDate(date) + '</p><div class="flex flex-wrap gap-3">');
                        byDate[date].forEach(function(st) {
                            html.push('          <button onclick="renderShowtimeSeats(\'' + st.id + '\', \'' + movieId + '\', \'' + city + '\')" class="px-4 py-2.5 border-2 border-gray-100 rounded-xl hover:border-custom-light hover:text-custom-light font-bold text-sm transition">' + escapeHtml(st.showTime) + ' <span class="text-gray-400 font-medium ml-1">' + escapeHtml(st.language || '') + ' ' + escapeHtml(st.format || '') + '</span></button>');
                        });
                        html.push('        </div></div>');
                    });
                    html.push('    </div>');
                });
            }
            html.push('  </div>');
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = escapeHtml(movie.title) + ' — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Movie Not Found', 'This movie could not be found.', '/explore/movies');
        }
    }

    // ── SHOWTIME / SEATS ───────────────────────────────────────

    async function renderShowtimeSeats(showtimeId, movieId, city) {
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading seat selection...');
        try {
            var result = await global.EMSMovieApi.getSeatLayout(showtimeId);
            if (!result.ok || !result.data || !result.data.success) {
                showToast('Unable to load seats.', 'error');
                return;
            }
            var layout = result.data.data;
            var rows = layout.rows || [];
            var selected = [];
            var total = 0;

            function render() {
                var btnId = 'confirmSeatsBtn';
                var html = [];
                html.push('<div class="max-w-5xl mx-auto px-4 py-8">');
                html.push('  <a href="/explore/movie/' + (city || citySlug('Coimbatore')) + '/' + movieId + '" class="inline-flex items-center text-sm font-bold text-gray-500 hover:text-custom-dark transition mb-4"><i class="fa-solid fa-arrow-left mr-2"></i> Back to Movies</a>');
                html.push('  <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-10">');
                html.push('    <div class="text-center mb-8">');
                html.push('      <div class="w-full max-w-md mx-auto h-8 bg-custom-dark/10 rounded-t-[3rem] mb-4 border-2 border-custom-dark/20 border-b-0"></div>');
                html.push('      <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">SCREEN</p>');
                html.push('    </div>');

                // Legend
                html.push('    <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-8 text-xs font-bold">');
                html.push('      <span class="flex items-center gap-2"><span class="w-5 h-5 rounded bg-gray-200 border-2 border-gray-300"></span> Available</span>');
                html.push('      <span class="flex items-center gap-2"><span class="w-5 h-5 rounded bg-custom-light border-2 border-custom-light text-white text-[8px] flex items-center justify-center">S</span> Selected</span>');
                html.push('      <span class="flex items-center gap-2"><span class="w-5 h-5 rounded bg-gray-100 border-2 border-gray-200"></span> Sold</span>');
                html.push('      <span class="flex items-center gap-2"><span class="w-5 h-5 rounded bg-purple-100 border-2 border-purple-300 text-purple-600 text-[8px] flex items-center justify-center font-extrabold">VIP</span> Premium</span>');
                html.push('    </div>');

                // Seat grid
                html.push('    <div class="max-w-md mx-auto" id="seatGrid">');
                rows.forEach(function(row) {
                    html.push('      <div class="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">');
                    html.push('        <span class="w-4 sm:w-6 text-[10px] font-extrabold text-gray-400 text-center">' + escapeHtml(row.label || '') + '</span>');
                    (row.seats || []).forEach(function(seat) {
                        var cls = 'w-6 h-6 sm:w-8 sm:h-8 rounded text-[8px] sm:text-xs font-bold cursor-pointer transition-all border-2 flex items-center justify-center ';
                        if (seat.status === 'occupied' || seat.status === 'booked') {
                            cls += 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
                        } else if (seat.type === 'vip' || seat.type === 'premium') {
                            cls += 'bg-purple-50 border-purple-300 text-purple-600 hover:bg-purple-100';
                        } else {
                            cls += 'bg-white border-gray-200 text-gray-600 hover:border-custom-light hover:text-custom-light';
                        }
                        if (seat.status === 'available' || seat.status === 'held') {
                            html.push('        <button class="' + cls + '" data-row="' + escapeHtml(row.label || '') + '" data-num="' + seat.number + '" data-price="' + seat.price + '" data-type="' + seat.type + '" onclick="toggleSeat(this, \'' + escapeHtml(row.label || '') + '\', ' + seat.number + ', ' + seat.price + ', \'' + seat.type + '\')">' + seat.number + '</button>');
                        } else {
                            html.push('        <span class="' + cls + '">' + seat.number + '</span>');
                        }
                    });
                    html.push('      </div>');
                });
                html.push('    </div>');

                // Legend + confirm
                html.push('    <div class="mt-8 pt-6 border-t border-gray-100">');
                html.push('      <div class="flex flex-wrap items-center justify-between gap-4">');
                html.push('        <div class="text-sm"><span class="font-bold text-gray-500">Selected: </span><span id="selectedSeatsDisplay" class="font-extrabold text-gray-900">None</span></div>');
                html.push('        <div class="text-right"><p class="text-xs text-gray-500 font-medium">Total</p><p id="totalPriceDisplay" class="text-2xl font-extrabold text-gray-900">' + formatMoney(0) + '</p></div>');
                html.push('      </div>');
                html.push('      <button id="' + btnId + '" onclick="confirmMovieBooking(\'' + showtimeId + '\', \'' + movieId + '\')" class="w-full mt-4 bg-custom-dark text-white font-extrabold py-4 rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed" disabled>Confirm Booking</button>');
                html.push('    </div>');
                html.push('  </div>');
                html.push('</div>');
                main.innerHTML = html.join('');
                window._selectedSeats = selected;
            }

            window.toggleSeat = function(el, row, num, price, type) {
                var idx = selected.indexOf(num);
                if (idx > -1) { selected.splice(idx, 1); el.classList.remove('bg-custom-light', 'text-white', 'border-custom-light'); if (type === 'vip' || type === 'premium') { el.classList.add('bg-purple-50', 'border-purple-300', 'text-purple-600'); } else { el.classList.add('bg-white', 'border-gray-200', 'text-gray-600'); } }
                else {
                    selected.push(num);
                    el.classList.remove('bg-white', 'bg-purple-50', 'border-gray-200', 'border-purple-300', 'text-gray-600', 'text-purple-600');
                    el.classList.add('bg-custom-light', 'text-white', 'border-custom-light');
                }
                var seatList = selected.length > 0 ? selected.join(', ') : 'None';
                var display = document.getElementById('selectedSeatsDisplay');
                var priceDisplay = document.getElementById('totalPriceDisplay');
                var btn = document.getElementById('confirmSeatsBtn');
                if (display) display.textContent = seatList;
                if (priceDisplay) priceDisplay.textContent = formatMoney(selected.length * price);
                if (btn) btn.disabled = selected.length === 0;
            };

            window.confirmMovieBooking = function(stId, movId) {
                if (selected.length === 0) return;
                var seats = window._selectedSeats || [];
                renderMovieBooking(stId, movId, seats);
            };

            render();
            document.title = 'Select Seats — EntryMySlot';

        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load seats', 'Please try again later.');
        }
    }

    // ── MOVIE BOOKING ──────────────────────────────────────────

    async function renderMovieBooking(showtimeId, movieId) {
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Preparing your booking...');
        try {
            var user = EMSAuth.getUser();
            if (!user) {
                EMSRouter.navigate('/login');
                return;
            }
            var seatResult = await global.EMSMovieApi.getSeatLayout(showtimeId);
            if (!seatResult.ok) { showToast('Unable to load booking details.', 'error'); return; }
            var seatLayout = (seatResult.data && seatResult.data.data) || {};
            var seats = window._selectedSeats || [];
            var seatPrices = {};
            if (seatLayout.rows) {
                seatLayout.rows.forEach(function(row) {
                    (row.seats || []).forEach(function(seat) {
                        seatPrices[seat.number] = seat.price || 0;
                    });
                });
            }
            var total = 0;
            seats.forEach(function(s) { total += seatPrices[s] || 0; });

            var html = [];
            html.push('<div class="max-w-5xl mx-auto px-4 py-8">');
            html.push('  <h1 class="text-2xl font-extrabold text-gray-900 mb-8">Confirm Booking</h1>');
            html.push('  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">');
            html.push('    <div class="lg:col-span-2 space-y-6">');
            html.push('      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">');
            html.push('        <h2 class="font-extrabold text-gray-900 mb-4 text-lg">Contact Details</h2>');
            html.push('        <div class="space-y-4">');
            html.push('          <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Name</label><input type="text" id="bookingContactName" value="' + escapeHtml(user.username || user.name || '') + '" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('          <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Email</label><input type="email" value="' + escapeHtml(user.email || '') + '" disabled class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 cursor-not-allowed"></div>');
            html.push('          <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Phone</label><input type="tel" id="bookingContactPhone" placeholder="+91 98765 43210" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        </div>');
            html.push('      </div>');
            html.push('      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">');
            html.push('        <h2 class="font-extrabold text-gray-900 mb-4 text-lg">Payment Method</h2>');
            html.push('        <div class="space-y-3">');
            html.push('          <label class="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl cursor-pointer hover:border-custom-light transition has-[:checked]:border-custom-light has-[:checked]:bg-orange-50/50">');
            html.push('            <input type="radio" name="paymentMethod" value="online" checked class="accent-[#FA580B]"><div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><i class="fa-solid fa-globe text-gray-700"></i></div><div class="flex-1"><p class="font-extrabold text-sm">Pay Online</p><p class="text-xs text-gray-500">UPI, Cards, Net Banking</p></div>');
            html.push('          </label>');
            html.push('          <label class="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl cursor-pointer hover:border-custom-light transition has-[:checked]:border-custom-light has-[:checked]:bg-orange-50/50">');
            html.push('            <input type="radio" name="paymentMethod" value="wallet" class="accent-[#FA580B]"><div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><i class="fa-solid fa-wallet text-gray-700"></i></div><div class="flex-1"><p class="font-extrabold text-sm">Pay at Venue</p><p class="text-xs text-gray-500">Pay when you arrive</p></div>');
            html.push('          </label>');
            html.push('        </div>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('    <div>');
            html.push('      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sticky top-24">');
            html.push('        <h3 class="font-extrabold text-gray-900 mb-4">Booking Summary</h3>');
            html.push('        <div class="space-y-2 text-sm mb-4">');
            html.push('          <div class="flex justify-between"><span class="text-gray-500 font-medium">Seats</span><span class="font-bold">' + seats.length + ' x </span></div>');
            html.push('          <div class="flex justify-between"><span class="text-gray-500 font-medium">Total</span><span class="font-extrabold text-custom-dark">' + formatMoney(total) + '</span></div>');
            html.push('        </div>');
            html.push('        <button onclick="processBooking(\'movie\', ' + showtimeId + ', ' + movieId + ')" class="w-full bg-custom-light text-white font-extrabold py-4 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Pay & Book</button>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Confirm Booking — EntryMySlot';

        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load booking', 'Please try again.');
        }
    }

    async function processBooking(type, resourceId, movieId) {
        var name = document.getElementById('bookingContactName')?.value.trim();
        var phone = document.getElementById('bookingContactPhone')?.value.trim();
        if (!name || !phone) { showToast('Please fill in contact details.', 'error'); return; }

        var btn = document.querySelector('[onclick*="processBooking"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...'; }

        try {
            // ── Step 1: Hold seats ──
            var seats = window._selectedSeats || [];
            var holdResult = await global.EMSMovieApi.holdSeats(resourceId, seats);
            if (!holdResult.ok || !holdResult.data || !holdResult.data.success) {
                showToast((holdResult.data && holdResult.data.message) || 'Could not hold seats. They may have just been booked.', 'error');
                if (btn) { btn.disabled = false; btn.innerHTML = 'Pay & Book'; }
                return;
            }
            var holdData = holdResult.data.data;
            var holdKey = holdData.holdKey || holdData.id;
            var expiresAt = holdData.expiresAt || (Date.now() + (CFG.seatHoldDurationMs || 300000));

            // ── Step 2: Create booking with holdKey ──
            var payload = {
                holdKey: holdKey,
                contactName: name,
                contactPhone: phone,
                paymentMethod: 'online',
            };

            var result = await global.EMSMovieApi.createBooking(payload);
            if (result.ok && result.data && result.data.success) {
                window._selectedSeats = [];
                var ref = result.data.data.reference || result.data.data.id;
                EMSRouter.navigate('/account/booking/' + ref);
            } else {
                // Release held seats on failure
                global.EMSMovieApi.releaseSeats(holdKey);
                var msg = (result.data && result.data.message) || 'Booking failed.';
                if (result.data && result.data.error === 'SEATS_EXPIRED') {
                    msg = 'Seats were just taken. Please select different seats.';
                }
                showToast(msg, 'error');
                if (btn) { btn.disabled = false; btn.innerHTML = 'Pay & Book'; }
            }
        } catch (e) {
            showToast('Booking failed. Please try again.', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = 'Pay & Book'; }
        }
    }

    // ── BOOKING CONFIRMATION ───────────────────────────────────

    async function renderBookingConfirmation(params) {
        var bookingId = params.ref || params.id;
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading booking...');

        // Always fetch fresh booking data from API — localStorage may be stale
        var result = await EMSBookingApi.get(bookingId);
        if (!result.ok || !result.data || !result.data.success) {
            // Fallback to localStorage
            var saved = localStorage.getItem('ems_last_booking');
            if (!saved) {
                main.innerHTML = renderEmpty('Booking Not Found', 'No booking found with this reference.', '/account/bookings');
                return;
            }
            result = { data: JSON.parse(saved), ok: true };
        }

        var booking = result.data.data || result.data;
        var status = (booking.status || '').toLowerCase();
        var isPaid = status === 'booking_confirmed' || status === 'confirmed' || status === 'completed';
        var isPending = status === 'payment_pending' || status === 'awaiting_payment' || status === 'pending';
        var isFailed = status === 'payment_failed' || status === 'failed' || status === 'cancelled';

        var html = [];
        html.push('<div class="max-w-2xl mx-auto px-4 py-8 sm:py-12">');
        html.push('  <div class="bg-white rounded-[32px] shadow-2xl overflow-hidden">');

        // Header — state-aware
        if (isFailed) {
            html.push('    <div class="bg-red-600 text-white text-center py-10 relative">');
            html.push('      <div class="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20"><i class="fa-solid fa-xmark text-4xl"></i></div>');
            html.push('      <h1 class="text-3xl font-extrabold mb-2">Payment Failed</h1>');
            html.push('      <p class="text-red-100 text-sm font-medium">Your payment could not be processed. Please try again.</p>');
            html.push('      <p class="text-white font-extrabold mt-4 text-lg tracking-wider">#' + escapeHtml(booking.reference || booking.id || bookingId) + '</p>');
            html.push('    </div>');
        } else if (isPending) {
            html.push('    <div class="bg-yellow-500 text-white text-center py-10 relative">');
            html.push('      <div class="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20"><i class="fa-solid fa-clock text-4xl"></i></div>');
            html.push('      <h1 class="text-3xl font-extrabold mb-2">Awaiting Payment</h1>');
            html.push('      <p class="text-yellow-100 text-sm font-medium">Complete your payment to confirm this booking.</p>');
            html.push('      <p class="text-white font-extrabold mt-4 text-lg tracking-wider">#' + escapeHtml(booking.reference || booking.id || bookingId) + '</p>');
            html.push('    </div>');
        } else {
            html.push('    <div class="bg-custom-dark text-white text-center py-10 relative">');
            html.push('      <div class="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20"><i class="fa-solid fa-check text-4xl text-green-400"></i></div>');
            html.push('      <h1 class="text-3xl font-extrabold mb-2">Booking Confirmed!</h1>');
            html.push('      <p class="text-gray-300 text-sm font-medium">Your booking has been confirmed successfully</p>');
            html.push('      <p class="text-custom-light font-extrabold mt-4 text-lg tracking-wider">#' + escapeHtml(booking.reference || booking.id || bookingId) + '</p>');
            html.push('    </div>');
        }

        html.push('    <div class="p-6 sm:p-8">');
        html.push('      <div class="space-y-4 mb-8">');
        html.push('        <div class="flex justify-between py-3 border-b border-gray-100"><span class="text-sm font-bold text-gray-500">Type</span><span class="text-sm font-extrabold text-right">' + escapeHtml(booking.type || 'Booking') + '</span></div>');
        html.push('        <div class="flex justify-between py-3 border-b border-gray-100"><span class="text-sm font-bold text-gray-500">' + escapeHtml(booking.movieTitle || booking.eventTitle || booking.turfName || 'Venue') + '</span><span class="text-sm font-extrabold text-right">' + escapeHtml(booking.cinemaName || booking.venue || booking.groundName || '') + '</span></div>');
        html.push('        <div class="flex justify-between py-3 border-b border-gray-100"><span class="text-sm font-bold text-gray-500">Date & Time</span><span class="text-sm font-extrabold text-right">' + escapeHtml(booking.showDate || booking.eventDate || booking.date || '') + ' ' + escapeHtml(booking.showTime || booking.slot || '') + '</span></div>');
        if (booking.seatNumbers) {
            html.push('        <div class="flex justify-between py-3 border-b border-gray-100"><span class="text-sm font-bold text-gray-500">Seats</span><span class="text-sm font-extrabold text-right">' + escapeHtml(booking.seatNumbers.join(', ')) + '</span></div>');
        }
        html.push('        <div class="flex justify-between py-3 border-b border-gray-100"><span class="text-sm font-bold text-gray-500">Total</span><span class="text-lg font-extrabold text-custom-dark">' + formatMoney(booking.totalAmount || booking.amount || 0) + '</span></div>');
        html.push('        <div class="flex justify-between py-3 border-b border-gray-100"><span class="text-sm font-bold text-gray-500">Status</span>' + statusBadge(status) + '</div>');
        html.push('      </div>');

        // Action buttons — state-aware
        html.push('      <div class="flex flex-col sm:flex-row gap-3">');
        if (isPaid) {
            html.push('        <button onclick="downloadTicket(\'' + bookingId + '\')" class="flex-1 bg-custom-dark text-white font-extrabold py-3.5 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"><i class="fa-solid fa-download"></i> Download Ticket</button>');
        } else if (isPending) {
            html.push('        <button onclick="completePayment(\'' + bookingId + '\')" class="flex-1 bg-custom-light text-white font-extrabold py-3.5 rounded-xl hover:bg-custom-lightHover transition-all flex items-center justify-center gap-2"><i class="fa-solid fa-credit-card"></i> Complete Payment</button>');
        } else if (isFailed) {
            html.push('        <button onclick="retryPayment(\'' + bookingId + '\')" class="flex-1 bg-custom-light text-white font-extrabold py-3.5 rounded-xl hover:bg-custom-lightHover transition-all flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-right"></i> Retry Payment</button>');
        }
        html.push('        <a href="/account/bookings" class="flex-1 border-2 border-gray-200 text-gray-700 font-extrabold py-3.5 rounded-xl hover:bg-gray-50 transition-all text-center">My Bookings</a>');
        html.push('      </div>');
        html.push('    </div>');
        html.push('  </div>');
        html.push('</div>');
        main.innerHTML = html.join('');
        document.title = 'Booking ' + escapeHtml(status) + ' — EntryMySlot';
    }

    function downloadTicket(bookingId) {
        showToast('Ticket will be emailed to you.', 'success');
    }

    async function completePayment(bookingId) {
        var result = await EMSBookingApi.verifyPayment(bookingId);
        if (result.ok && result.data && result.data.success) {
            showToast('Payment confirmed! Booking updated.', 'success');
            EMSRouter.navigate('/account/booking/' + bookingId);
        } else {
            showToast((result.data && result.data.message) || 'Payment verification failed.', 'error');
        }
    }

    async function retryPayment(bookingId) {
        showToast('Please contact support or try again from your bookings.', 'error');
    }

    // ── MY BOOKINGS ────────────────────────────────────────────

    async function renderMyBookings() {
        var main = document.getElementById('mainContent');
        if (!main) return;
        main.innerHTML = renderLoading('Loading your bookings...');
        try {
            var user = EMSAuth.getUser();
            if (!user) {
                main.innerHTML = renderEmpty('Please Log In', 'You need to be logged in to view your bookings.', '/login');
                EMSRouter.navigate('/login');
                return;
            }
            var result = await EMSBookingApi.getMy();
            if (!result.ok) {
                main.innerHTML = renderEmpty('Unable to Load', 'Could not load bookings. Please try again later.');
                return;
            }
            var data = (result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <h1 class="text-3xl font-extrabold text-gray-900 mb-8">My Bookings</h1>');

            if (!data.length) {
                html.push(renderEmpty('No Bookings Yet', 'You haven\'t made any bookings. Start exploring!'));
            } else {
                html.push('  <div class="space-y-4">');
                data.forEach(function(booking) {
                    var b = booking;
                    html.push('    <a href="/account/booking/' + (b.reference || b.id) + '" class="block bg-white rounded-3xl shadow-soft border border-gray-100 p-6 hover:shadow-xl transition-all">');
                    html.push('      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">');
                    html.push('        <div class="flex items-center gap-4">');
                    html.push('          <div class="w-12 h-12 bg-custom-dark rounded-2xl flex items-center justify-center text-white text-lg"><i class="fa-solid fa-ticket"></i></div>');
                    html.push('          <div>');
                    html.push('            <h3 class="font-extrabold text-gray-900">' + escapeHtml(b.movieTitle || b.eventTitle || b.turfName || 'Booking') + '</h3>');
                    html.push('            <p class="text-sm text-gray-500 font-medium">' + escapeHtml(b.showDate || b.eventDate || b.date || '') + ' ' + escapeHtml(b.showTime || b.slot || '') + '</p>');
                    html.push('          </div>');
                    html.push('        </div>');
                    html.push('        <div class="flex items-center gap-4">');
                    html.push('          ' + statusBadge(b.status));
                    html.push('          <span class="font-extrabold text-gray-900">' + formatMoney(b.totalAmount || b.amount || 0) + '</span>');
                    html.push('          <i class="fa-solid fa-chevron-right text-gray-400 text-sm"></i>');
                    html.push('        </div>');
                    html.push('      </div>');
                    html.push('    </a>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'My Bookings — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load bookings', 'Please try again later.');
        }
    }

    // ── PROFILE ────────────────────────────────────────────────

    function renderProfile() {
        var user = EMSAuth.getUser();
        var main = document.getElementById('mainContent');
        if (!user) {
            main.innerHTML = renderEmpty('Please Log In', 'You need to be logged in to view your profile.', '/login');
            return;
        }
        var html = [];
        html.push('<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
        html.push('  <h1 class="text-3xl font-extrabold text-gray-900 mb-8">My Profile</h1>');
        html.push('  <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8">');
        html.push('    <div class="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">');
        html.push('      <div class="w-16 h-16 bg-custom-dark rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold">' + escapeHtml((user.username || user.name || 'U').charAt(0).toUpperCase()) + '</div>');
        html.push('      <div><h2 class="text-xl font-extrabold text-gray-900">' + escapeHtml(user.username || user.name || 'User') + '</h2><p class="text-sm text-gray-500 font-medium">' + escapeHtml(user.email || '') + '</p></div>');
        html.push('    </div>');
        html.push('    <form onsubmit="updateProfile(event)" class="space-y-5">');
        html.push('      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">');
        html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label><input type="text" id="profileName" value="' + escapeHtml(user.name || user.username || '') + '" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
        html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Username</label><input type="text" id="profileUsername" value="' + escapeHtml(user.username || '') + '" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
        html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Email</label><input type="email" value="' + escapeHtml(user.email || '') + '" disabled class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 cursor-not-allowed"></div>');
        html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Phone</label><input type="tel" id="profilePhone" value="' + escapeHtml(user.phone || '') + '" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light" placeholder="+91 98765 43210"></div>');
        html.push('      </div>');
        html.push('      <button type="submit" class="bg-custom-light text-white font-extrabold px-8 py-3.5 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Save Changes</button>');
        html.push('    </form>');
        html.push('  </div>');
        html.push('</div>');
        main.innerHTML = html.join('');
        document.title = 'My Profile — EntryMySlot';
    }

    async function updateProfile(e) {
        e.preventDefault();
        var name = document.getElementById('profileName').value.trim();
        var username = document.getElementById('profileUsername').value.trim();
        var phone = document.getElementById('profilePhone').value.trim();
        try {
            var result = await EMSAuth.updateProfile({ name: name, username: username, phone: phone });
            if (result.ok && result.data && result.data.success) {
                showToast('Profile updated successfully!', 'success');
                updateProfileUI();
            } else {
                showToast((result.data && result.data.message) || 'Update failed.', 'error');
            }
        } catch (err) {
            showToast('Update failed.', 'error');
        }
    }

    // ── EVENTS LISTING ─────────────────────────────────────────

    async function renderEvents(params) {
        var city = (params && params.city) || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Finding events near you...');
        try {
            var result = await global.EMSEventApi.list();
            var events = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <div class="mb-10"><h1 class="text-4xl font-extrabold text-gray-900">Events</h1><p class="text-gray-500 mt-2 font-medium">Discover concerts, shows & more</p></div>');
            if (!events.length) {
                html.push(renderEmpty('No Events Yet', 'No events are currently listed.'));
            } else {
                html.push('  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">');
                events.forEach(function(ev) {
                    html.push('    <a href="/explore/event/' + citySlug(city || 'Coimbatore') + '/' + ev.id + '" class="card-zoom group block bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-xl transition-all">');
                    html.push('      <div class="relative h-52 overflow-hidden">');
                    html.push('        <img src="' + (ev.imageUrl || '/assets/images/event-placeholder.jpg') + '" class="card-zoom-image w-full h-full object-cover">');
                    html.push('        <div class="absolute top-3 left-3"><span class="bg-custom-dark/80 backdrop-blur text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">' + escapeHtml(ev.category || 'Event') + '</span></div>');
                    html.push('      </div>');
                    html.push('      <div class="p-5">');
                    html.push('        <h3 class="font-extrabold text-gray-900 text-base mb-1 group-hover:text-custom-light transition">' + escapeHtml(ev.title) + '</h3>');
                    html.push('        <p class="text-sm text-gray-500 font-medium mb-2 flex items-center gap-1"><i class="fa-regular fa-calendar text-custom-light"></i> ' + escapeHtml(ev.eventDate || '') + '</p>');
                    html.push('        <p class="text-sm text-gray-500 font-medium mb-3 flex items-center gap-1"><i class="fa-solid fa-location-dot text-custom-light"></i> ' + escapeHtml(ev.venue || ev.city || '') + '</p>');
                    html.push('        <div class="flex items-center justify-between pt-3 border-t border-gray-50">');
                    html.push('          <span class="text-lg font-extrabold text-custom-dark">' + formatMoney(ev.price) + '</span>');
                    html.push('          <span class="text-custom-light text-xs font-extrabold">View <i class="fa-solid fa-arrow-right ml-1"></i></span>');
                    html.push('        </div>');
                    html.push('      </div>');
                    html.push('    </a>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Events — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load events', 'Please try again later.');
        }
    }

    // ── EVENT DETAIL ───────────────────────────────────────────

    async function renderEventDetail(params) {
        var eventId = params.id;
        var city = params.city || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading event details...');
        try {
            var result = await global.EMSEventApi.get(eventId);
            if (!result.ok || !result.data || !result.data.success) {
                main.innerHTML = renderEmpty('Event Not Found', 'This event could not be found.', '/explore/events');
                return;
            }
            var ev = result.data.data;
            _selectedEvent = ev;

            var html = [];
            html.push('<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <a href="/explore/events/' + citySlug(city || 'Coimbatore') + '" class="inline-flex items-center text-sm font-bold text-gray-500 hover:text-custom-dark transition mb-6"><i class="fa-solid fa-arrow-left mr-2"></i> Back to Events</a>');
            html.push('  <div class="bg-white rounded-[32px] shadow-soft border border-gray-100 overflow-hidden">');
            html.push('    <div class="relative h-72 sm:h-96 overflow-hidden">');
            html.push('      <img src="' + (ev.imageUrl || '/assets/images/event-placeholder.jpg') + '" class="w-full h-full object-cover">');
            html.push('      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>');
            html.push('      <div class="absolute bottom-0 left-0 right-0 p-6 sm:p-8">');
            html.push('        <span class="bg-custom-light text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">' + escapeHtml(ev.category || 'Event') + '</span>');
            html.push('        <h1 class="text-2xl sm:text-4xl font-extrabold text-white mt-3">' + escapeHtml(ev.title) + '</h1>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('    <div class="p-6 sm:p-8">');
            html.push('      <div class="flex flex-wrap items-center gap-6 mb-6">');
            html.push('        <div class="flex items-center gap-2 text-sm font-bold text-gray-600"><i class="fa-regular fa-calendar text-custom-light"></i> ' + escapeHtml(ev.eventDate || '') + '</div>');
            html.push('        <div class="flex items-center gap-2 text-sm font-bold text-gray-600"><i class="fa-regular fa-clock text-custom-light"></i> ' + escapeHtml(ev.startTime || '') + ' ' + (ev.endTime ? '- ' + escapeHtml(ev.endTime) : '') + '</div>');
            html.push('        <div class="flex items-center gap-2 text-sm font-bold text-gray-600"><i class="fa-solid fa-location-dot text-custom-light"></i> ' + escapeHtml(ev.venue || ev.city || '') + '</div>');
            html.push('      </div>');
            if (ev.description) html.push('      <p class="text-gray-600 font-medium leading-relaxed mb-8">' + escapeHtml(ev.description) + '</p>');
            html.push('      <div class="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-100">');
            html.push('        <div><span class="text-3xl font-extrabold text-custom-dark">' + formatMoney(ev.price) + '</span><span class="text-sm text-gray-500 font-medium"> per ticket</span></div>');
            html.push('        <button onclick="renderEventBooking(\'' + ev.id + '\', \'' + city + '\')" class="bg-custom-light text-white font-extrabold px-10 py-4 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Book Now</button>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = escapeHtml(ev.title) + ' — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Event Not Found', 'This event could not be found.', '/explore/events');
        }
    }

    // ── EVENT BOOKING ──────────────────────────────────────────

    async function renderEventBooking(eventId, city) {
        var user = EMSAuth.getUser();
        if (!user) { EMSRouter.navigate('/login'); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Preparing your booking...');
        try {
            var ev = _selectedEvent || {};
            var html = [];
            html.push('<div class="max-w-5xl mx-auto px-4 py-8">');
            html.push('  <h1 class="text-2xl font-extrabold text-gray-900 mb-8">Book Event</h1>');
            html.push('  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">');
            html.push('    <div class="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8">');
            html.push('      <div class="space-y-5">');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Number of Tickets</label><input type="number" id="eventTickets" min="1" max="6" value="1" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Lead Name</label><input type="text" id="eventContactName" value="' + escapeHtml(user.username || user.name || '') + '" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Lead Phone</label><input type="tel" id="eventContactPhone" placeholder="+91 98765 43210" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Notes (optional)</label><textarea id="eventNotes" rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light resize-none"></textarea></div>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('    <div>');
            html.push('      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sticky top-24">');
            html.push('        <h3 class="font-extrabold text-gray-900 mb-4">' + escapeHtml(ev.title || 'Event') + '</h3>');
            html.push('        <div class="space-y-2 text-sm mb-4">');
            html.push('          <div class="flex justify-between"><span class="text-gray-500 font-medium">Price</span><span class="font-bold">' + formatMoney(ev.price || 0) + '</span></div>');
            html.push('          <div class="flex justify-between"><span class="text-gray-500 font-medium">Total</span><span id="eventTotal" class="font-extrabold text-custom-dark">' + formatMoney(ev.price || 0) + '</span></div>');
            html.push('        </div>');
            html.push('        <button onclick="processEventBooking(\'' + eventId + '\')" class="w-full bg-custom-light text-white font-extrabold py-4 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Confirm Booking</button>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');

            main.innerHTML = html.join('');
            // Dynamic total
            var ticketInput = document.getElementById('eventTickets');
            if (ticketInput) {
                ticketInput.addEventListener('input', function() {
                    var count = parseInt(this.value) || 1;
                    var totalEl = document.getElementById('eventTotal');
                    if (totalEl) totalEl.textContent = formatMoney((ev.price || 0) * count);
                });
            }
            document.title = 'Book Event — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load booking', 'Please try again.');
        }
    }

    async function processEventBooking(eventId) {
        var tickets = parseInt(document.getElementById('eventTickets')?.value) || 1;
        var name = document.getElementById('eventContactName')?.value.trim();
        var phone = document.getElementById('eventContactPhone')?.value.trim();
        var notes = document.getElementById('eventNotes')?.value.trim();

        if (!name || !phone) { showToast('Please fill in contact details.', 'error'); return; }

        try {
            var result = await global.EMSEventApi.createBooking(eventId, { ticketsCount: tickets, contactName: name, contactPhone: phone, notes: notes });
            if (result.ok && result.data && result.data.success) {
                localStorage.setItem('ems_last_booking', JSON.stringify(result.data.data));
                EMSRouter.navigate('/account/booking/' + (result.data.data.reference || result.data.data.id));
            } else {
                showToast((result.data && result.data.message) || 'Booking failed.', 'error');
            }
        } catch (e) {
            showToast('Booking failed.', 'error');
        }
    }

    // ── TURFS LISTING ──────────────────────────────────────────

    async function renderTurfs(params) {
        var city = (params && params.city) || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Finding turfs near you...');
        try {
            var result = await global.EMSTurfApi.list();
            var turfs = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <div class="mb-10"><h1 class="text-4xl font-extrabold text-gray-900">Sports Turfs</h1><p class="text-gray-500 mt-2 font-medium">Book your favorite sports venue</p></div>');

            if (!turfs.length) {
                html.push(renderEmpty('No Turfs Yet', 'No turfs are currently listed.'));
            } else {
                html.push('  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">');
                turfs.forEach(function(turf) {
                    html.push('    <a href="/explore/turf/' + citySlug(city || 'Coimbatore') + '/' + turf.id + '" class="card-zoom group block bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-xl transition-all">');
                    html.push('      <div class="relative h-48 overflow-hidden">');
                    html.push('        <img src="' + (turf.images && turf.images[0] || '/assets/images/turf-placeholder.jpg') + '" class="card-zoom-image w-full h-full object-cover">');
                    html.push('        <div class="absolute top-3 left-3"><span class="bg-custom-dark/80 backdrop-blur text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">' + escapeHtml(turf.sport || 'Turf') + '</span></div>');
                    html.push('        <div class="absolute top-3 right-3 flex items-center bg-white/90 backdrop-blur px-2 py-1 rounded-full"><i class="fa-solid fa-star text-yellow-400 text-xs mr-1"></i><span class="text-xs font-extrabold">' + (turf.rating || '4.0') + '</span></div>');
                    html.push('      </div>');
                    html.push('      <div class="p-5">');
                    html.push('        <h3 class="font-extrabold text-gray-900 text-base mb-1 group-hover:text-custom-light transition">' + escapeHtml(turf.name) + '</h3>');
                    html.push('        <p class="text-sm text-gray-500 font-medium mb-3 flex items-center gap-1"><i class="fa-solid fa-location-dot text-custom-light"></i> ' + escapeHtml(turf.city || turf.address || '') + '</p>');
                    html.push('        <div class="flex items-center justify-between pt-3 border-t border-gray-50">');
                    html.push('          <div><span class="text-lg font-extrabold text-custom-dark">' + formatMoney(turf.pricePerHour || 0) + '</span><span class="text-xs text-gray-500 font-medium"> /hour</span></div>');
                    html.push('          <span class="text-custom-light text-xs font-extrabold">Book <i class="fa-solid fa-arrow-right ml-1"></i></span>');
                    html.push('        </div>');
                    html.push('      </div>');
                    html.push('    </a>');
                });
                html.push('  </div>');
            }
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Sports Turfs — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load turfs', 'Please try again later.');
        }
    }

    // ── TURF DETAIL ────────────────────────────────────────────

    async function renderTurfDetail(params) {
        var turfId = params.id;
        var city = params.city || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Loading turf details...');
        try {
            var result = await global.EMSTurfApi.get(turfId);
            if (!result.ok || !result.data || !result.data.success) {
                main.innerHTML = renderEmpty('Turf Not Found', 'This turf could not be found.', '/explore/home');
                return;
            }
            var turf = result.data.data;
            _selectedTurf = turf;

            // Load availability
            var availResult = await global.EMSTurfApi.getAvailability(turfId, getTodayDate());
            var availability = (availResult.ok && availResult.data && availResult.data.success) ? availResult.data.data : null;

            var html = [];
            html.push('<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <a href="/explore/home/' + citySlug(city || 'Coimbatore') + '" class="inline-flex items-center text-sm font-bold text-gray-500 hover:text-custom-dark transition mb-6"><i class="fa-solid fa-arrow-left mr-2"></i> Back to Turfs</a>');
            html.push('  <div class="bg-white rounded-[32px] shadow-soft border border-gray-100 overflow-hidden">');
            html.push('    <div class="relative h-72 sm:h-96 overflow-hidden">');
            html.push('      <img src="' + (turf.images && turf.images[0] || '/assets/images/turf-placeholder.jpg') + '" class="w-full h-full object-cover">');
            html.push('      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>');
            html.push('      <div class="absolute bottom-0 left-0 right-0 p-6 sm:p-8">');
            html.push('        <span class="bg-custom-light text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">' + escapeHtml(turf.sport || 'Sports') + '</span>');
            html.push('        <h1 class="text-2xl sm:text-4xl font-extrabold text-white mt-3">' + escapeHtml(turf.name) + '</h1>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('    <div class="p-6 sm:p-8">');
            html.push('      <div class="flex flex-wrap items-center gap-6 mb-6">');
            html.push('        <div class="flex items-center gap-1"><span class="text-yellow-400 text-sm">' + starRating(turf.rating) + '</span><span class="text-sm font-bold text-gray-600">(' + (turf.reviewCount || 0) + ')</span></div>');
            html.push('        <div class="flex items-center gap-2 text-sm font-bold text-gray-600"><i class="fa-solid fa-location-dot text-custom-light"></i> ' + escapeHtml(turf.city || '') + '</div>');
            html.push('        <span class="text-sm font-bold text-gray-600"><i class="fa-solid fa-indian-rupee-sign text-custom-light mr-1"></i>' + formatMoney(turf.pricePerHour || 0) + '/hr</span>');
            html.push('      </div>');
            if (turf.description) html.push('      <p class="text-gray-600 font-medium leading-relaxed mb-6">' + escapeHtml(turf.description) + '</p>');
            if (turf.amenities && turf.amenities.length) {
                html.push('      <div class="flex flex-wrap gap-2 mb-8">');
                turf.amenities.forEach(function(a) { html.push('        <span class="bg-gray-100 text-gray-700 text-xs font-extrabold px-3 py-1.5 rounded-full">' + escapeHtml(a) + '</span>'); });
                html.push('      </div>');
            }

            // Availability slots
            html.push('      <h3 class="text-xl font-extrabold text-gray-900 mb-4">Availability — ' + formatDate(getTodayDate()) + '</h3>');
            if (availability && availability.slots && availability.slots.length) {
                html.push('      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">');
                availability.slots.forEach(function(slot) {
                    var slotClass = slot.available
                        ? 'bg-white border-gray-200 text-gray-700 hover:border-custom-light hover:text-custom-light cursor-pointer'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through';
                    var unitId = slot.availability_unit_id || slot.unitId || '';
                    var onclick = slot.available ? "selectTurfSlot('" + slot.slot + "', " + slot.price + ", '" + unitId + "')" : '';
                    html.push('        <button onclick="' + onclick + '" class="p-3 border-2 rounded-xl text-xs font-extrabold transition ' + slotClass + '">' + escapeHtml(slot.slot) + '</button>');
                });
                html.push('      </div>');
            } else {
                html.push('      <p class="text-gray-500 text-sm font-medium mb-8">No slot data available for today.</p>');
            }

            // Quick date selector
            html.push('      <div class="flex items-center justify-between pt-6 border-t border-gray-100">');
            html.push('        <div><span class="text-lg font-extrabold text-custom-dark">' + formatMoney(turf.pricePerHour || 0) + '</span><span class="text-sm text-gray-500 font-medium"> /hour</span></div>');
            html.push('        <button onclick="renderTurfBooking(\'' + turfId + '\')" class="bg-custom-light text-white font-extrabold px-8 py-3.5 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Book Now</button>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = escapeHtml(turf.name) + ' — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Turf Not Found', 'This turf could not be found.', '/explore/home');
        }
    }

    var _selectedTurfUnitId = null;

    function selectTurfSlot(slot, price, unitId) {
        _selectedTurfUnitId = unitId || null;
        showToast('Slot ' + slot + ' selected. Click Book Now to continue.', 'success');
    }

    // ── TURF BOOKING ───────────────────────────────────────────

    async function renderTurfBooking(turfId) {
        var user = EMSAuth.getUser();
        if (!user) { EMSRouter.navigate('/login'); return; }
        var main = document.getElementById('mainContent');
        var turf = _selectedTurf || {};
        main.innerHTML = renderLoading('Preparing your booking...');
        try {
            var html = [];
            html.push('<div class="max-w-5xl mx-auto px-4 py-8">');
            html.push('  <h1 class="text-2xl font-extrabold text-gray-900 mb-8">Book Turf</h1>');
            html.push('  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">');
            html.push('    <div class="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8">');
            html.push('      <div class="space-y-5">');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Date</label><input type="date" id="turfDate" value="' + getTodayDate() + '" min="' + getTodayDate() + '" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Time Slot</label><select id="turfSlot" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light">');
            ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'].forEach(function(s) {
                html.push('          <option value="' + s + '">' + s + ' - ' + (parseInt(s) + 1) + ':00</option>');
            });
            html.push('        </select></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Players Count</label><input type="number" id="turfPlayers" min="1" value="5" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Contact Name</label><input type="text" id="turfContactName" value="' + escapeHtml(user.username || user.name || '') + '" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Phone</label><input type="tel" id="turfContactPhone" placeholder="+91 98765 43210" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light"></div>');
            html.push('        <div><label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Notes (optional)</label><textarea id="turfNotes" rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:outline-none focus:border-custom-light resize-none"></textarea></div>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('    <div>');
            html.push('      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sticky top-24">');
            html.push('        <h3 class="font-extrabold text-gray-900 mb-2">' + escapeHtml(turf.name || 'Turf') + '</h3>');
            html.push('        <div class="space-y-2 text-sm mb-4">');
            html.push('          <div class="flex justify-between"><span class="text-gray-500 font-medium">Rate</span><span class="font-bold">' + formatMoney(turf.pricePerHour || 0) + '/hr</span></div>');
            html.push('          <div class="flex justify-between"><span class="text-gray-500 font-medium">Total</span><span id="turfTotal" class="font-extrabold text-custom-dark">' + formatMoney(turf.pricePerHour || 0) + '</span></div>');
            html.push('        </div>');
            html.push('        <button onclick="processTurfBooking(\'' + turfId + '\')" class="w-full bg-custom-light text-white font-extrabold py-4 rounded-xl hover:bg-custom-lightHover transition-all shadow-glow">Confirm Booking</button>');
            html.push('      </div>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');
            main.innerHTML = html.join();
            document.title = 'Book Turf — EntryMySlot';
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load booking', 'Please try again.');
        }
    }

    async function processTurfBooking(turfId) {
        var name = document.getElementById('turfContactName')?.value.trim();
        var phone = document.getElementById('turfContactPhone')?.value.trim();
        var notes = document.getElementById('turfNotes')?.value.trim();

        if (!name || !phone) { showToast('Please fill in contact details.', 'error'); return; }

        // Must have selected an availability unit from the detail page slots
        if (!_selectedTurfUnitId) {
            showToast('Please go back and select an available time slot.', 'error');
            return;
        }

        try {
            var result = await global.EMSTurfApi.createBooking(turfId, {
                availability_unit_id: _selectedTurfUnitId,
                contactName: name,
                contactPhone: phone,
                notes: notes,
            });
            if (result.ok && result.data && result.data.success) {
                _selectedTurfUnitId = null;
                localStorage.setItem('ems_last_booking', JSON.stringify(result.data.data));
                EMSRouter.navigate('/account/booking/' + (result.data.data.reference || result.data.data.id));
            } else {
                showToast((result.data && result.data.message) || 'Booking failed.', 'error');
            }
        } catch (e) {
            showToast('Booking failed.', 'error');
        }
    }

    // ── EXPLORE / HOME (Turf-focus) ────────────────────────────

    async function renderExploreHome(params) {
        var city = (params && params.city) || '';
        var main = document.getElementById('mainContent');
        main.innerHTML = renderLoading('Discovering turfs near you...');
        try {
            var result = await global.EMSTurfApi.list();
            var turfs = (result.ok && result.data && result.data.success) ? result.data.data : [];
            var sports = {};
            turfs.forEach(function(t) { if (t.sport) { sports[t.sport] = (sports[t.sport] || 0) + 1; } });

            var html = [];
            html.push('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">');
            html.push('  <h1 class="text-4xl font-extrabold text-gray-900 mb-2">Find Your Game</h1>');
            html.push('  <p class="text-gray-500 font-medium mb-10">Book sports venues near you instantly</p>');

            // Sport categories
            html.push('  <div class="flex flex-wrap gap-3 mb-10">');
            html.push('    <button class="sport-filter active bg-custom-dark text-white px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-md" onclick="filterTurfs(\'all\')">All</button>');
            Object.keys(sports).forEach(function(s) {
                html.push('    <button class="sport-filter bg-white text-gray-600 border border-gray-200 px-6 py-2.5 rounded-xl font-extrabold text-sm hover:border-custom-light hover:text-custom-light transition" onclick="filterTurfs(\'' + escapeHtml(s.toLowerCase()) + '\')">' + escapeHtml(s) + ' (' + sports[s] + ')</button>');
            });
            html.push('  </div>');

            // Turf grid
            html.push('  <div id="turfGrid">');
            if (!turfs.length) {
                html.push(renderEmpty('No Turfs Found', 'Try selecting a different city.'));
            } else {
                html.push('    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">');
                turfs.forEach(function(turf) {
                    html.push('      <a href="/explore/turf/' + citySlug(city || 'Coimbatore') + '/' + turf.id + '" class="card-zoom group block bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-xl transition-all" data-sport="' + escapeHtml((turf.sport || '').toLowerCase()) + '">');
                    html.push('        <div class="relative h-48 overflow-hidden">');
                    html.push('          <img src="' + (turf.images && turf.images[0] || '/assets/images/turf-placeholder.jpg') + '" class="card-zoom-image w-full h-full object-cover">');
                    html.push('          <div class="absolute top-3 left-3"><span class="bg-custom-dark/80 backdrop-blur text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">' + escapeHtml(turf.sport || 'Turf') + '</span></div>');
                    html.push('        </div>');
                    html.push('        <div class="p-5">');
                    html.push('          <h3 class="font-extrabold text-gray-900 text-base mb-1 group-hover:text-custom-light transition">' + escapeHtml(turf.name) + '</h3>');
                    html.push('          <p class="text-sm text-gray-500 font-medium mb-3 flex items-center gap-1"><i class="fa-solid fa-location-dot text-custom-light"></i> ' + escapeHtml(turf.city || turf.address || '') + '</p>');
                    html.push('          <div class="flex items-center justify-between pt-3 border-t border-gray-50">');
                    html.push('            <div><span class="text-lg font-extrabold text-custom-dark">' + formatMoney(turf.pricePerHour || 0) + '</span><span class="text-xs text-gray-500 font-medium"> /hour</span></div>');
                    html.push('            <span class="text-custom-light text-xs font-extrabold">Book <i class="fa-solid fa-arrow-right ml-1"></i></span>');
                    html.push('          </div>');
                    html.push('        </div>');
                    html.push('      </a>');
                });
                html.push('    </div>');
            }
            html.push('  </div>');
            html.push('</div>');
            main.innerHTML = html.join('');
            document.title = 'Find Your Game — EntryMySlot';

            window.filterTurfs = function(sport) {
                var cards = document.querySelectorAll('#turfGrid a[data-sport]');
                var buttons = document.querySelectorAll('.sport-filter');
                buttons.forEach(function(b) { b.className = 'sport-filter bg-white text-gray-600 border border-gray-200 px-6 py-2.5 rounded-xl font-extrabold text-sm hover:border-custom-light hover:text-custom-light transition'; });
                if (event && event.target) event.target.className = 'sport-filter active bg-custom-dark text-white px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-md';
                cards.forEach(function(card) {
                    card.style.display = (sport === 'all' || card.dataset.sport === sport) ? '' : 'none';
                });
            };
        } catch (e) {
            main.innerHTML = renderEmpty('Unable to load', 'Please try again later.');
        }
    }

    // ── City helpers ─────────────────────────────────────────────

    function citySlug(name) {
        if (!name) return '';
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    function getCityFromParams(params) {
        if (params && params.city) return params.city;
        var sel = global.EMSLocation ? global.EMSLocation.getSelected() : null;
        return sel ? sel.name : 'Coimbatore';
    }

    function withCity(basePath, cityName) {
        var slug = citySlug(cityName);
        return basePath + '/' + (slug || 'all');
    }

    // ── Date helpers ────────────────────────────────────────────

    function getTodayDate() {
        var d = new Date();
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    }

    // ── Route registration ─────────────────────────────────────

    function registerRoutes() {
        if (typeof global.EMSRouter === 'undefined') return;
        // Canonical public routes (city-aware)
        global.EMSRouter.get('/', renderHome);
        global.EMSRouter.get('/explore/home/:city', renderExploreHome);
        global.EMSRouter.get('/explore/movies/:city', renderMovies);
        global.EMSRouter.get('/explore/movie/:city/:id', renderMovieDetail);
        global.EMSRouter.get('/explore/events/:city', renderEvents);
        global.EMSRouter.get('/explore/event/:city/:id', renderEventDetail);
        global.EMSRouter.get('/explore/turfs/:city', renderTurfs);
        global.EMSRouter.get('/explore/turf/:city/:id', renderTurfDetail);

        // Legacy routes without city param (backward compat / redirect targets)
        global.EMSRouter.get('/explore/home', function (p) { EMSRouter.navigate('/explore/home/' + citySlug(getCityFromParams(p))); });
        global.EMSRouter.get('/explore/movies', function (p) { EMSRouter.navigate('/explore/movies/' + citySlug(getCityFromParams(p))); });
        global.EMSRouter.get('/explore/events', function (p) { EMSRouter.navigate('/explore/events/' + citySlug(getCityFromParams(p))); });
        global.EMSRouter.get('/explore/turfs', function (p) { EMSRouter.navigate('/explore/turfs/' + citySlug(getCityFromParams(p))); });

        // Account routes
        global.EMSRouter.get('/account/bookings', renderMyBookings);
        global.EMSRouter.get('/account/profile', renderProfile);
        global.EMSRouter.get('/account/booking/:ref', renderBookingConfirmation);

        // Auth routes
        global.EMSRouter.get('/login', function() {
            if (EMSAuth.isLoggedIn()) { EMSRouter.navigate('/explore/home/' + citySlug(getCityFromParams({}))); return; }
            document.getElementById('authOverlay').classList.add('active');
            document.getElementById('appShell').classList.remove('active');
            showLogin();
        });

        global.EMSRouter.get('/logout', function() { handleCustomerLogout(); });
    }

    // Expose booking/UI functions used by inline onclick handlers
    window.renderMovieBooking = renderMovieBooking;
    window.processBooking = processBooking;
    window.downloadTicket = downloadTicket;
    window.completePayment = completePayment;
    window.retryPayment = retryPayment;
    window.renderEventBooking = renderEventBooking;
    window.processEventBooking = processEventBooking;
    window.renderTurfBooking = renderTurfBooking;
    window.processTurfBooking = processTurfBooking;

    global.EMSCustomerPages = Object.freeze({
        renderHome: renderHome,
        renderMovies: renderMovies,
        renderMovieDetail: renderMovieDetail,
        renderEvents: renderEvents,
        renderEventDetail: renderEventDetail,
        renderTurfs: renderTurfs,
        renderTurfDetail: renderTurfDetail,
        renderMyBookings: renderMyBookings,
        renderProfile: renderProfile,
        renderBookingConfirmation: renderBookingConfirmation,
        renderExploreHome: renderExploreHome,
        registerRoutes: registerRoutes,
        citySlug: citySlug,
        getTodayDate: getTodayDate,
    });

})(window);
