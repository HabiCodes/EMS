/**
 * admin.js — Admin portal service (EXTENDED)
 */
(function () {
  'use strict';
  var _cfg = {};
  try { _cfg = window.EMS_API_CONFIG || {}; } catch (e) {}
  var _base = (_cfg.BASE_URL || '').replace(/\/+$/, '');
  var API_BASE = _base ? (_base + '/api/v1') : '/api/v1';
  var TOKEN_KEY = 'ems_admin_token';
  var NAME_KEY = 'ems_admin_name';
  var EMAIL_KEY = 'ems_admin_email';
  var ROLE_KEY = 'ems_admin_role';
  var PERMS_KEY = 'ems_admin_permissions';

  function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
  function setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }
  function getRole() { try { return localStorage.getItem(ROLE_KEY) || 'admin'; } catch { return 'admin'; } }
  function getPermissions() { try { return JSON.parse(localStorage.getItem(PERMS_KEY) || 'null'); } catch { return null; } }
  function setPermissions(p) { if (p) localStorage.setItem(PERMS_KEY, JSON.stringify(p)); else localStorage.removeItem(PERMS_KEY); }
  function clearSession() { [TOKEN_KEY, NAME_KEY, EMAIL_KEY, ROLE_KEY, PERMS_KEY].forEach(function(k){ try{localStorage.removeItem(k);}catch{} }); }
  function isLoggedIn() { return !!getToken(); }

  function adminHeaders() {
    var h = { 'Content-Type': 'application/json' };
    var t = getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  function withTimeout(url, init, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, ms || 10000);
    return fetch(url, Object.assign({}, init, { signal: controller.signal }))
      .then(function(res){ clearTimeout(timer); return res; })
      .catch(function(err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') return { ok:false, status:0, data:{ message:'Connection timed out.' }, timedOut:true };
        return { ok:false, status:0, data:{ message:'Network error: '+(err.message||'Unknown') } };
      });
  }

  function adminFetch(path, opts) {
    opts = opts || {};
    var url = API_BASE + path;
    var init = { method: opts.method || 'GET', headers: adminHeaders() };
    if (opts.body && init.method !== 'GET' && init.method !== 'HEAD') {
      init.body = JSON.stringify(opts.body);
    }
    return withTimeout(url, init).then(function(res) {
      if (!res.ok && !res.headers) return res;
      var ct = (res.headers && res.headers.get) ? (res.headers.get('content-type') || 'application/json') : 'application/json';
      if (ct.indexOf('application/json') !== -1) {
        return res.json().then(function(data){ return { ok:res.ok, status:res.status, data:data }; });
      }
      return res.text().then(function(t){ return { ok:res.ok, status:res.status, data:{ message:t } }; });
    });
  }

  function login(email, password) {
    return withTimeout(API_BASE + '/admin/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email, password:password}),
    }).then(function(res) {
      if (!res.headers) return res;
      var ct = res.headers.get('content-type') || 'application/json';
      return (ct.indexOf('application/json') !== -1 ? res.json() : res.text().then(function(t){return{message:t};})).then(function(data){
        return { ok:res.ok, status:res.status, data:data };
      });
    });
  }

  function validateSession() {
    return adminFetch('/admin/stats').then(function(r) {
      if (r.ok && r.data && r.data.success && r.data.data) return { valid:true, stats:r.data.data };
      if (r.status===401 || r.status===403) { clearSession(); return { valid:false, reason:'expired' }; }
      return { valid:null, stats:r.data&&r.data.data?r.data.data:null, status:r.status };
    });
  }

  function getMe() { return adminFetch('/admin/me'); }
  function getStats() { return adminFetch('/admin/stats'); }

  function qs(filters) {
    var parts = [];
    Object.keys(filters).forEach(function(k){
      if(filters[k]!==undefined&&filters[k]!==null&&filters[k]!=='') parts.push(encodeURIComponent(k)+'='+encodeURIComponent(filters[k]));
    });
    return parts.length ? '?'+parts.join('&') : '';
  }

  function listBookings(f) { return adminFetch('/admin/bookings'+qs(f)); }
  function cancelBooking(id, reason) { return adminFetch('/admin/bookings/'+id+'/cancel',{method:'POST',body:{reason:reason||'Cancelled by admin'}}); }
  function getBooking(id) { return adminFetch('/admin/bookings/'+id); }
  function recentTickets(limit) { return adminFetch('/admin/recent-tickets'+(limit?'?limit='+encodeURIComponent(limit):'')); }
  function listUsers(f) { return adminFetch('/admin/users'+qs(f)); }
  function getUser(id) { return adminFetch('/admin/users/'+id); }
  function listAdmins(p) { return adminFetch('/admin/admins'+qs(p)); }
  function createAdmin(data) { return adminFetch('/admin/admins',{method:'POST',body:data}); }
  function updateAdmin(id, data) { return adminFetch('/admin/admins/'+id,{method:'PUT',body:data}); }
  function deactivateAdmin(id) { return adminFetch('/admin/admins/'+id+'/deactivate',{method:'POST'}); }
  function reactivateAdmin(id) { return adminFetch('/admin/admins/'+id+'/reactivate',{method:'POST'}); }
  function listAuditLogs(f) { return adminFetch('/admin/audit-logs'+qs(f)); }

  function listEvents(f) { return adminFetch('/admin/events'+qs(f)); }
  function createEvent(data) { return adminFetch('/admin/events',{method:'POST',body:data}); }
  function updateEvent(id, data) { return adminFetch('/admin/events/'+id,{method:'PUT',body:data}); }
  function deleteEvent(id) { return adminFetch('/admin/events/'+id,{method:'DELETE'}); }
  function restoreEvent(id) { return adminFetch('/admin/events/'+id+'/restore',{method:'POST'}); }
  function publishEvent(id) { return adminFetch('/admin/events/'+id+'/publish',{method:'POST'}); }
  function hideEvent(id) { return adminFetch('/admin/events/'+id+'/hide',{method:'POST'}); }
  function cancelEvent(id) { return adminFetch('/admin/events/'+id+'/cancel',{method:'POST'}); }
  function setFeatured(id, val) { return adminFetch('/admin/events/'+id+'/featured',{method:'POST',body:{featured:!!val}}); }
  function getEventDetail(id) { return adminFetch('/admin/events/'+id); }
  function getPendingReview() { return adminFetch('/admin/events/pending-review'); }
  function submitEventForReview(id) { return adminFetch('/admin/events/'+id+'/submit-for-review',{method:'POST'}); }
  function approveEvent(id) { return adminFetch('/admin/events/'+id+'/approve',{method:'POST'}); }
  function rejectEvent(id, reason) { return adminFetch('/admin/events/'+id+'/reject',{method:'POST',body:{reason:reason||''}}); }
  function unpublishEvent(id) { return adminFetch('/admin/events/'+id+'/unpublish',{method:'POST'}); }
  function showEvent(id) { return adminFetch('/admin/events/'+id+'/show',{method:'POST'}); }
  function archiveEvent(id) { return adminFetch('/admin/events/'+id+'/archive',{method:'POST'}); }
  function listEventZones(eid) { return adminFetch('/admin/events/'+eid+'/zones'); }
  function createEventZone(eid, data) { return adminFetch('/admin/events/'+eid+'/zones',{method:'POST',body:data}); }
  function updateEventZone(eid, zid, data) { return adminFetch('/admin/events/'+eid+'/zones/'+zid,{method:'PUT',body:data}); }
  function deleteEventZone(eid, zid) { return adminFetch('/admin/events/'+eid+'/zones/'+zid,{method:'DELETE'}); }

  function listOrganizerApplications(f) { return adminFetch('/admin/organizer-applications'+qs(f)); }
  function getOrganizerApplication(id) { return adminFetch('/admin/organizer-applications/'+id); }
  function reviewOrganizerApplication(id, action, reason) { return adminFetch('/admin/organizer-applications/'+id+'/review',{method:'POST',body:{action:action,reason:reason||''}}); }

  function listOrganizations(f) { return adminFetch('/admin/organizations'+qs(f)); }
  function getOrganization(id) { return adminFetch('/admin/organizations/'+id); }
  function updateOrganization(id, data) { return adminFetch('/admin/organizations/'+id,{method:'PUT',body:data}); }
  function toggleOrganization(id, activate) {
    var ep = activate ? '/admin/organizations/'+id+'/reactivate' : '/admin/organizations/'+id+'/deactivate';
    return adminFetch(ep,{method:'POST'});
  }

  function listManagers(f) { return adminFetch('/admin/managers'+qs(f)); }
  function getManager(id) { return adminFetch('/admin/managers/'+id); }
  function createManager(data) { return adminFetch('/admin/managers',{method:'POST',body:data}); }
  function updateManager(id, data) { return adminFetch('/admin/managers/'+id,{method:'PUT',body:data}); }
  function toggleManager(id, activate) {
    var ep = activate ? '/admin/managers/'+id+'/reactivate' : '/admin/managers/'+id+'/deactivate';
    return adminFetch(ep,{method:'POST'});
  }

  function listAllGrounds(f) { return adminFetch('/admin/turf/grounds'+qs(f)); }
  function getGroundDetail(id) { return adminFetch('/admin/turf/grounds/'+id); }
  function listTurfBookings(f) { return adminFetch('/admin/turf/bookings'+qs(f)); }
  function getTurfBookingDetail(id) { return adminFetch('/admin/turf/bookings/'+id); }
  function getGroundReviews(id) { return adminFetch('/admin/turf/grounds/'+id+'/reviews'); }

  function listCinemas(f) { return adminFetch('/admin/movies/cinemas'+qs(f)); }
  function getCinemaDetail(id) { return adminFetch('/admin/movies/cinemas/'+id); }
  function createCinema(data) { return adminFetch('/admin/movies/cinemas',{method:'POST',body:data}); }
  function updateCinema(id, data) { return adminFetch('/admin/movies/cinemas/'+id,{method:'PUT',body:data}); }
  function deleteCinema(id) { return adminFetch('/admin/movies/cinemas/'+id,{method:'DELETE'}); }
  function listScreens(cid) { return adminFetch('/admin/movies/cinemas/'+cid+'/screens'); }
  function createScreen(cid, data) { return adminFetch('/admin/movies/cinemas/'+cid+'/screens',{method:'POST',body:data}); }
  function updateScreen(cid, sid, data) { return adminFetch('/admin/movies/cinemas/'+cid+'/screens/'+sid,{method:'PUT',body:data}); }
  function deleteScreen(cid, sid) { return adminFetch('/admin/movies/cinemas/'+cid+'/screens/'+sid,{method:'DELETE'}); }
  function listMovies(f) { return adminFetch('/admin/movies'+qs(f)); }
  function getMovieDetail(id) { return adminFetch('/admin/movies/'+id); }
  function createMovie(data) { return adminFetch('/admin/movies',{method:'POST',body:data}); }
  function updateMovie(id, data) { return adminFetch('/admin/movies/'+id,{method:'PUT',body:data}); }
  function deleteMovie(id) { return adminFetch('/admin/movies/'+id,{method:'DELETE'}); }
  function listShowtimes(f) { return adminFetch('/admin/movies/showtimes'+qs(f)); }
  function getShowtimeDetail(id) { return adminFetch('/admin/movies/showtimes/'+id); }
  function createShowtime(data) { return adminFetch('/admin/movies/showtimes',{method:'POST',body:data}); }
  function updateShowtime(id, data) { return adminFetch('/admin/movies/showtimes/'+id,{method:'PUT',body:data}); }
  function deleteShowtime(id) { return adminFetch('/admin/movies/showtimes/'+id,{method:'DELETE'}); }

  function listBanners(f) { return adminFetch('/admin/banners'+qs(f)); }
  function getBanner(id) { return adminFetch('/admin/banners/'+id); }
  function createBanner(data) { return adminFetch('/admin/banners',{method:'POST',body:data}); }
  function updateBanner(id, data) { return adminFetch('/admin/banners/'+id,{method:'PUT',body:data}); }
  function deleteBanner(id) { return adminFetch('/admin/banners/'+id,{method:'DELETE'}); }
  function activateBanner(id) { return adminFetch('/admin/banners/'+id+'/activate',{method:'POST'}); }
  function deactivateBanner(id) { return adminFetch('/admin/banners/'+id+'/deactivate',{method:'POST'}); }
  function toggleBanner(id, activate) { return activate !== false ? activateBanner(id) : deactivateBanner(id); }

  function listMedia(f) { return adminFetch('/admin/media'+qs(f)); }
  function getMedia(id) { return adminFetch('/admin/media/'+id); }
  function createMedia(data) { return adminFetch('/admin/media',{method:'POST',body:data}); }
  function updateMedia(id, data) { return adminFetch('/admin/media/'+id,{method:'PUT',body:data}); }
  function deleteMedia(id) { return adminFetch('/admin/media/'+id,{method:'DELETE'}); }
  function listEventMedia(eid) { return adminFetch('/admin/events/'+eid+'/media'); }
  function attachEventMedia(eid, mid, opts) {
    opts=opts||{};
    return adminFetch('/admin/events/'+eid+'/media',{method:'POST',body:Object.assign({media_id:mid},opts)});
  }
  function detachEventMedia(eid, mid) { return adminFetch('/admin/events/'+eid+'/media/'+mid,{method:'DELETE'}); }
  function reorderEventMedia(eid, mids) { return adminFetch('/admin/events/'+eid+'/media/reorder',{method:'POST',body:{mediaIds:mids}}); }
  function uploadFile(file, folder) {
    folder=folder||'general';
    var fd = new FormData();
    fd.append('file',file); fd.append('folder',folder);
    var t=getToken();
    return fetch(API_BASE+'/admin/uploads',{method:'POST',headers:t?{'Authorization':'Bearer '+t}:{},body:fd}).then(function(res){
      return res.json().then(function(data){ return {ok:res.ok,status:res.status,data:data}; });
    });
  }

  function listPromotionPackages(f) { return adminFetch('/admin/promotions/packages'+qs(f)); }
  function getPromotionPackage(id) { return adminFetch('/admin/promotions/packages/'+id); }
  function createPromotionPackage(data) { return adminFetch('/admin/promotions/packages',{method:'POST',body:data}); }
  function updatePromotionPackage(id, data) { return adminFetch('/admin/promotions/packages/'+id,{method:'PUT',body:data}); }
  function deletePromotionPackage(id) { return adminFetch('/admin/promotions/packages/'+id,{method:'DELETE'}); }
  function listCampaigns(f) { return adminFetch('/admin/promotions/campaigns'+qs(f)); }
  function getCampaign(id) { return adminFetch('/admin/promotions/campaigns/'+id); }
  function reviewCampaign(id, action, reason) { return adminFetch('/admin/promotions/campaigns/'+id+'/review',{method:'POST',body:{action:action,reason:reason||''}}); }
  function _toggleCampaign(id, activate) {
    var ep = activate ? '/admin/promotions/campaigns/'+id+'/activate' : '/admin/promotions/campaigns/'+id+'/deactivate';
    return adminFetch(ep,{method:'POST'});
  }
  // keep original name as alias for backward compat within admin.js
  function toggleCampaign(id, activate) { return _toggleCampaign(id, activate); }
  function getPromotionAnalytics(f) { return adminFetch('/admin/promotions/analytics'+qs(f)); }

  function listRefunds(f) { return adminFetch('/admin/refunds'+qs(f)); }
  function getRefund(id) { return adminFetch('/admin/refunds/'+id); }
  function createRefund(data) { return adminFetch('/admin/refunds',{method:'POST',body:data}); }

  // ════════════════════════════════════════════════════════════════════════
  // Compatibility aliases — frontend uses legacy names, backend uses new ones
  // ════════════════════════════════════════════════════════════════════════
  function getTurfs(f) { return listAllGrounds(f); }
  function getTurf(id) { return getGroundDetail(id); }
  function getTurfBookings(f) { return listTurfBookings(f); }
  function getTurfBooking(id) { return getTurfBookingDetail(id); }
  function toggleTurfStatus(id) {
    return Promise.resolve({ ok:false, status:0, data:{ message:'Turf status toggle is not supported by the backend.' }});
  }
  function updateTurf(id, data) {
    return Promise.resolve({ ok:false, status:0, data:{ message:'Turf update is not supported by the backend.' }});
  }
  function getCinemas(f) { return listCinemas(f); }
  function getCinema(id) { return getCinemaDetail(id); }
  function getMovies(f) { return listMovies(f); }
  function getMovie(id) { return getMovieDetail(id); }
  function getShowtimes(f) { return listShowtimes(f); }
  function getShowtime(id) { return getShowtimeDetail(id); }
  function getMedia(f) { return listMedia(f); }
  function getPackages(f) { return listPromotionPackages(f); }
  function getPackage(id) { return getPromotionPackage(id); }
  function updatePackage(id, data) { return updatePromotionPackage(id, data); }
  function getCampaigns(f) { return listCampaigns(f); }
  function approveCampaign(id) { return reviewCampaign(id, 'approve', ''); }
  function rejectCampaign(id) { return reviewCampaign(id, 'reject', ''); }
  function toggleCampaign(id, activate) { return _toggleCampaign(id, !!activate); }
  function getRefunds(f) { return listRefunds(f); }
  function getAuditLogs(f) { return listAuditLogs(f); }
  function getEvents(f) { return listEvents(f); }
  function getEvent(id) { return getEventDetail(id); }
  function getPendingEvents() { return getPendingReview(); }
  function getApplications(f) { return listOrganizerApplications(f); }
  function getOrganizations(f) { return listOrganizations(f); }
  function toggleOrganizationStatus(id) { return toggleOrganization(id, true); }
  function deleteOrganization(id) {
    return Promise.resolve({ ok:false, status:0, data:{ message:'Organization deletion is not supported by the backend.' }});
  }
  function getManagers(f) { return listManagers(f); }
  function toggleManagerStatus(id) { return toggleManager(id, true); }
  function getAdmins(f) { return listAdmins(f); }
  function toggleAdminStatus(id) {
    return Promise.resolve({ ok:false, status:0, data:{ message:'Admin status toggle is not supported by the backend. Use deactivate/reactivate.' }});
  }
  function getBookings(f) { return listBookings(f); }
  function toggleUserStatus(id) {
    return Promise.resolve({ ok:false, status:0, data:{ message:'User status toggle is not supported by the backend.' }});
  }
  function approveRefund(id) {
    return Promise.resolve({ ok:false, status:0, data:{ message:'Refund approval is not supported by the backend.' }});
  }

  window.EMS_ADMIN = {
    API_BASE:API_BASE, login:login, validateSession:validateSession, isLoggedIn:isLoggedIn,
    getToken:getToken, setToken:setToken, getRole:getRole, getPermissions:getPermissions,
    setPermissions:setPermissions, clearSession:clearSession,
    getMe:getMe, getStats:getStats,
    listBookings:listBookings, cancelBooking:cancelBooking, getBooking:getBooking, recentTickets:recentTickets,
    listUsers:listUsers, getUser:getUser,
    listAdmins:listAdmins, createAdmin:createAdmin, updateAdmin:updateAdmin,
    deactivateAdmin:deactivateAdmin, reactivateAdmin:reactivateAdmin,
    listAuditLogs:listAuditLogs,
    listEvents:listEvents, createEvent:createEvent, updateEvent:updateEvent, deleteEvent:deleteEvent,
    restoreEvent:restoreEvent, publishEvent:publishEvent, hideEvent:hideEvent, cancelEvent:cancelEvent,
    setFeatured:setFeatured, getEventDetail:getEventDetail, getPendingReview:getPendingReview,
    submitEventForReview:submitEventForReview, approveEvent:approveEvent, rejectEvent:rejectEvent,
    unpublishEvent:unpublishEvent, showEvent:showEvent, archiveEvent:archiveEvent,
    listEventZones:listEventZones, createEventZone:createEventZone, updateEventZone:updateEventZone, deleteEventZone:deleteEventZone,
    listOrganizerApplications:listOrganizerApplications, getOrganizerApplication:getOrganizerApplication,
    reviewOrganizerApplication:reviewOrganizerApplication,
    listOrganizations:listOrganizations, getOrganization:getOrganization, updateOrganization:updateOrganization, toggleOrganization:toggleOrganization,
    listManagers:listManagers, getManager:getManager, createManager:createManager, updateManager:updateManager, toggleManager:toggleManager,
    listAllGrounds:listAllGrounds, getGroundDetail:getGroundDetail, listTurfBookings:listTurfBookings,
    getTurfBookingDetail:getTurfBookingDetail, getGroundReviews:getGroundReviews,
    listCinemas:listCinemas, getCinemaDetail:getCinemaDetail, createCinema:createCinema,
    updateCinema:updateCinema, deleteCinema:deleteCinema,
    listScreens:listScreens, createScreen:createScreen, updateScreen:updateScreen, deleteScreen:deleteScreen,
    listMovies:listMovies, getMovieDetail:getMovieDetail, createMovie:createMovie, updateMovie:updateMovie, deleteMovie:deleteMovie,
    listShowtimes:listShowtimes, getShowtimeDetail:getShowtimeDetail, createShowtime:createShowtime, updateShowtime:updateShowtime, deleteShowtime:deleteShowtime,
    listBanners:listBanners, getBanner:getBanner, createBanner:createBanner, updateBanner:updateBanner,
    deleteBanner:deleteBanner, activateBanner:activateBanner, deactivateBanner:deactivateBanner, toggleBanner:toggleBanner,
    listMedia:listMedia, getMedia:getMedia, createMedia:createMedia, updateMedia:updateMedia, deleteMedia:deleteMedia,
    listEventMedia:listEventMedia, attachEventMedia:attachEventMedia, detachEventMedia:detachEventMedia, reorderEventMedia:reorderEventMedia, uploadFile:uploadFile,
    listPromotionPackages:listPromotionPackages, getPromotionPackage:getPromotionPackage, createPromotionPackage:createPromotionPackage,
    updatePromotionPackage:updatePromotionPackage, deletePromotionPackage:deletePromotionPackage,
    listCampaigns:listCampaigns, getCampaign:getCampaign, reviewCampaign:reviewCampaign, toggleCampaign:toggleCampaign,
    getPromotionAnalytics:getPromotionAnalytics,
    listRefunds:listRefunds, getRefund:getRefund, createRefund:createRefund,

    // ── Compatibility aliases for frontend ──────────────────────────────
    getTurfs:getTurfs, getTurf:getTurf, getTurfBookings:getTurfBookings, getTurfBooking:getTurfBooking,
    toggleTurfStatus:toggleTurfStatus, updateTurf:updateTurf,
    getCinemas:getCinemas, getCinema:getCinema,
    getMovies:getMovies, getMovie:getMovie,
    getShowtimes:getShowtimes, getShowtime:getShowtime,
    getMedia:getMedia,
    getPackages:getPackages, getPackage:getPackage, updatePackage:updatePackage,
    getCampaigns:getCampaigns, approveCampaign:approveCampaign, rejectCampaign:rejectCampaign,
    getRefunds:getRefunds, getAuditLogs:getAuditLogs,
    getEvents:getEvents, getEvent:getEvent, getPendingEvents:getPendingEvents,
    getApplications:getApplications,
    getOrganizations:getOrganizations, toggleOrganizationStatus:toggleOrganizationStatus, deleteOrganization:deleteOrganization,
    getManagers:getManagers, toggleManagerStatus:toggleManagerStatus,
    getAdmins:getAdmins, toggleAdminStatus:toggleAdminStatus,
    getBookings:getBookings, toggleUserStatus:toggleUserStatus, approveRefund:approveRefund,
  };
})();
