# EntryMySlot — Routing Guide

## Overview

This SPA uses a custom hash-free router (`EMSRouter`) with pattern matching.
All navigation is handled client-side via `pushState` and SPA link interception.
The `.htaccess` serves `index.html` for all non-API, non-file requests.

## URL Structure

```
/                      → Home (city-aware, redirects to selected city)
/login                 → Customer login/register overlay
/account/profile       → Customer profile
/account/bookings       → Customer bookings list
/account/booking/:ref   → Customer booking detail
/partner/login          → Organizer/Partner login
/admin/login            → Admin login
```

## Customer Routes (EMSCustomerPages)

| Route | Handler | Auth | Description |
|---|---|---|---|
| `/` | `renderHome` | public | Homepage with featured turfs, events, movies |
| `/explore/home` | `renderHome` | public | Same as `/` |
| `/explore/home/:city` | `renderHome` | public | Home filtered by city slug |
| `/explore/movies` | `renderMoviesList` | public | Movie listings |
| `/explore/movies/:city` | `renderMoviesList` | public | Movies filtered by city |
| `/explore/movie/:id` | `renderMovieDetail` | public | Movie detail page |
| `/explore/events` | `renderEventsList` | public | Event listings |
| `/explore/events/:city` | `renderEventsList` | public | Events filtered by city |
| `/explore/event/:id` | `renderEventDetail` | public | Event detail page |
| `/explore/turfs` | `renderTurfList` | public | Turf listings |
| `/explore/turfs/:city` | `renderTurfList` | public | Turfs filtered by city |
| `/explore/turf/:id` | `renderTurfDetail` | public | Turf detail page |
| `/login` | `renderLogin` | public | Customer login/register/OTP forms |
| `/account/profile` | `renderProfile` | customer | Customer profile management |
| `/account/bookings` | `renderMyBookings` | customer | Customer booking history |
| `/account/booking/:ref` | `renderBookingDetail` | customer | Single booking detail |

## Admin Routes (EMSAdminPages)

| Route | Handler | Auth | Description |
|---|---|---|---|
| `/admin/dashboard` | `renderAdminDashboard` | admin | Admin stats dashboard |
| `/admin/users` | `renderAdminUsers` | admin | User management |
| `/admin/organizations` | `renderAdminOrganizations` | admin | Organization management |
| `/admin/events` | `renderAdminListPage('Events', '/admin/events', [...])` | admin | Events admin list |
| `/admin/movies` | `renderAdminListPage('Movies', '/admin/movies', [...])` | admin | Movies admin list |
| `/admin/turfs` | `renderAdminListPage('Turfs', '/admin/turfs', [...])` | admin | Turfs admin list |
| `/admin/cinemas` | `renderAdminListPage('Cinemas', '/admin/cinemas', [...])` | admin | Cinemas admin list |
| `/admin/screens` | `renderAdminListPage('Screens', '/admin/screens', [...])` | admin | Screens admin list |
| `/admin/showtimes` | `renderAdminListPage('Showtimes', '/admin/showtimes', [...])` | admin | Showtimes admin list |
| `/admin/bookings` | `renderAdminBookings` | admin | All bookings |
| `/admin/refunds` | `renderAdminListPage('Refunds', '/admin/refunds', [...])` | admin | Refund requests |
| `/admin/banners` | `renderAdminListPage('Banners', '/admin/banners', [...])` | admin | Banner management |
| `/admin/media` | `renderAdminListPage('Media', '/admin/media', [...])` | admin | Media management |
| `/admin/audit-logs` | `renderAdminListPage('Audit Logs', '/admin/audit-logs', [...])` | admin | Audit logs |

## Partner Routes (EMSPartnerPages)

| Route | Handler | Auth | Description |
|---|---|---|---|
| `/partner/dashboard` | `renderPartnerDashboard` | organizer | Partner dashboard |
| `/partner/events` | `renderPartnerEvents` | organizer | Organizer's events |
| `/partner/movies` | `renderPartnerMovies` | organizer | Organizer's movies/cinemas |
| `/partner/turfs` | `renderPartnerTurfs` | organizer | Organizer's turfs |
| `/partner/bookings` | `renderPartnerBookings` | organizer | Organizer's bookings |
| `/partner/promotions` | `renderPartnerPromotions` | organizer | Promotions management |
| `/partner/settings` | `renderPartnerSettings` | organizer | Partner settings |
| `/partner/login` | inline in partner.js | public | Partner login form |

