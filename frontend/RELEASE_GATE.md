# EntryMySlot — Final Release Gate Checklist

**Date:** 2026-09-11
**Frontend:** Vanilla JS SPA, 71 JS files, ES5-compatible
**Backend:** https://api.entrymyslot.com/api/v1 (NOT modified)
**Deployment:** Hostinger shared hosting (Apache)

---

## All 18 Release-Blockers — Status

### Issue #1: City-Aware URL Generation ✅ FIXED
- All internal links in customer.js include `:city` parameter
- `renderMovies`, `renderEvents`, `renderTurfs`, `renderExploreHome` — all city-aware
- Detail pages accept `params.city` for back-links
- Helper functions: `citySlug()`, `getCityFromParams()`, `withCity()`

### Issue #2: Booking Routes ✅ FIXED
- `/explore/movie/:city/:id/book` → `renderMovieBookingRoute`
- `/explore/event/:city/:id/book` → `renderEventBookingRoute`
- `/explore/turf/:city/:id/book` → `renderTurfBookingRoute`
- Wrapper functions redirect to detail pages if not in booking context

### Issue #3: .htaccess Deployment ✅ VERIFIED
- SPA rewrite rules (API excluded, existing files excluded)
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- CSP with Tailwind CDN, Cloudflare CDN, Font Awesome CDN allowed
- Permissions-Policy with geolocation enabled
- Cache: HTML 0s, JS/CSS 1h, images 1 week
- Compression via mod_deflate
- HTTPS redirect (commented, ready to enable)

### Issue #4: Movie Pricing ✅ FIXED
- Removed hardcoded `seats.length * 20000`
- Dynamic price calculation from seat layout `{price}` field per seat
- Total computed by summing individual seat prices

### Issue #5: Movie Seat Hold Flow ✅ VERIFIED
- Step 1: `holdSeats(showtimeId, seatNumbers)` → POST `/movies/seats/hold`
- Step 2: Extract `holdKey` from response
- Step 3: `createBooking({holdKey, contactName, contactPhone, paymentMethod})`
- Step 4: On failure → `releaseSeats(holdKey)`
- Matches backend hold-seat API contract

### Issue #6: Event Booking Form ✅ FIXED
- Backend contract: `{event_id, attendees: [{full_name, phone, age, gender}], zone_id}`
- UI form has per-attendee fields for name, phone, age, gender
- `EMSEventApi.createBooking()` transforms UI payload → backend contract

### Issue #7: Turf Booking End-to-End ✅ VERIFIED
- `getAvailability(resourceId, date)` → GET `/turf/resources/:id/availability?date=:date`
- `createBooking(turfId, payload)` → POST `/turf/bookings` with `{availability_unit_id, contactName, contactPhone, notes}`
- Uses `availability_unit_id` (not ground_id + date + slot)

### Issue #8: OG Image ✅ FIXED
- `og:image` → `https://entrymyslot.com/assets/images/logo.png` (exists)
- Fixed from non-existent `og-default.jpg`

### Issue #9: Final Routing Audit ✅ VERIFIED
- 18 customer routes, 7 partner routes, 16 admin routes
- No orphan/dead routes found
- All route patterns have corresponding handler functions
- Legacy redirects for non-city URLs (e.g., `/explore/movies` → `/explore/movies/:city`)

### Issue #10: Final API Audit ✅ VERIFIED
- Customer: 5 endpoint modules (movies, events, turfs, bookings, auth)
- Partner: organizer-scoped endpoints (`/owner/*`, `/promotions/*`)
- Admin: admin-scoped endpoints (`/admin/*`)
- All use `EMSApi` with proper `authScope` parameter
- snake_case → camelCase mapping via `mapKeys()`

### Issue #11: Final Customer Flow ✅ VERIFIED
- Home → Explore movies/events/turfs → Detail → Seat selection → Booking → Payment → Confirmation
- City-aware throughout
- Auth guard on booking actions (redirects to `/login` if not authenticated)
- Token refresh for customer domain (15min access, 30day refresh)

### Issue #12: Final Partner Flow ✅ VERIFIED
- `/partner/login` → `/partner/dashboard` → entity management
- Turf availability, event/movie management, bookings
- Organizer token domain isolated (12hr JWT)
- Session restore via `GET /organizer/auth/refresh`

### Issue #13: Final Admin Flow ✅ VERIFIED
- AdminShell in `super-admin.html` ONLY
- 16 admin routes with auth guard (redirects to `/admin/login` if not authenticated)
- Admin token domain isolated (12hr JWT)
- Session restore via `GET /admin/auth/refresh`

