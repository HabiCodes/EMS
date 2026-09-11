/**
 * EntryMySlot - Response Mappers
 * Normalizes backend snake_case responses into frontend camelCase models.
 * Handles paise→rupees, ISO dates, status labels, etc.
 */

(function (global) {
  'use strict';

  var CFG = global.EMS_CONFIG;

  // ── Shared utilities ───────────────────────────────────────────────

  function toCamel(s) {
    return s.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }

  function toSnake(s) {
    return s.replace(/[A-Z]/g, function (c) { return '_' + c.toLowerCase(); });
  }

  function mapKeys(obj, fn) {
    if (!obj || typeof obj !== 'object') return obj;
    var result = {};
    Object.keys(obj).forEach(function (k) {
      result[fn(k)] = typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])
        ? mapKeys(obj[k], fn)
        : obj[k];
    });
    return result;
  }

  function safeDate(d) {
    if (!d) return null;
    if (d instanceof Date) return d;
    var parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatDate(d) {
    var date = safeDate(d);
    if (!date) return '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
  }

  function formatTime(d) {
    var date = safeDate(d);
    if (!date) return '';
    var h = date.getHours();
    var m = date.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
  }

  // Convert paise to rupees (backend uses paise, display uses rupees)
  function paiseToRupees(val) {
    if (val === null || val === undefined) return 0;
    var num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
    if (isNaN(num)) return 0;
    return Math.round(num) / 100;
  }

  function rupeesToPaise(val) {
    if (val === null || val === undefined) return 0;
    var num = typeof val === 'string' ? parseFloat(val) : Number(val);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }

  // Format money for display
  function formatMoney(val, symbol) {
    var rupees = paiseToRupees(val);
    var sym = symbol || (CFG && CFG.currencySymbol) || '₹';
    if (rupees === 0) return sym + '0';
    if (rupees < 1) return sym + rupees.toFixed(2);
    return sym + rupees.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  // Status label mapping
  var STATUS_LABELS = {
    pending_payment: 'Payment Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    completed: 'Completed',
    active: 'Active',
    inactive: 'Inactive',
    draft: 'Draft',
    published: 'Published',
    pending: 'Pending',
    hidden: 'Hidden',
    archived: 'Archived',
    approved: 'Approved',
    rejected: 'Rejected',
    under_review: 'Under Review',
    sold_out: 'Sold Out',
    available: 'Available',
    occupied: 'Occupied',
    held: 'Held',
    processing: 'Processing',
    failed: 'Failed',
    expired: 'Expired',
    refunded: 'Refunded',
  };

  function statusLabel(status) {
    if (!status) return 'Unknown';
    var key = String(status).toLowerCase();
    return STATUS_LABELS[key] || status.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function statusColor(status) {
    var key = String(status).toLowerCase();
    if (['confirmed', 'completed', 'published', 'active', 'approved'].indexOf(key) !== -1) return 'green';
    if (['pending_payment', 'pending', 'processing', 'under_review'].indexOf(key) !== -1) return 'amber';
    if (['cancelled', 'canceled', 'failed', 'rejected', 'hidden', 'archived', 'inactive', 'expired', 'refunded'].indexOf(key) !== -1) return 'red';
    return 'gray';
  }

  // Pagination helper
  function paginate(items, page, pageSize) {
    page = parseInt(page, 10) || 1;
    pageSize = Math.min(parseInt(pageSize, 10) || 20, (CFG && CFG.maxPageSize) || 100);
    var total = Array.isArray(items) ? items.length : 0;
    var start = (page - 1) * pageSize;
    var pageItems = items.slice(start, start + pageSize);
    return {
      items: pageItems,
      page: page,
      pageSize: pageSize,
      total: total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // ── Event mapper ───────────────────────────────────────────────────

  function mapEvent(raw) {
    if (!raw) return null;
    var e = mapKeys(raw, toCamel);
    var mapped = {
      id: e.id || '',
      title: e.title || '',
      category: e.category || '',
      venue: e.venue || '',
      city: e.city || '',
      capacity: e.capacity || 0,
      price: paiseToRupees(e.price),
      currency: e.currency || 'INR',
      status: e.status || 'draft',
      statusLabel: statusLabel(e.status),
      description: e.description || '',
      eventDate: e.eventDate || e.event_date || '',
      startTime: e.startTime || e.start_time || '',
      endTime: e.endTime || e.end_time || '',
      organizationId: e.organizationId || e.organization_id || '',
      createdAt: formatDate(e.createdAt || e.created_at),
      featured: !!e.featured,
      imageUrl: e.imageUrl || e.image_url || '',
      zones: (e.zones || []).map(mapEventZone),
    };
    return mapped;
  }

  function mapEventZone(raw) {
    if (!raw) return null;
    var z = mapKeys(raw, toCamel);
    return {
      id: z.id || '',
      name: z.name || '',
      price: paiseToRupees(z.price),
      capacity: z.capacity || 0,
      description: z.description || '',
      currency: z.currency || 'INR',
      isSoldOut: !!z.isSoldOut || !!z.is_sold_out,
      available: (z.capacity || 0) - (z.booked || 0),
    };
  }

  function mapEventBooking(raw) {
    if (!raw) return null;
    var b = mapKeys(raw, toCamel);
    return {
      id: b.id || '',
      type: b.type || 'event',
      eventId: b.eventId || b.event_id || '',
      eventTitle: b.eventTitle || b.event_title || '',
      eventDate: b.eventDate || b.event_date || '',
      eventVenue: b.eventVenue || b.event_venue || '',
      eventCity: b.eventCity || b.event_city || '',
      userId: b.userId || b.user_id || '',
      userEmail: b.userEmail || b.user_email || '',
      userUsername: b.userUsername || b.user_username || '',
      ticketsCount: b.ticketsCount || b.tickets_count || 1,
      ticketType: b.ticketType || b.ticket_type || 'general',
      zoneId: b.zoneId || b.zone_id || '',
      seatNumbers: Array.isArray(b.seatNumbers) ? b.seatNumbers : (b.seat_numbers || []),
      totalAmount: paiseToRupees(b.totalAmount || b.total_amount || 0),
      amount: paiseToRupees(b.amount || 0),
      currency: b.currency || 'INR',
      status: b.status || 'pending_payment',
      statusLabel: statusLabel(b.status),
      paymentStatus: b.paymentStatus || b.payment_status || 'pending',
      paymentMethod: b.paymentMethod || b.payment_method || '',
      gatewayOrderId: b.gatewayOrderId || b.gateway_order_id || '',
      contactName: b.contactName || b.contact_name || '',
      contactPhone: b.contactPhone || b.contact_phone || '',
      notes: b.notes || '',
      createdAt: formatDate(b.createdAt || b.created_at),
      reference: b.reference || b.id || '',
    };
  }

  // ── Movie mapper ───────────────────────────────────────────────────

  function mapMovie(raw) {
    if (!raw) return null;
    var m = mapKeys(raw, toCamel);
    return {
      id: m.id || '',
      title: m.title || '',
      genre: m.genre || '',
      language: m.language || '',
      slug: m.slug || '',
      isActive: !!m.isActive,
      status: m.status || 'draft',
      featured: !!m.featured,
      description: m.description || '',
      duration: m.duration || '',
      posterUrl: m.posterUrl || m.poster_url || '',
      trailerUrl: m.trailerUrl || m.trailer_url || '',
      rating: m.rating || '',
      releaseDate: formatDate(m.releaseDate || m.release_date || ''),
    };
  }

  function mapCinema(raw) {
    if (!raw) return null;
    var c = mapKeys(raw, toCamel);
    return {
      id: c.id || '',
      name: c.name || '',
      city: c.city || '',
      screenCount: c.screenCount || c.screen_count || 0,
      isActive: !!c.isActive,
      address: c.address || '',
      location: c.location || '',
    };
  }

  function mapShowtime(raw) {
    if (!raw) return null;
    var s = mapKeys(raw, toCamel);
    return {
      id: s.id || '',
      cinemaId: s.cinemaId || s.cinema_id || '',
      cinemaName: s.cinemaName || s.cinema_name || '',
      cinemaCity: s.cinemaCity || s.cinema_city || '',
      movieId: s.movieId || s.movie_id || '',
      movieTitle: s.movieTitle || s.movie_title || '',
      movieGenre: s.movieGenre || s.movie_genre || '',
      movieLanguage: s.movieLanguage || s.movie_language || '',
      screen: s.screen || '',
      showDate: s.showDate || s.show_date || '',
      showTime: s.showTime || s.show_time || '',
      endTime: s.endTime || s.end_time || '',
      price: paiseToRupees(s.price),
      availableSeats: s.availableSeats || s.available_seats || 0,
      totalSeats: s.totalSeats || s.total_seats || 0,
      format: s.format || '',
      language: s.language || '',
    };
  }

  function mapSeat(raw) {
    if (!raw) return null;
    var s = mapKeys(raw, toCamel);
    return {
      id: s.id || '',
      row: s.row || '',
      number: s.number || 0,
      type: s.type || 'standard',
      price: paiseToRupees(s.price),
      status: s.status || 'available',
      statusLabel: statusLabel(s.status),
      isAvailable: s.status !== 'occupied' && s.status !== 'booked',
    };
  }

  function mapSeatLayout(raw) {
    if (!raw) return null;
    var d = raw.data || raw;
    return {
      showtimeId: d.showtimeId || d.showtime_id || '',
      rows: d.rows || [],
      totalSeats: d.totalSeats || d.total_seats || 0,
      available: d.available || 0,
      seats: (d.seats || []).map(mapSeat),
    };
  }

  function mapMovieBooking(raw) {
    if (!raw) return null;
    var b = mapKeys(raw, toCamel);
    return {
      id: b.id || '',
      reference: b.reference || '',
      type: b.type || 'movie',
      showtimeId: b.showtimeId || b.showtime_id || '',
      movieTitle: b.movieTitle || b.movie_title || '',
      cinemaName: b.cinemaName || b.cinema_name || '',
      screen: b.screen || '',
      showDate: b.showDate || b.show_date || '',
      showTime: b.showTime || b.show_time || '',
      userId: b.userId || b.user_id || '',
      userEmail: b.userEmail || b.user_email || '',
      userUsername: b.userUsername || b.user_username || '',
      seatIds: Array.isArray(b.seatIds) ? b.seatIds : (b.seat_ids || []),
      seatsCount: b.seatsCount || b.seats_count || b.seatIds ? b.seatIds.length : 0,
      totalAmount: paiseToRupees(b.totalAmount || 0),
      currency: b.currency || 'INR',
      status: b.status || 'pending_payment',
      statusLabel: statusLabel(b.status),
      paymentStatus: b.paymentStatus || b.payment_status || 'pending',
      createdAt: formatDate(b.createdAt || b.created_at),
    };
  }

  // ── Turf mapper ────────────────────────────────────────────────────

  function mapTurf(raw) {
    if (!raw) return null;
    var t = mapKeys(raw, toCamel);
    return {
      id: t.id || '',
      name: t.name || '',
      sport: t.sport || '',
      status: t.status || 'active',
      statusLabel: statusLabel(t.status),
      organizationId: t.organizationId || t.organization_id || '',
      city: t.city || '',
      address: t.address || '',
      description: t.description || '',
      pricePerHour: paiseToRupees(t.pricePerHour || t.price_per_hour || 0),
      currency: t.currency || 'INR',
      rating: t.rating || 0,
      reviewCount: t.reviewCount || t.review_count || 0,
      images: t.images || [],
      amenities: t.amenities || [],
      createdAt: formatDate(t.createdAt || t.created_at),
    };
  }

  function mapTurfBooking(raw) {
    if (!raw) return null;
    var b = mapKeys(raw, toCamel);
    return {
      id: b.id || '',
      type: b.type || 'turf',
      groundId: b.groundId || b.ground_id || '',
      groundName: b.groundName || b.ground_name || '',
      userId: b.userId || b.user_id || '',
      userEmail: b.userEmail || b.user_email || '',
      userName: b.userName || b.user_name || '',
      date: b.date || '',
      slot: b.slot || '',
      slots: Array.isArray(b.slots) ? b.slots : [b.slot].filter(Boolean),
      durationHours: b.durationHours || b.duration_hours || 1,
      sport: b.sport || '',
      playersCount: b.playersCount || b.players_count || 0,
      amount: paiseToRupees(b.amount || 0),
      totalAmount: paiseToRupees(b.totalAmount || b.total_amount || 0),
      currency: b.currency || 'INR',
      status: b.status || 'pending_payment',
      statusLabel: statusLabel(b.status),
      paymentStatus: b.paymentStatus || b.payment_status || 'pending',
      contactName: b.contactName || b.contact_name || '',
      contactPhone: b.contactPhone || b.contact_phone || '',
      notes: b.notes || '',
      createdAt: formatDate(b.createdAt || b.created_at),
      reference: b.reference || b.id || '',
    };
  }

  function mapAvailability(raw) {
    if (!raw) return null;
    var d = raw.data || raw;
    return {
      resourceId: d.resourceId || d.resource_id || '',
      date: d.date || '',
      slots: (d.slots || []).map(function (s) {
        return {
          hour: s.hour || 0,
          slot: s.slot || '',
          available: !!s.available,
          price: paiseToRupees(s.price),
        };
      }),
    };
  }

  // ── Admin mappers ──────────────────────────────────────────────────

  function mapOrganization(raw) {
    if (!raw) return null;
    var o = mapKeys(raw, toCamel);
    return {
      id: o.id || '',
      name: o.name || '',
      type: o.type || '',
      isActive: !!o.isActive,
      city: o.city || '',
      email: o.email || '',
      contactEmail: o.contactEmail || o.contact_email || '',
      createdAt: formatDate(o.createdAt || o.created_at),
    };
  }

  function mapManager(raw) {
    if (!raw) return null;
    var m = mapKeys(raw, toCamel);
    return {
      id: m.id || '',
      name: m.name || '',
      email: m.email || '',
      organizationId: m.organizationId || m.organization_id || '',
      isActive: !!m.isActive,
      tempPassword: m.tempPassword || m.temp_password || '',
      permissions: m.permissions || [],
      createdAt: formatDate(m.createdAt || m.created_at),
    };
  }

  function mapBanner(raw) {
    if (!raw) return null;
    var b = mapKeys(raw, toCamel);
    return {
      id: b.id || '',
      title: b.title || '',
      type: b.type || '',
      imageUrl: b.imageUrl || b.image_url || '',
      targetId: b.targetId || b.target_id || '',
      isActive: !!b.isActive,
      position: b.position || 'top',
      createdAt: formatDate(b.createdAt || b.created_at),
    };
  }

  function mapMedia(raw) {
    if (!raw) return null;
    var m = mapKeys(raw, toCamel);
    return {
      id: m.id || '',
      type: m.type || 'image',
      url: m.url || '',
      filename: m.filename || '',
      size: m.size || 0,
      mimeType: m.mimeType || m.mime_type || '',
      uploadedBy: m.uploadedBy || m.uploaded_by || '',
      createdAt: formatDate(m.createdAt || m.created_at),
    };
  }

  function mapAuditLog(raw) {
    if (!raw) return null;
    var l = mapKeys(raw, toCamel);
    return {
      id: l.id || '',
      action: l.action || '',
      entityType: l.entityType || l.entity_type || '',
      entityId: l.entityId || l.entity_id || '',
      actor: l.actor || {},
      metadata: l.metadata || {},
      createdAt: formatDate(l.createdAt || l.created_at),
    };
  }

  function mapRefund(raw) {
    if (!raw) return null;
    var r = mapKeys(raw, toCamel);
    return {
      id: r.id || '',
      paymentOrderId: r.paymentOrderId || r.payment_order_id || '',
      amount: paiseToRupees(r.amount || 0),
      status: r.status || 'pending',
      statusLabel: statusLabel(r.status),
      createdAt: formatDate(r.createdAt || r.created_at),
    };
  }

  function mapStats(raw) {
    if (!raw) return {};
    var s = mapKeys(raw, toCamel);
    return {
      bookings: s.bookings || {},
      events: s.events || {},
      users: s.users || 0,
      organizations: s.organizations || 0,
      checkIns: s.checkIns || s.check_ins || {},
      revenue: paiseToRupees(s.revenue || 0),
      turfBookings: s.turfBookings || s.turf_bookings || {},
      moviesCount: s.moviesCount || s.movies_count || 0,
      cinemasCount: s.cinemasCount || s.cinemas_count || 0,
    };
  }

  // Global shortcuts so page modules can call these directly
  global.formatMoney = formatMoney;
  global.FormatMoneyUtil = Object.freeze({
    formatMoney: formatMoney,
    paiseToRupees: paiseToRupees,
    rupeesToPaise: rupeesToPaise,
    formatDate: formatDate,
    formatTime: formatTime,
    statusLabel: statusLabel,
    statusColor: statusColor,
  });

  global.EMSMappers = Object.freeze({
    // Key utilities
    toCamel: toCamel,
    mapKeys: mapKeys,
    paiseToRupees: paiseToRupees,
    rupeesToPaise: rupeesToPaise,
    formatMoney: formatMoney,
    formatDate: formatDate,
    formatTime: formatTime,
    statusLabel: statusLabel,
    statusColor: statusColor,
    paginate: paginate,
    safeDate: safeDate,

    // Domain mappers
    event: mapEvent,
    eventZone: mapEventZone,
    eventBooking: mapEventBooking,
    movie: mapMovie,
    cinema: mapCinema,
    showtime: mapShowtime,
    seat: mapSeat,
    seatLayout: mapSeatLayout,
    movieBooking: mapMovieBooking,
    turf: mapTurf,
    turfBooking: mapTurfBooking,
    availability: mapAvailability,

    // Admin mappers
    organization: mapOrganization,
    manager: mapManager,
    banner: mapBanner,
    media: mapMedia,
    auditLog: mapAuditLog,
    refund: mapRefund,
    stats: mapStats,
  });

})(window);
