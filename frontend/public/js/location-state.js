/**
 * location-state.js — Global district / location state for EMS frontend.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'ems_selected_location';
  var LEGACY_KEY_NAME = 'ems_global_location_name';
  var LEGACY_KEY_CODE = 'ems_global_location_code';
  var EVENT_NAME = 'ems:location-changed';
  var DEFAULT_DISTRICT = 'Coimbatore';

  // Districts with codes (matches project convention)
  var TN_DISTRICTS = [
    { name: 'Ariyalur', code: 'AR' }, { name: 'Chengalpattu', code: 'CHG' }, { name: 'Chennai', code: 'CHN' },
    { name: 'Coimbatore', code: 'CBE' }, { name: 'Cuddalore', code: 'CUD' }, { name: 'Dharmapuri', code: 'DHP' },
    { name: 'Dindigul', code: 'DGL' }, { name: 'Erode', code: 'ERD' }, { name: 'Kallakurichi', code: 'KLK' },
    { name: 'Kancheepuram', code: 'KAN' }, { name: 'Kanyakumari', code: 'KNY' }, { name: 'Karur', code: 'KRR' },
    { name: 'Krishnagiri', code: 'KRI' }, { name: 'Madurai', code: 'MDU' }, { name: 'Mayiladuthurai', code: 'MYL' },
    { name: 'Nagapattinam', code: 'NGP' }, { name: 'Namakkal', code: 'NMK' }, { name: 'Perambalur', code: 'PRB' },
    { name: 'Pudukkottai', code: 'PDK' }, { name: 'Ramanathapuram', code: 'RMD' }, { name: 'Ranipet', code: 'RPT' },
    { name: 'Salem', code: 'SLM' }, { name: 'Sivaganga', code: 'SVG' }, { name: 'Tenkasi', code: 'TKS' },
    { name: 'Thanjavur', code: 'TNJ' }, { name: 'Theni', code: 'THN' }, { name: 'Thiruvallur', code: 'TRL' },
    { name: 'Thiruvarur', code: 'TRR' }, { name: 'Thoothukudi', code: 'TUT' }, { name: 'Tiruchirappalli', code: 'TRC' },
    { name: 'Tirunelveli', code: 'TEN' }, { name: 'Tirupathur', code: 'TPT' }, { name: 'Tiruppur', code: 'TUP' },
    { name: 'Tiruvannamalai', code: 'TVM' }, { name: 'The Nilgiris', code: 'NIL' }, { name: 'Vellore', code: 'VLR' },
    { name: 'Viluppuram', code: 'VPM' }, { name: 'Virudhunagar', code: 'VRD' }
  ];

  var current = null;
  var listeners = [];
  var overlayEl = null;
  var overlayState = { onSelect: null };

  function shortCode(name) {
    return name ? name.substring(0, 3).toUpperCase() : '';
  }

  function findDistrict(name) {
    if (!name) return null;
    var trimmed = name.trim();
    if (!trimmed) return null;
    for (var i = 0; i < TN_DISTRICTS.length; i++) {
      if (TN_DISTRICTS[i].name.toLowerCase() === trimmed.toLowerCase()) return TN_DISTRICTS[i];
    }
    return { name: trimmed, code: shortCode(trimmed) };
  }

  function persist(name, code) {
    try {
      if (name) {
        localStorage.setItem(STORAGE_KEY, name);
        localStorage.setItem(LEGACY_KEY_NAME, name);
        if (code) localStorage.setItem(LEGACY_KEY_CODE, code);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_KEY_NAME);
        localStorage.removeItem(LEGACY_KEY_CODE);
      }
    } catch (e) {}
  }

  function readPersisted() {
    try {
      var val = localStorage.getItem(STORAGE_KEY);
      if (val) return val;
      var legacyName = localStorage.getItem(LEGACY_KEY_NAME);
      if (legacyName) return legacyName;
    } catch (e) {}
    return null;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function dispatch(source) {
    var detail = {
      name: current ? current.name : null,
      code: current ? current.code : null,
      source: source || 'manual',
    };
    try { window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: detail })); } catch (e) {}
    listeners.forEach(function (fn) { try { fn(detail); } catch (err) {} });
  }

  // ── Public API ──────────────────────────────────────────────────

  function getSelected() {
    return current ? { name: current.name, code: current.code } : null;
  }

  function getAllDistricts() { return TN_DISTRICTS.slice(); }

  function setSelected(name, opts) {
    opts = opts || {};
    if (!name || typeof name !== 'string') return false;
    var district = findDistrict(name);
    if (!district) return false;
    var prev = current ? current.name : null;
    current = { name: district.name, code: district.code };
    persist(district.name, district.code);
    if (!opts.silent && prev !== district.name) dispatch('setSelected');
    return true;
  }

  function clearSelected() {
    var prev = current ? current.name : null;
    current = null;
    persist(null);
    if (prev !== null) dispatch('clearSelected');
  }

  function onChange(handler) {
    if (typeof handler !== 'function') return function () {};
    listeners.push(handler);
    return function () {
      var idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  // ── Overlay ─────────────────────────────────────────────────────

  function ensureOverlay() {
    if (overlayEl) return overlayEl;

    var style = document.createElement('style');
    style.id = 'ems-loc-overlay-style';
    style.textContent = [
      '.ems-loc-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,15,15,0.55);backdrop-filter:blur(6px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',
      '.ems-loc-overlay__panel{background:#fff;width:100%;max-width:480px;border-radius:20px;box-shadow:0 24px 48px -12px rgba(0,0,0,0.25);overflow:hidden;transform:translateY(8px) scale(0.98);opacity:0;transition:transform .25s ease,opacity .25s ease;}',
      '.ems-loc-overlay__panel.is-open{transform:translateY(0) scale(1);opacity:1;}',
      '.ems-loc-overlay__hero{position:relative;padding:32px 28px 24px;background:linear-gradient(135deg,#FA580B 0%,#D94F00 100%);color:#fff;overflow:hidden;}',
      '.ems-loc-overlay__hero::after{content:"";position:absolute;top:-40px;right:-40px;width:140px;height:140px;background:rgba(255,255,255,0.12);border-radius:50%;}',
      '.ems-loc-overlay__hero::before{content:"";position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;background:rgba(255,255,255,0.08);border-radius:50%;}',
      '.ems-loc-overlay__hero h2{position:relative;z-index:2;font-size:22px;font-weight:700;margin:0 0 6px;}',
      '.ems-loc-overlay__hero p{position:relative;z-index:2;font-size:14px;margin:0;opacity:0.92;}',
      '.ems-loc-overlay__hero-icon{position:absolute;top:24px;right:24px;z-index:2;width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:20px;}',
      '.ems-loc-overlay__body{padding:24px 28px 28px;}',
      '.ems-loc-overlay__btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 18px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;border:none;transition:all .2s ease;margin-bottom:10px;font-family:inherit;}',
      '.ems-loc-overlay__btn--primary{background:#FA580B;color:#fff;box-shadow:0 6px 16px -4px rgba(250,88,11,0.4);}',
      '.ems-loc-overlay__btn--primary:hover{background:#D94F00;transform:translateY(-1px);}',
      '.ems-loc-overlay__btn--secondary{background:#f3f4f6;color:#0126A5;border:1px solid #e5e7eb;}',
      '.ems-loc-overlay__btn--secondary:hover{background:#e5e7eb;}',
      '.ems-loc-overlay__divider{display:flex;align-items:center;gap:10px;margin:18px 0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;}',
      '.ems-loc-overlay__divider::before,.ems-loc-overlay__divider::after{content:"";flex:1;height:1px;background:#e5e7eb;}',
      '.ems-loc-overlay__search{position:relative;margin-bottom:14px;}',
      '.ems-loc-overlay__search input{width:100%;padding:12px 14px 12px 40px;border-radius:10px;border:1px solid #d1d5db;font-size:14px;outline:none;transition:border-color .15s ease;font-family:inherit;}',
      '.ems-loc-overlay__search input:focus{border-color:#FA580B;box-shadow:0 0 0 3px rgba(250,88,11,0.12);}',
      '.ems-loc-overlay__search i{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:14px;}',
      '.ems-loc-overlay__list{max-height:260px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:10px;background:#fff;}',
      '.ems-loc-overlay__list-item{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;font-size:14px;color:#0126A5;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background .12s ease;}',
      '.ems-loc-overlay__list-item:last-child{border-bottom:0;}',
      '.ems-loc-overlay__list-item:hover{background:#fff7f3;}',
      '.ems-loc-overlay__list-item.is-selected{background:#fff7f3;color:#FA580B;font-weight:700;}',
      '.ems-loc-overlay__list-item .code{font-size:11px;color:#9ca3af;font-weight:600;}',
      '.ems-loc-overlay__list-item.is-selected .code{color:#FA580B;}',
      '.ems-loc-overlay__manual{padding-top:8px;}',
      '.ems-loc-overlay__empty{padding:24px;text-align:center;color:#9ca3af;font-size:13px;}',
      '.ems-loc-overlay__hint{font-size:12px;color:#6b7280;margin-top:12px;line-height:1.5;}',
      '.ems-loc-overlay__close{position:absolute;top:14px;right:14px;z-index:3;width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .15s ease;}',
      '.ems-loc-overlay__close:hover{background:rgba(255,255,255,0.3);}',
      '@media(max-width:520px){.ems-loc-overlay__hero{padding:28px 22px 22px;}.ems-loc-overlay__body{padding:20px 22px 24px;}.ems-loc-overlay__hero h2{font-size:20px;}}',
    ].join('');
    if (!document.getElementById('ems-loc-overlay-style')) {
      document.head.appendChild(style);
    }

    overlayEl = document.createElement('div');
    overlayEl.className = 'ems-loc-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-labelledby', 'ems-loc-overlay-title');
    overlayEl.innerHTML = [
      '<div class="ems-loc-overlay__panel" data-panel>',
        '<div class="ems-loc-overlay__hero">',
          '<div class="ems-loc-overlay__hero-icon"><i class="fa-solid fa-location-dot"></i></div>',
          '<button class="ems-loc-overlay__close" type="button" aria-label="Close" data-close><i class="fa-solid fa-xmark"></i></button>',
          '<h2 id="ems-loc-overlay-title">Choose your district</h2>',
          '<p>We use this to show venues, events, and movies near you.</p>',
        '</div>',
        '<div class="ems-loc-overlay__body">',
          '<button type="button" class="ems-loc-overlay__btn ems-loc-overlay__btn--primary" data-auto>',
            '<i class="fa-solid fa-location-crosshairs"></i> Use my current location',
          '</button>',
          '<div class="ems-loc-overlay__divider">or pick manually</div>',
          '<div class="ems-loc-overlay__manual">',
            '<div class="ems-loc-overlay__search">',
              '<i class="fa-solid fa-magnifying-glass"></i>',
              '<input type="text" placeholder="Search Tamil Nadu districts..." data-search>',
            '</div>',
            '<div class="ems-loc-overlay__list" data-list></div>',
          '</div>',
          '<p class="ems-loc-overlay__hint">',
            '<i class="fa-solid fa-circle-info" style="color:#FA580B"></i> ',
            'Your selection is stored on this device only. We don\'t track your GPS.',
          '</p>',
        '</div>',
      '</div>',
    ].join('');

    overlayEl.addEventListener('click', function (e) {
      if (e.target === overlayEl || e.target.hasAttribute('data-close')) {
        hideOverlay();
      }
    });

    var panel = overlayEl.querySelector('[data-panel]');
    var listEl = overlayEl.querySelector('[data-list]');
    var searchEl = overlayEl.querySelector('[data-search]');
    var autoBtn = overlayEl.querySelector('[data-auto]');

    function paintList(filter) {
      var sel = getSelected();
      var q = (filter || '').toLowerCase().trim();
      var items = TN_DISTRICTS.filter(function (d) { return !q || d.name.toLowerCase().includes(q); });
      if (items.length === 0) {
        listEl.innerHTML = '<div class="ems-loc-overlay__empty">No districts match "' + escapeHtml(filter) + '"</div>';
        return;
      }
      listEl.innerHTML = items.map(function (d) {
        var isSel = sel && sel.name === d.name;
        return '<div class="ems-loc-overlay__list-item' + (isSel ? ' is-selected' : '') + '" data-name="' + escapeHtml(d.name) + '">'
          + '<span>' + escapeHtml(d.name) + '</span>'
          + '<span class="code">' + escapeHtml(d.code) + '</span>'
          + '</div>';
      }).join('');
    }

    listEl.addEventListener('click', function (e) {
      var item = e.target.closest('[data-name]');
      if (!item) return;
      var name = item.getAttribute('data-name');
      setSelected(name);
      if (typeof overlayState.onSelect === 'function') {
        overlayState.onSelect({ name: name, source: 'overlay' });
      }
      hideOverlay();
    });

    searchEl.addEventListener('input', function (e) { paintList(e.target.value); });

    autoBtn.addEventListener('click', function () {
      attemptGeolocation(function (resolvedName) {
        if (resolvedName) {
          setSelected(resolvedName);
          if (typeof overlayState.onSelect === 'function') {
            overlayState.onSelect({ name: resolvedName, source: 'geolocation' });
          }
          hideOverlay();
        } else {
          setSelected(DEFAULT_DISTRICT);
          paintList('');
        }
      });
    });

    overlayEl._paintList = paintList;

    document.body.appendChild(overlayEl);

    requestAnimationFrame(function () { panel.classList.add('is-open'); });

    return overlayEl;
  }

  function attemptGeolocation(cb) {
    if (!navigator.geolocation) { if (typeof cb === 'function') cb(null); return; }
    var timeout = setTimeout(function () { if (typeof cb === 'function') cb(null); }, 8000);
    navigator.geolocation.getCurrentPosition(function (pos) {
      clearTimeout(timeout);
      var lat = pos && pos.coords ? pos.coords.latitude : null;
      var lon = pos && pos.coords ? pos.coords.longitude : null;
      if (lat == null || lon == null) { if (typeof cb === 'function') cb(null); return; }
      var approx = resolveDistrictByCoords(lat, lon);
      if (typeof cb === 'function') cb(approx);
    }, function () {
      clearTimeout(timeout);
      if (typeof cb === 'function') cb(null);
    }, { timeout: 7000, maximumAge: 60 * 60 * 1000 });
  }

  function resolveDistrictByCoords(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    if (lat < 8.0 || lat > 13.7 || lon < 76.0 || lon > 80.5) return null;
    var cities = [
      ['Chennai',13.0827,80.2707,0.45],['Coimbatore',11.0168,76.9558,0.45],
      ['Madurai',9.9252,78.1198,0.45],['Tiruchirappalli',10.7905,78.7047,0.45],
      ['Salem',11.6643,78.1460,0.45],['Tirunelveli',8.7139,77.7567,0.45],
      ['Erode',11.3410,77.7172,0.45],['Vellore',12.9165,79.1325,0.45],
      ['Thanjavur',10.7867,79.1378,0.45],['Dindigul',10.3673,77.9803,0.45],
      ['Kanchipuram',12.8342,79.7036,0.40],['Tiruppur',11.1085,77.3411,0.40],
      ['Kanyakumari',8.0883,77.5385,0.45],['Cuddalore',11.7480,79.7714,0.40],
      ['Karur',10.9601,78.0766,0.40],['Namakkal',11.2186,78.1677,0.40],
      ['Villupuram',11.9395,79.4924,0.40],
    ];
    var best = null, bestDist = Infinity;
    for (var i = 0; i < cities.length; i++) {
      var c = cities[i];
      var d = Math.hypot(c[1] - lat, c[2] - lon);
      if (d < c[3] && d < bestDist) { bestDist = d; best = c[0]; }
    }
    return best;
  }

  function showOverlay(opts) {
    opts = opts || {};
    overlayState.onSelect = opts.onSelect || null;
    var el = ensureOverlay();
    el.style.display = 'flex';
    el.querySelector('[data-panel]').classList.add('is-open');
    el._paintList('');
    var searchInput = el.querySelector('[data-search]');
    if (searchInput) setTimeout(function () { searchInput.focus(); }, 60);
    document.body.style.overflow = 'hidden';
  }

  function hideOverlay() {
    if (!overlayEl) return;
    overlayEl.style.display = 'none';
    document.body.style.overflow = '';
  }

  function syncAllDisplays() {
    var sel = getSelected();
    var name = sel ? sel.name : DEFAULT_DISTRICT;
    var code = sel ? sel.code : shortCode(DEFAULT_DISTRICT);
    document.querySelectorAll('[data-location-target="name"]').forEach(function (el) {
      el.textContent = name;
    });
    document.querySelectorAll('[data-location-target="code"]').forEach(function (el) {
      el.textContent = code;
    });
  }

  // ── Init ────────────────────────────────────────────────────────

  function init() {
    var stored = readPersisted();
    if (stored) {
      var district = findDistrict(stored);
      current = district ? { name: district.name, code: district.code } : { name: stored, code: shortCode(stored) };
    } else {
      current = null;
    }

    // Wire data-location-open buttons
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-location-open]')) {
        e.preventDefault();
        e.stopPropagation();
        showOverlay();
      }
    });

    // Wire legacy #desktopLoc / #mobileLoc triggers
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#desktopLoc, #mobileLoc, [data-legacy-loc-trigger]')) return;
      if (e.target.closest('#locationDropdown') || e.target.closest('[data-location-search]')) return;
      e.preventDefault();
      showOverlay();
    });

    onChange(function () { syncAllDisplays(); });

    global.addEventListener('storage', function (e) {
      if (e.key !== STORAGE_KEY && e.key !== LEGACY_KEY_NAME) return;
      if (e.newValue) setSelected(e.newValue, { source: 'storage' });
      else clearSelected();
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', syncAllDisplays);
    } else {
      syncAllDisplays();
    }
  }

  // ── Backend integration ─────────────────────────────────────────
  // The backend exposes /api/v1/districts (list) and /api/v1/cities?district= (cities in district).
  // We cache results so page scripts can map the user's district name -> district_id / city_id.

  var districtCache = null;
  var cityCache = {};
  var CITY_CACHE_TTL_MS = 30 * 60 * 1000;
  var DISTRICT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  function callApi(path, opts) {
    var API = global.EMSApi;
    if (!API || typeof API.get !== 'function') return Promise.resolve({ ok: false, status: 0, data: {} });
    return API.get(path, opts || {});
  }

  function pickIdNameArray(payload) {
    var arr = payload;
    if (!arr && payload && typeof payload === 'object') {
      if (Array.isArray(payload.data)) arr = payload.data;
      else if (payload.data && Array.isArray(payload.data.data)) arr = payload.data.data;
      else if (Array.isArray(payload.data && payload.data.items)) arr = payload.data.items;
      else if (Array.isArray(payload.items)) arr = payload.items;
      else if (Array.isArray(payload.districts)) arr = payload.districts;
      else if (Array.isArray(payload.cities)) arr = payload.cities;
    }
    return Array.isArray(arr) ? arr : [];
  }

  function fetchDistricts(force) {
    if (!force && districtCache && (Date.now() - districtCache.loadedAt) < DISTRICT_CACHE_TTL_MS) {
      return Promise.resolve(districtCache.items);
    }
    return callApi('/districts').then(function (r) {
      var items = pickIdNameArray(r && r.data);
      districtCache = { loadedAt: Date.now(), items: items };
      if (items.length) {
        TN_DISTRICTS.length = 0;
        items.forEach(function (x) {
          var n = x && (x.name || x.district || x.district_name);
          if (n) TN_DISTRICTS.push({ name: n, code: x.code || x.short_code || shortCode(n) });
        });
      }
      return items;
    }).catch(function () { return districtCache ? districtCache.items : []; });
  }

  function fetchCitiesByDistrict(districtNameOrId, force) {
    var key = String(districtNameOrId || '');
    if (!force && cityCache[key] && (Date.now() - cityCache[key].loadedAt) < CITY_CACHE_TTL_MS) {
      return Promise.resolve(cityCache[key].items);
    }
    var params = { district: key };
    return callApi('/cities', { query: params }).then(function (r) {
      var items = pickIdNameArray(r && r.data);
      cityCache[key] = { loadedAt: Date.now(), items: items };
      return items;
    }).catch(function () { return cityCache[key] ? cityCache[key].items : []; });
  }

  function getSelectedDistrictId() {
    return fetchDistricts().then(function (items) {
      var sel = getSelected();
      if (!sel || !sel.name) return null;
      var n = sel.name.toLowerCase();
      for (var i = 0; i < items.length; i++) {
        var nm = (items[i] && (items[i].name || items[i].district || items[i].district_name)) || '';
        if (typeof nm === 'string' && nm.toLowerCase() === n) {
          return items[i].id != null ? items[i].id : items[i]._id;
        }
      }
      return null;
    });
  }

  function getSelectedCityId() {
    return getSelectedDistrictId().then(function (districtId) {
      if (!districtId) return null;
      return fetchCitiesByDistrict(districtId).then(function (cities) {
        return cities.length ? (cities[0].id != null ? cities[0].id : cities[0]._id) : null;
      });
    });
  }

  global.EMS_LOCATION = {
    STORAGE_KEY: STORAGE_KEY,
    EVENT_NAME: EVENT_NAME,
    DEFAULT_DISTRICT: DEFAULT_DISTRICT,
    TN_DISTRICTS: TN_DISTRICTS,
    getSelected: getSelected,
    getAllDistricts: getAllDistricts,
    setSelected: setSelected,
    clearSelected: clearSelected,
    onChange: onChange,
    showOverlay: showOverlay,
    hideOverlay: hideOverlay,
    syncAllDisplays: syncAllDisplays,
    resolveDistrictByCoords: resolveDistrictByCoords,
    attemptGeolocation: attemptGeolocation,
    fetchDistricts: fetchDistricts,
    fetchCitiesByDistrict: fetchCitiesByDistrict,
    getSelectedDistrictId: getSelectedDistrictId,
    getSelectedCityId: getSelectedCityId,
    init: init,
  };

  // Alias for backward compatibility with HTML onclick handlers
  global.EMSLocation = global.EMS_LOCATION;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
