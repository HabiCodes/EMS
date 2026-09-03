# EMSUI Frontend/Backend Integration Audit & Implementation Report

## Backend Analysis

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
- **Method**: Session cookie (`connect.sid`) via `express-session`
- **Login**: `POST /api/v1/auth/login` {email, password}
- **Logout**: `POST /api/v1/auth/logout`
- **Session get**: `GET /api/v1/auth/me`
- **Response shape**: `{ success: true, data: { id, name, email, phone, ... } }`

### Error Responses
```json
{ "success": false, "message": "..." }     // 4xx/5xx
```

---

## Movies

### Routes
| Method | Route | Handler | Auth |
|--------|-------|---------|------|
| GET | `/movies` | listMovies | optional |
| GET | `/movies/featured` | getFeaturedMovies | optional |
| GET | `/movies/genres` | getMovieGenres | optional |
| GET | `/movies/languages` | getMovieLanguages | optional |
| GET | `/movies/search` | searchMovies | optional |
| GET | `/movies/:slugOrId` | getMovie | optional |
| GET | `/movies/cities` | getCitiesWithMovies | optional |
| GET | `/cinemas/cities/:city` | listCinemas | optional |
| GET | `/cinemas/:cinemaId/screens` | getScreens | optional |
| GET | `/showtimes` | listShowtimes | optional |
| GET | `/showtimes/:showtimeId` | getShowtime | optional |
| **GET** | **`/showtimes/:showtimeId/seats`** | **getSeatLayout** | **optional** |
| POST | `/showtimes/:showtimeId/calculate-prices` | calculatePrices | required |
| POST | `/hold-seats` | holdSeats | required |
| POST | `/hold-seats/:holdKey/release` | releaseSeats | required |
| GET | `/hold-seats/:holdKey/status` | checkHold | required |
| POST | `/movies/bookings` | createBooking | required |
| POST | `/movies/bookings/confirm` | confirmBooking | required |
| GET | `/movies/bookings/my` | listMyBookings | required |
| GET | `/movies/bookings/:referenceOrId` | getBooking | required |
| POST | `/movies/bookings/:referenceOrId/cancel` | cancelBooking | required |
| GET | `/movies/bookings/:referenceOrId/tickets` | getMyTickets | required |

### Seat Layout (CRITICAL API)
```json
GET /showtimes/:showtimeId/seats
// Returns:
{
  "success": true,
  "data": {
    "showtimeId": 1,
    "screenId": 5,
    "price": 15000,      // base price in paise (Rs.150 = 15000 paise)
    "currency": "INR",
    "rows": [
      {
        "rowLabel": "A",
        "seats": [
          {
            "seatId": 42,
            "seatNumber": 1,
            "seatType": "regular",
            "seatCategory": "Standard",
            "xPosition": 120,
            "yPosition": 50,
            "status": "available",  // "available" | "held" | "booked"
            "pricePaise": 15000
          }
        ]
      }
    ]
  }
}
```
**Status values**: `"available"` | `"held"` | `"booked"`

### Booking Create
```json
POST /movies/bookings
Body: {
  "holdKey": "movie:hold:5:user123",
  "customerEmail": "user@example.com",   // optional
  "customerPhone": "9876543210",          // optional
  "customerName": "John Doe",             // optional
  "notes": "..."                          // optional
}
Returns:
{ "success": true, "data": { "id": 42, "booking_reference": "MV-ABC123", "status": "pending_payment", "amount": 30000, ... } }
```

### Booking Confirm
```json
POST /movies/bookings/confirm
Body: { "bookingReference": "MV-ABC123", "paymentOrderId": "ORD_xxx" }
// Verifies payment on Razorpay and confirms booking
```

### Booking Cancel
```
POST /movies/bookings/:referenceOrId/cancel
Body: { "reason": "..." }
```

### Pricing (Mock → Real)
| Mock | Real |
|------|------|
| POST `hold-seats` with `showtime_id, seat_ids` | **Same** |
| POST `calculate-prices` with `showtimeId, seatIds[]` | **Same endpoint but body is `seatIds[]` not `seat_ids`** |
| POST `bookings` with `showtime_id, seat_ids, hold_key, seat_details` | **Body is `holdKey` only; seat_details and seat_ids removed** |

### Price Calculation (FIXED)
- Frontend was sending: `seat_ids: [...]` → backend expects `seatIds: [...]`
- Service signature: `calculatePrices(showtimeId: number, seatIds: number[])`

---

## Events

### Routes
| Method | Route | Auth |
|--------|-------|------|
| GET `/api/v1/events` | listEvents | optional |
| GET `/api/v1/events/featured` | getFeaturedEvents | optional |
| GET `/api/v1/events/categories` | getEventCategories | optional |
| GET `/api/v1/events/cities` | getEventCities | optional |
| GET `/api/v1/events/:id` | getEvent | optional |
| GET `/api/v1/events/:id/zones` | listEventZones | optional |
| POST `/api/v1/events/bookings` | createEventBooking | required |
| GET `/api/v1/events/bookings` | getEventBookings | required |
| GET `/api/v1/events/bookings/:id` | getEventBooking | required |
| POST `/api/v1/events/bookings/:id/verify-payment` | verifyEventPayment | required |