## API Endpoints Used

All prefixed with `/api/v1` (configured in `EMS_CONFIG.apiBaseUrl`).

### Public (no auth)
- `GET /movies/featured`
- `GET /movies`
- `GET /movies/:id`
- `GET /showtimes?movieId=:id`
- `GET /showtimes/:id/seats`
- `GET /events/featured`
- `GET /events`
- `GET /events/:id`
- `GET /events/categories`
- `GET /events/cities`
- `GET /events/:id/zones`
- `GET /events/:id/stats`
- `GET /turf/grounds`
- `GET /turf/grounds/:id`
- `GET /turf/resources/:id/availability?date=:date`
- `GET /turf/my/bookings`
- `GET /turf/my/bookings/:id`

### Customer Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/verify-otp`
- `POST /auth/resend-otp`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/profile`
- `POST /auth/profile`
- `POST /auth/logout`
- `POST /auth/refresh`

### Movie Booking
- `POST /movies/seats/hold`
- `GET /movies/seats/hold/:holdKey`
- `POST /movies/seats/release`
- `POST /movies/bookings`

### Event Booking
- `POST /bookings` (body: `{ event_id, attendees: [{full_name, phone, age, gender}], zone_id }`)

### Turf Booking
- `POST /turf/bookings` (body: `{ availability_unit_id, contactName, contactPhone, notes }`)

### General Booking
- `GET /bookings/my`
- `GET /bookings/:id`
- `POST /bookings/:id/cancel`
- `GET /payments/order`
- `POST /payments/verify`

### Organizer Auth
- `POST /organizer/auth/login`
- `POST /organizer/auth/refresh`
- `POST /organizer/auth/logout`

### Admin Auth
- `POST /admin/login`
- `POST /admin/stats`
- `GET /admin/users`
- `GET /admin/organizations`
- `GET /admin/events`
- `GET /admin/movies`
- `GET /admin/turfs`
- `GET /admin/cinemas`
- `GET /admin/screens`
- `GET /admin/showtimes`
- `GET /admin/bookings`
- `GET /admin/refunds`
- `GET /admin/banners`
- `GET /admin/media`
- `GET /admin/audit-logs`

## Router Bootstrap Sequence

1. All `<script>` tags in `index.html` load in order (config → client → mappers → auth → location → utils → components → router → endpoints → pages → routes → main)
2. `routes.js` calls `registerAllRoutes()` which registers routes from all page modules
3. `routes.js` calls `EMSRouter.setResolveInitial(true)` to signal the router
4. Router resolves the current URL path and renders the matching page
5. `main.js` calls `__emsAppReady()` which also triggers `registerAllRoutes()`
6. User clicks are intercepted by the router's click handler for SPA navigation

**Important:** The router does NOT resolve the initial URL until `setResolveInitial(true)` is called. This prevents the bootstrap race condition where the router would try to resolve routes before they are registered.

## City-Aware Routing

City is passed as a URL parameter: `/explore/home/chennai`, `/explore/movies/coimbatore`, etc.

- `EMSCustomerPages.citySlug(name)` converts city name to URL-safe slug
- `EMSLocation.getSelected()` returns the current city name
- The location overlay lets users select a city, which navigates to the appropriate route
- City is also synced to `EMS_LOCATION` state for API requests

## Auth Scopes

Three independent auth domains with separate storage:

| Scope | Storage Key | Token Duration | Used By |
|---|---|---|---|
| `customer` | `ems_customer_access` / `ems_customer_refresh` | 15min access / 30day refresh | Customer pages |
| `organizer` | `ems_organizer_access` / `ems_organizer_refresh` | 12hr | Partner pages |
| `admin` | `ems_admin_token` | 12hr | Admin pages |

Each scope has its own auth module, token refresh logic, and logout handler.

## Known Issues

- Dashboard page (`pages/dashboard.js`) uses `AdminShell` which is only available in `super-admin.html` — not loaded by `index.html`
- Location-state.js does NOT call `/api/v1/districts` or `/api/v1/cities` (removed) — uses hardcoded Tamil Nadu districts list
- Event booking body follows backend contract: `{ event_id, attendees: [{full_name, phone, age, gender}], zone_id }`
- Movie booking uses hold-key flow: select seats → hold seats → get holdKey → create booking with holdKey
- Turf booking requires `availability_unit_id` (not ground_id + date + slot)
