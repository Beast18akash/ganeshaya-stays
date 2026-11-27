# Data Model

## Persistence

MongoDB accessed through Mongoose. Models use ObjectId references and timestamp fields. Collection names are default Mongoose names except the explicitly named inventory/payment collections.

## Entities

- `User` (`server/models/user.js`): account identity, local/OAuth credentials, role, reset-password state, and recent searches.
- `Hotel` (`server/models/hotel.js`): name, address, contact, city, and required owner reference to `User`.
- `Room` (`server/models/room.js`): required `hotel` reference, room type, nightly price, integer `totalQuantity`, amenities, image URLs, availability flag, timestamps.
- `Booking` (`server/models/booking.js`): user/room/hotel references, stay dates, price/guest/quantity snapshots, booking/payment status, Stripe identifiers, paid timestamp, and session lock lease.
- `RoomNightInventory` (`server/models/roomNightInventory.js`): one room/date counter with capacity and reserved quantity; unique `(room,date)` index.
- `RoomNightReservation` (`server/models/roomNightReservation.js`): per-room/per-date reservation linked to a booking, quantity, held/confirmed/released status, Stripe session/attempt references, reservation token, and lease expiry.
- `StripePaymentAttempt` (`server/models/stripePaymentAttempt.js`): payment retry/idempotency record linked to a booking and optional Stripe session.
- `StripeWebhookEvent` (`server/models/stripeWebhookEvent.js`): processed Stripe event identity/type and related payment-attempt information for webhook idempotency.

## Relationships

- User `1 -> many` Hotels through `Hotel.owner`.
- Hotel `1 -> many` Rooms through `Room.hotel`.
- User `1 -> many` Bookings through `Booking.user`.
- Room and Hotel `1 -> many` Bookings through `Booking.room` and `Booking.hotel`.
- Room `1 -> many` RoomNightInventory and RoomNightReservation records.
- Booking `1 -> many` RoomNightReservation and StripePaymentAttempt records.
- StripePaymentAttempt/Booking are referenced by webhook event records.

## Invariants and transaction boundaries

- Room quantities and inventory quantities are integer constrained; reservations cannot exceed capacity.
- Booking overlap uses half-open date ranges: `checkIn < requestedCheckOut` and `checkOut > requestedCheckIn`.
- Inventory service uses MongoDB sessions/transactions for reserve, confirm, release, and reactivation operations.
- Unique indexes enforce one inventory row per room/date, one reservation per room/date/booking, one payment attempt per booking/attempt number, and unique non-null Stripe identifiers.

## Key entity summary

`Room` is the catalog unit and availability anchor; `Booking` is the customer reservation and payment state machine; `RoomNightInventory` is the aggregate nightly capacity counter; `RoomNightReservation` is the detailed nightly hold; `Hotel` owns rooms; `User` owns identity and hotel ownership context.