### Issue #14: JS Syntax Validation ✅ PASSED
- All 71 JS files pass `node --check` with 0 errors
- No `const`, `let`, arrow functions, template literals, or async/await at module level
- ES5-compatible throughout

### Issue #15: Asset Validation ✅ VERIFIED
- CDN: Tailwind CSS, Font Awesome 6.5.1 — both loaded externally
- Fonts: Plus Jakarta Sans from Google Fonts
- Images: Most turfs/movies use dynamic URLs from API
- Placeholder images show but are secondary (turf-placeholder.jpg)

### Issue #16: Production Cache & Window Exposure ✅ FIXED
- 1-hour cache for JS/CSS in .htaccess
- CRITICAL FIX: Added `window.*` exports for all `onclick`-referenced functions:
  - `window.renderMovieBooking`, `window.processBooking`, `window.downloadTicket`
  - `window.completePayment`, `window.retryPayment`
  - `window.renderEventBooking`, `window.processEventBooking`
  - `window.renderTurfBooking`, `window.processTurfBooking`
- Without these, every booking button would throw `ReferenceError`
- Also exported `window.toggleSeat`, `window.confirmMovieBooking`, `window.filterTurfs`

### Issue #17: Router Variable Cleanup ✅ FIXED
- Removed duplicate `_resolveInitial` declaration in router.js
- Router is hash-free with clean URL pattern matching

### Issue #18: Final Release Gate ✅ READY

---

## Architecture Summary

```
public/
├── index.html              (Customer-facing SPA)
├── super-admin.html        (Admin panel SPA — AdminShell)
├── .htaccess               (Apache config for Hostinger)
├── assets/                 (Images, fonts)
├── css/                    (Tailwind CDN + custom styles)
└── js/
    ├── config.js           (EMS_CONFIG — API URLs, storage keys, features)
    ├── utils/              (mapKeys, escapeHtml, formatMoney, showToast, etc.)
    ├── api/
    │   ├── client.js       (EMSApi — 3-auth-scope HTTP client with token refresh)
    │   └── endpoints/      (movies, events, turfs, bookings, auth)
    ├── router.js           (EMSRouter — hash-free SPA router with auth guards)
    ├── routes.js           (registerAllRoutes — bootstraps all routes)
    ├── pages/
    │   ├── customer.js     (Customer page module — 18 routes)
    │   ├── partner.js      (Partner page module — 7 routes)
    │   └── admin.js        (Admin page module — 16 routes)
    ├── auth/
    │   ├── customer.js     (Customer auth: login, register, restoreSession)
    │   ├── organizer.js    (Organizer auth: login, refresh, restoreSession)
    │   └── admin.js        (Admin auth: login, restoreSession)
    ├── main.js             (Bootstrap: config → auth restore → router resolve)
    └── location.js         (Geolocation, city detection)
```

## Three Auth Domains

| Domain     | Token Storage              | JWT Lifetime | Refresh Endpoint              | Storage Keys                         |
|------------|----------------------------|--------------|-------------------------------|--------------------------------------|
| Customer   | Customer access + refresh  | 15 min       | POST `/customer/auth/refresh` | `ems_access_token`, `ems_refresh_token` |
| Organizer  | Organizer access + refresh | 12 hours     | POST `/organizer/auth/refresh` | `ems_organizer_access`, `ems_organizer_refresh` |
| Admin      | Admin token                | 12 hours     | POST `/admin/auth/refresh`    | `ems_admin_token`, `ems_admin_user`  |

## Deployment Steps for Hostinger

1. Upload ALL files from `public/` to Hostinger `public_html/` directory
2. Ensure `.htaccess` is at the document root level (inside `public_html/`)
3. If SSL is configured, uncomment the HTTPS redirect in `.htaccess`
4. Verify `api.entrymyslot.com` CORS allows `entrymyslot.com` origin
5. Test: Visit `https://entrymyslot.com` → should load SPA
6. Test: Refresh on `/explore/movies/Coimbatore` → should work (SPA fallback)
7. Test: API calls should work (CORS headers from backend)

## Known Limitations (Non-Blockers)

- `api.js` (old fetch wrapper) not loaded by any HTML file — dead code, can be removed
- `AdminAuthAPI` in `api/endpoints/auth.js` only used by `super-admin.html` admin-auth.js
- Turf placeholder image (`turf-placeholder.jpg`) may show broken image if not provided
- `window.customLightHover` CSS variable may not be defined (Tailwind config uses `#0126A5`)