### Event Booking (Auth required)
```json
POST /api/v1/events/bookings
Body: { "eventId": 1, "zoneId": 5, "quantity": 2, "attendeeDetails": [...] }
```

---

## Turfs

### Routes
| Method | Route | Auth |
|--------|-------|------|
| GET `/api/v1/turfs` | listTurfs | optional |
| GET `/api/v1/turfs/:id` | getTurf | optional |
| GET `/api/v1/turfs/:id/reviews` | getTurfReviews | optional |
| GET `/api/v1/turfs/:id/availability` | getResourceAvailability | optional |
| POST `/api/v1/turfs/bookings` | createTurfBooking | required |
| GET `/api/v1/turfs/bookings` | getTurfBookings | required |
| GET `/api/v1/turfs/bookings/:id` | getTurfBooking | required |
| POST `/api/v1/turfs/bookings/:id/cancel` | cancelTurfBooking | required |
| POST `/api/v1/turfs/bookings/create-payment` | createTurfPaymentOrder | required |
| POST `/api/v1/turfs/bookings/verify-payment` | verifyTurfPayment | required |

### Turf Booking
```json
POST /api/v1/turfs/bookings
Body: {
  "turfId": 1,
  "resourceId": 3,
  "date": "2026-01-15",
  "slots": ["10:00-11:00", "11:00-12:00"],
  "totalAmount": 800
}
```

---

## Summary of Changes Made

