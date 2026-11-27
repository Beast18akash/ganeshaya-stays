import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    guests: { type: Number, required: true },
    quantity: {
      type: Number,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "quantity must be a positive integer.",
      },
    },
    pricePerNightSnapshot: { type: Number, min: 0 },
    currency: {
      type: String,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },
    roomTypeSnapshot: { type: String },
    hotelNameSnapshot: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "pay At Hotel",
      required: true,
    },
    isPaid: { type: Boolean, default: false },

    // ── Stripe payment fields ────────────────────────────────────────────────
    // All optional so legacy documents without these fields remain valid.

    // Stripe Checkout Session ID (cs_test_... / cs_live_...)
    stripeSessionId: { type: String, default: null },

    // Stripe PaymentIntent ID (pi_...) — populated from the webhook after
    // checkout.session.completed; null for pay-at-hotel bookings.
    stripePaymentIntentId: { type: String, default: null },

    // Granular payment lifecycle status that sits alongside the booking status.
    // "pending"  — checkout session created, customer has not yet paid
    // "paid"     — payment confirmed by Stripe webhook
    // "failed"   — async payment method failed
    // "expired"  — Stripe session expired without payment
    // "refunded" — future use
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "expired", "refunded"],
      default: "pending",
    },

    // UTC timestamp of confirmed payment (set by webhook).
    paidAt: { type: Date, default: null },

    // Lease fields prevent concurrent Pay Now requests from creating sessions.
    stripeSessionLockToken: { type: String, default: null },
    stripeSessionLockExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1, status: 1 });
bookingSchema.index(
  { stripeSessionId: 1 },
  {
    unique: true,
    name: "uniq_stripe_session_id_string",
    partialFilterExpression: { stripeSessionId: { $type: "string" } },
  }
);

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
