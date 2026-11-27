import Stripe from "stripe";

// Initialise the Stripe SDK once and export for reuse.
// STRIPE_SECRET_KEY must be set in .env (server/.env locally,
// Azure App Service → Configuration → App settings in production).
// Never expose this key to the client.
//
// The apiVersion override is intentionally omitted so the SDK uses its own
// bundled API version (2026-08-26.dahlia for stripe@22.6.2). Pinning an older
// version would silently suppress new Stripe API features and bug-fixes.
if (!process.env.STRIPE_SECRET_KEY) {
  // Log a clear error and exit — a missing secret key is a fatal
  // misconfiguration that must be fixed before the server accepts traffic.
  // Using console.error + process.exit instead of throw so the message
  // is visible in Azure App Service logs before the process terminates.
  console.error(
    "[stripe] FATAL: STRIPE_SECRET_KEY environment variable is not set.\n" +
    "  Local:  Add STRIPE_SECRET_KEY=sk_test_... to server/.env\n" +
    "  Azure:  Add it under App Service → Configuration → App settings"
  );
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripe;