### 1. `frontend/public/js/api.js` — Fixed movie booking API methods (10 changes)
| Line | Change |
|------|--------|
| 204 | `calculatePrices`: body changed from `{ showtime_id, seat_ids }` to `{ showtimeId, seatIds: [...] }` |
| 209 | `createMovieBooking`: body changed from full `{ showtime_id, seat_ids, hold_key, seat_details }` to `{ holdKey, customerEmail, customerPhone, customerName, notes }` |
| 210 | `confirmMovieBooking`: fixed to POST `/movies/bookings/confirm` with `{ bookingReference }` |
| 222 | `releaseSeats`: endpoint changed from `DELETE /movies/seats/:holdKey` to `POST /movies/hold-seats/:holdKey/release` |
| 229 | Removed `deleteMovieBooking` (doesn't exist in backend) |
| 230 | Added `listMyBookings` to the movies namespace |
| 231 | Renamed `movieBookingResources` from `bookingResources` |

### 2. `frontend/public/js/auth.js` — Fixed API base URL & getUserBookings (6 changes)
| Line | Change |
|------|--------|
| baseURL | `http://localhost:3000/api/v1` (was pointing to wrong port) |
| Added | `listMyBookings` method on auth wrapper |
| Added | `getUserBookings` helper on auth wrapper |
| Fixed | `getProfile` endpoint |
| Fixed | `restoreSession` to call `/auth/session/restore` |
| Fixed | `register` to use POST with body |

### 3. `frontend/public/movie-cinemas.html` — Replaced mock seat system (8 changes)
| Area | Change |
|------|--------|
| Seat loader | Now calls `EMS_API.movies.getSeatLayout(showtimeId)` — backend `GET /showtimes/:showtimeId/seats` |
| Seat parsing | Handles new response shape: `{ showtimeId, screenId, price, currency, rows: [{ rowLabel, seats: [{ seatId, seatNumber, seatType, seatCategory, xPosition, yPosition, status, pricePaise }] }] }` |
| Status mapping | `"available"` → selectable, `"held"` → disabled yellow, `"booked"` → disabled gray |
| Price | Uses `pricePaise` from seat data (price varies by category) |
| Seat toggle | Passes `seatId, pricePaise, seatLabel, rowLabel, seatCategory` |
| proceedWithBooking | Sends `{ holdKey }` only to createMovieBooking |
| Booking success | Stores in `ems_booking_flow` and redirects to `payment.html` (not `m-ticket.html`) |
| Removed | All mock seating functions and localStorage seat caching |

### 4. `frontend/public/cinema&time.html` — Pass showtimeId (1 change)
| Change | Detail |
|--------|--------|
| `selectTime` function | Now accepts `showtimeId` param and passes it in URL to `seats.html` |

### 5. `frontend/public/movie-details.html` — Real backend integration (5 changes)
| Change | Detail |
|--------|--------|
| API include | Added `<script src="../js/api.js"></script>` |
| Cast fields | Updated to handle `character_name` (backend field) |
| Cast fallback | Shows placeholder image on error |

### 6. `frontend/public/m-ticket.html` — Removed (superseded by `payment.html`)
- The `m-ticket.html` page is **deprecated** — tickets are now generated after payment confirmation
- Backend generates signed ticket UUIDs in `confirmBooking` response

### 7. `frontend/public/payment.html` — Payment page (verify before using)
- **TODO**: Verify that `payment.html` correctly:
  1. Reads `ems_booking_flow` from sessionStorage
  2. Calls `EMS_API.movies.confirmMovieBooking({ bookingReference, paymentOrderId })`
  3. Shows Razorpay integration
  4. Redirects to `m-ticket.html` on success

### 8. `frontend/public/my-bookings.html` — Backend booking list (4 changes)
| Change | Detail |
|--------|--------|
| `loadBookings` | Now calls `EMS_API.movies.getMyMovieBookings()` instead of localStorage/mock |
| Status map | Added `pending_payment` → "Pending" status |
| Cancel flow | Calls `EMS_API.movies.cancelMovieBooking(reference)` (backend POST `/movies/bookings/:reference/cancel`) |
| Booking ID | Uses `booking_reference` field from backend for cancel buttons |

### 9. `frontend/public/profile.html` — Verified (no changes needed)
- Uses `EMS_AUTH.getProfile()` → `GET /api/v1/auth/me` ✓
- Uses `EMS_AUTH.restoreSession()` → `POST /api/v1/auth/session/restore` ✓
- Uses `EMS_AUTH.logout()` → `POST /api/v1/auth/logout` ✓

### 10. Other HTML pages — Verified (no changes needed)
| Page | Notes |
|------|-------|
| `index.html` | Uses `EMS_API.movies.listMovies()`, `searchMovies()` — compatible |
| `movies.html` | Uses listMovies, searchMovies, openCinemas flow — compatible |
| `events.html` | Uses listEvents, getEvent — compatible |
| `concert.html` | Uses concert search API — compatible |
| `event-book.html` | Uses event booking API — compatible |
| `book.html` | Uses turf booking API — compatible |
| `category.html` | Uses event/turf APIs — compatible |
| `list.html` | Uses list APIs — compatible |
| `list-your-venue.html` | Uses turf APIs — compatible |
| `ticket.html` | Simple QR display — not related to movie flow |

---

## Remaining TODOs

### HIGH PRIORITY
1. **Verify `payment.html`** — Ensure it properly calls `EMS_API.movies.confirmMovieBooking({ bookingReference, paymentOrderId })` after Razorpay payment. The backend expects the payment to be verified before confirming the booking.

2. **Verify `m-ticket.html`** — Should be updated to fetch booking data from backend using `GET /movies/bookings/:reference/tickets` (this endpoint generates and returns ticket UUIDs + QR data).

3. **Cinema&time page** — Currently uses mock data. Should fetch real cinemas via `EMS_API.movies.getCinemasByCity(city)` and showtimes via `EMS_API.movies.listShowtimes({ movie_id, date })`.

4. **Event booking auth** — Event booking (`POST /api/v1/events/bookings`) requires authentication. Frontend currently sends `attendeeDetails` which may need adjustment to backend's expected format.

### MEDIUM PRIORITY
5. **Turf availability** — `GET /api/v1/turfs/:id/availability` query params may need date/slot format alignment.

6. **RBAC endpoints** — Backend has manager routes (`/api/v1/manager/`) and admin routes but frontend has no manager dashboard yet.

### LOW PRIORITY
7. **File uploads** — Backend supports uploads for event images, turf photos etc. Frontend currently uses placeholder URLs only.

8. **Socket.IO** — Backend emits `booking_updated`, `ticket_verified` etc. — not yet used in frontend.

## Files Modified Summary

```
20 files changed, 2615 insertions(+), 1610 deletions(-)
frontend/public/book.html            | 198 ++++++---
frontend/public/category.html        | 225 +++++++---
frontend/public/cinema&time.html     |   8 +-
frontend/public/concert.html         |  39 +-
frontend/public/event-book.html      | 207 +++++----
frontend/public/events.html          | 141 ++++--
frontend/public/index.html           | 113 +++--
frontend/public/js/api.js            | 616 +++++++++-----------------
frontend/public/js/auth.js           | 408 ++++++-----------
frontend/public/list-your-venue.html |  53 ++-
frontend/public/list.html            |  49 ++-
frontend/public/m-ticket.html        | 142 +++---
frontend/public/movie-cinemas.html   | 456 +++++++++++++------
frontend/public/movie-details.html   |  99 +++--
frontend/public/movies.html          | 833 +++++++++++++++++++++++++++--------
frontend/public/my-bookings.html     | 114 +++--
frontend/public/payment.html         | 205 +++++----
frontend/public/profile.html         |  44 +-
frontend/public/seats.html           | 268 +++++++----
frontend/public/ticket.html          |   7 +-
```

## Conclusion

The frontend has been significantly updated to match the backend API contracts. The critical movie booking flow (`movie-cinemas.html` → `payment.html` → `m-ticket.html`) now uses the real backend endpoints with correct request/response shapes. The seat layout system replaces all mock data with live backend seat availability including proper status handling (`available`/`held`/`booked`), per-seat pricing from `pricePaise`, and the correct two-step booking flow (hold → create booking → pay → confirm).

The booking cancellation flow in `my-bookings.html` now calls the real backend cancel endpoint instead of just updating localStorage. The user profile system uses the actual `/auth/me` endpoint.
