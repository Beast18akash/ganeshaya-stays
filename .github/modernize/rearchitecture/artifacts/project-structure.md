# Project Structure

## Classification

Full-stack MERN monorepo: a Vite/React client and an Express/Mongoose server in one repository. The server also serves the built client from `client/dist` in production.

## Top-level modules

- `client/`: React 19 single-page application, routed with React Router, styled with Tailwind CSS.
- `server/`: Express HTTP API, MongoDB persistence through Mongoose, authentication, booking, payments, email, Cloudinary integration, and inventory services.
- Root `package.json`: orchestration scripts for client/server development and production build.

## Backend layers

- Entry point: `server/server.js`; loads environment variables, connects MongoDB, configures CORS/cookies/body parsing, mounts routers, exposes health check and static SPA fallback.
- Routes: `server/routes/`; maps HTTP paths to controller functions.
- Middleware: `server/middleware/`; JWT protection and multipart image uploads.
- Controllers: `server/controllers/`; request validation, authorization, persistence orchestration, external integrations, and response shaping.
- Services: `server/services/`; inventory reservation, confirmation, release, reactivation, availability, and transaction handling.
- Models: `server/models/`; Mongoose schemas for users, hotels, rooms, bookings, night inventory/reservations, and Stripe payment state.
- Config/utilities: `server/config/` and `server/utils/`; database, Stripe, Cloudinary, SMTP, cookies, JWT, availability helpers, and email.

## Frontend layers

- Entry: `client/src/main.jsx`, `client/index.html`.
- Routing/root shell: `client/src/App.jsx`.
- Pages: public browsing, authentication, booking/payment results, and hotel-owner dashboard pages.
- Components: navigation, room/hotel cards, forms, layout, marketing sections, and protected-route wrapper.
- Context/state: `AuthContext` for session state and `AppContext` for rooms/search/owner state.
- API boundary: `client/src/lib/api.js`, Axios with `/api` base path and credentials enabled.

## Functional domains

1. Identity and authentication: local credentials, Google, GitHub, password reset, JWT cookie session.
2. Hotel/room management: hotel registration, room creation with image upload, owner room management, availability toggle.
3. Discovery: room listing, room details, city search, recent search storage.
4. Booking: date/guest/quantity validation, availability checks, user/hotel booking views.
5. Payments: Stripe Checkout sessions, webhook reconciliation, payment polling, retry/reactivation.
6. Inventory: per-room/per-night counters and reservation leases.

## Runtime entry points

- Backend HTTP server: `server/server.js`, default port `5000`.
- Frontend dev server: Vite, configured in `client/vite.config.js`.
- Production SPA fallback: Express serves `client/dist/index.html` for non-API paths.
- Stripe webhook: `/api/payments/webhook` requires raw request bytes before JSON parsing.
