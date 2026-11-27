# Technology Stack

## Runtime and frameworks

- JavaScript ES modules on Node.js; no explicit `engines` constraint is declared.
- Backend: Express `5.2.1`, Mongoose `9.9.3`.
- Frontend: React `19.2.8`, React DOM `19.2.8`, React Router DOM `7.18.2`, Vite `8.2.0`.
- Styling/build: Tailwind CSS `4.3.3`, `@tailwindcss/vite` `4.3.3`.

## Backend dependencies

- `axios`: external HTTP requests, including OAuth flows.
- `bcryptjs`, `jsonwebtoken`, `cookie-parser`: credential hashing and JWT cookie sessions.
- `cors`, `dotenv`: HTTP policy and environment loading.
- `multer`, `cloudinary`: multipart uploads and image storage.
- `nodemailer`: SMTP email via Brevo relay.
- `stripe`: Checkout and webhook payment lifecycle.
- `google-auth-library`: Google identity-token verification.

## Frontend dependencies

- `axios`, `react-hot-toast`, `@react-oauth/google`.
- ESLint 10 with React hooks/refresh plugins.

## Build and execution

- Root `npm run dev` starts client and server concurrently.
- Root `npm run build` installs both lockfiles and builds the client.
- Server production entry is `node server/server.js`.
- Server disables automatic Mongoose index creation and exposes an explicit Stripe/inventory index migration script.

## Runtime configuration observed

`MONGODB_URI`, `CLIENT_URL`, `JWT_SECRET`, `NODE_ENV`, Cloudinary credentials, SMTP credentials, `SENDER_EMAIL`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are read from environment variables.

## Existing constraints

- Stripe webhook signature verification depends on raw body parsing and route middleware order.
- Authentication depends on cross-origin credentials and production `SameSite=None; Secure` cookies.
- Database indexes are not auto-created; operational index setup is explicit.
