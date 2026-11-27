import express from "express";
import {
  createCheckoutSession,
  stripeWebhook,
  getBookingPaymentStatus,
  getSessionStatus,
  reactivateCheckoutSession,
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const paymentRouter = express.Router();

// POST /api/payments/create-checkout-session
// Creates a pending booking and returns a Stripe Checkout URL.
// Requires authentication — protect middleware attaches req.user.
paymentRouter.post("/create-checkout-session", protect, createCheckoutSession);

// GET /api/payments/booking-status/:bookingId
// Returns payment + booking status for the authenticated owner of that booking.
// Used by the frontend to verify payment server-side after returning from Stripe.
paymentRouter.get("/booking-status/:bookingId", protect, getBookingPaymentStatus);

// GET /api/payments/session-status/:sessionId
// Looks up a booking by Stripe session ID and returns its payment status.
// Used by PaymentSuccess.jsx to poll for confirmation after Stripe redirect.
paymentRouter.get("/session-status/:sessionId", protect, getSessionStatus);

// POST /api/payments/reactivate-session
// Retries payment for an existing unpaid booking without creating a new one.
// Reuses the existing Stripe session if still open, or creates a new one
// linked to the same booking record.
paymentRouter.post("/reactivate-session", protect, reactivateCheckoutSession);

// POST /api/payments/webhook
// Receives Stripe webhook events.
// IMPORTANT: express.raw({ type: "application/json" }) is applied in server.js
// on this specific path BEFORE express.json() — the raw body is required for
// Stripe signature verification. Do NOT add express.json() here.
paymentRouter.post("/webhook", stripeWebhook);

export default paymentRouter;
