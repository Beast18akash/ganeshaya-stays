import Booking from "../models/booking.js";
import Room from "../models/room.js";
import transporter from "../config/nodemailer.js";
import stripe from "../config/stripe.js";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  attachStripeSessionToRoomNights,
  checkBookingAvailability,
  releaseRoomNights,
  reserveRoomNights,
  updateRoomNightLease,
} from "../utils/bookingAvailability.js";
import RoomNightReservation from "../models/roomNightReservation.js";
import StripeWebhookEvent from "../models/stripeWebhookEvent.js";

// ─── helpers ────────────────────────────────────────────────────────────────

const toBookingDate = (date) => new Date(`${date}T00:00:00.000Z`);

const isDefinitiveStripeRequestFailure = (error) =>
  Number.isInteger(error?.statusCode) &&
  error.statusCode >= 400 &&
  error.statusCode < 500;

const validateBookingDates = (checkInDate, checkOutDate, guests) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(checkInDate) || !datePattern.test(checkOutDate)) {
    return "Check-in and check-out dates are required in YYYY-MM-DD format.";
  }
  const checkIn = new Date(`${checkInDate}T00:00:00.000Z`);
  const checkOut = new Date(`${checkOutDate}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return "Please provide valid dates.";
  }
  if (checkIn < today) return "Check-in date cannot be in the past.";
  if (checkOut <= checkIn) return "Check-out date must be after check-in date.";
  if (!Number.isInteger(Number(guests)) || Number(guests) < 1) {
    return "Guests must be at least 1.";
  }
  return null;
};

/**
 * Sends a booking confirmation email.
 * Called from the Stripe webhook after payment is confirmed.
 * Returns silently on mail error so a failed email never blocks the webhook response.
 */
export const sendBookingConfirmationEmail = async ({ booking, user, room, hotel }) => {
  try {
    const checkIn = new Date(booking.checkInDate).toISOString().split("T")[0];
    const checkOut = new Date(booking.checkOutDate).toISOString().split("T")[0];

    await transporter.sendMail({
      from: `Ganeshaya Stays <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Booking Confirmed — Ganeshaya Stays",
      text: [
        `Hello ${user.fullname},`,
        "",
        `Your booking at ${hotel.name} is confirmed and payment has been received.`,
        "",
        `Room        : ${room.roomType}`,
        `Check-in    : ${checkIn}`,
        `Check-out   : ${checkOut}`,
        `Guests      : ${booking.guests}`,
        `Total paid  : $${Number(booking.totalPrice).toFixed(2)}`,
        `Booking ID  : ${booking._id}`,
      ].join("\n"),
      html: `
        <h2 style="color:#0b3d67">Booking Confirmed ✓</h2>
        <p>Hello <strong>${user.fullname}</strong>,</p>
        <p>Your booking at <strong>${hotel.name}</strong> is confirmed and
           payment has been received.</p>
        <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
          <tr><td><strong>Room</strong></td><td>${room.roomType}</td></tr>
          <tr><td><strong>Check-in</strong></td><td>${checkIn}</td></tr>
          <tr><td><strong>Check-out</strong></td><td>${checkOut}</td></tr>
          <tr><td><strong>Guests</strong></td><td>${booking.guests}</td></tr>
          <tr><td><strong>Total paid</strong></td>
              <td>$${Number(booking.totalPrice).toFixed(2)}</td></tr>
          <tr><td><strong>Booking ID</strong></td><td>${booking._id}</td></tr>
        </table>
        <p style="margin-top:16px;color:#555">
          Thank you for choosing Ganeshaya Stays. We look forward to your visit.
        </p>
      `,
    });
  } catch (mailErr) {
    // Log but do not throw — a failed email must not block the webhook 200 response.
    console.error("[payment] confirmation email failed:", mailErr.message);
  }
};

// ─── POST /api/payments/create-checkout-session ──────────────────────────────

/**
 * Creates a pending booking and a Stripe Checkout Session.
 *
 * Security:
 *  - Protected route: req.user is set by the auth middleware.
 *  - Price is always computed from trusted DB data (pricePerNight), never from
 *    the request body. The frontend must NEVER send a price.
 *  - Availability is re-checked server-side regardless of what the client says.
 *
 * Idempotency:
 *  - If an existing pending-Stripe booking already has a live Stripe session for
 *    the same user / room / dates, we retrieve that session and return its URL
 *    instead of creating a duplicate booking and charge.
 */
export const createCheckoutSession = async (req, res) => {
  const { room: roomId, guests, checkInDate, checkOutDate } = req.body;
  const userId = req.user._id;
  let booking = null;
  let session = null;
  let stripeCreateAttempted = false;
  let reservationCreated = false;
  const lockToken = randomUUID();

  try {
    // 1. Validate inputs
    const validationError = validateBookingDates(checkInDate, checkOutDate, guests);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ success: false, message: "Invalid room ID." });
    }

    // 2. Load room (and its hotel) from DB — never trust client-supplied price
    const roomData = await Room.findById(roomId).populate("hotel");
    if (!roomData) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }
    if (!roomData.isAvailable) {
      return res.status(400).json({ success: false, message: "This room is currently unavailable." });
    }

    const requestedCheckIn = toBookingDate(checkInDate);
    const requestedCheckOut = toBookingDate(checkOutDate);
    const existingBooking = await Booking.findOne({
      user: userId,
      room: roomId,
      checkInDate: requestedCheckIn,
      checkOutDate: requestedCheckOut,
      paymentMethod: "stripe",
      isPaid: { $ne: true },
      $or: [
        { paymentStatus: "pending" },
        { paymentStatus: "expired" },
        { paymentStatus: "failed" },
      ],
    }).sort({ createdAt: -1 });

    if (existingBooking) {
      if (existingBooking.stripeSessionId) {
        let existingSession;
        try {
          existingSession = await stripe.checkout.sessions.retrieve(
            existingBooking.stripeSessionId
          );
        } catch (error) {
          console.error("[payment] Unable to verify existing Checkout Session:", error.message);
          return res.status(502).json({
            success: false,
            message: "Unable to verify your existing payment session. Please try again.",
          });
        }

        if (existingSession.status === "open") {
          return res.json({ success: true, url: existingSession.url });
        }
        if (existingSession.status !== "expired" || existingSession.payment_status !== "unpaid") {
          return res.status(409).json({
            success: false,
            message: "This payment is still processing. Check My Bookings for its status.",
          });
        }

        const expired = await Booking.findOneAndUpdate(
          {
            _id: existingBooking._id,
            stripeSessionId: existingSession.id,
            paymentStatus: "pending",
            isPaid: { $ne: true },
            $or: [
              { stripeSessionLockExpiresAt: { $exists: false } },
              { stripeSessionLockExpiresAt: null },
              { stripeSessionLockExpiresAt: { $lte: new Date() } },
            ],
          },
          { $set: { status: "cancelled", paymentStatus: "expired" } },
          { new: true, projection: { _id: 1 } }
        );
        if (expired) {
          await releaseRoomNights(existingBooking._id, {
            stripeSessionId: existingSession.id,
          });
        }
      } else if (
        existingBooking.paymentStatus !== "pending" ||
        existingBooking.stripeSessionLockExpiresAt > new Date()
      ) {
        return res.status(409).json({
          success: false,
          message: "This booking already has a payment attempt. Retry it from My Bookings.",
        });
      } else {
        const expired = await Booking.findOneAndUpdate(
          {
            _id: existingBooking._id,
            stripeSessionId: null,
            paymentStatus: "pending",
            isPaid: { $ne: true },
            $or: [
              { stripeSessionLockExpiresAt: { $exists: false } },
              { stripeSessionLockExpiresAt: null },
              { stripeSessionLockExpiresAt: { $lte: new Date() } },
            ],
          },
          { $set: { status: "cancelled", paymentStatus: "expired" } },
          { new: true, projection: { _id: 1 } }
        );
        if (expired && existingBooking.stripeSessionLockToken) {
          await releaseRoomNights(existingBooking._id, {
            reservationToken: existingBooking.stripeSessionLockToken,
          });
        }
      }

      return res.status(409).json({
        success: false,
        message: "This payment attempt is no longer active. Retry it from My Bookings.",
      });
    }

    // 3. Pre-check availability; unique room-night claims below close races.
    const isAvailable = await checkBookingAvailability({ checkInDate, checkOutDate, room: roomId });
    if (!isAvailable) {
      return res.status(400).json({ success: false, message: "Room is not available for those dates." });
    }

    // 4. Compute total price on the server
    const checkIn = toBookingDate(checkInDate);
    const checkOut = toBookingDate(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = roomData.pricePerNight * nights; // stored in dollars (or base currency unit)

    // 5. Create a pending booking in MongoDB BEFORE creating the Stripe session
    //    so its _id can be embedded in the session metadata.
    const reservationLeaseExpiresAt = new Date(Date.now() + 35 * 60 * 1000);
    const lockExpiresAt = reservationLeaseExpiresAt;
    booking = new Booking({
      user: userId,
      room: roomId,
      hotel: roomData.hotel._id,
      guests: Number(guests),
      checkInDate,
      checkOutDate,
      totalPrice,
      currency: "usd",
      paymentMethod: "stripe",
      status: "pending",
      isPaid: false,
      paymentStatus: "pending",
      stripeSessionLockToken: lockToken,
      stripeSessionLockExpiresAt: lockExpiresAt,
    });

    reservationCreated = await reserveRoomNights({
      room: roomId,
      checkInDate,
      checkOutDate,
      bookingId: booking._id,
      reservationToken: lockToken,
      leaseExpiresAt: reservationLeaseExpiresAt,
    });
    if (!reservationCreated) {
      return res.status(409).json({
        success: false,
        message: "Room is no longer available for those dates.",
      });
    }
    try {
      await booking.save();
    } catch (error) {
      await releaseRoomNights(booking._id);
      reservationCreated = false;
      throw error;
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // 7. Create Stripe Checkout Session
    //    - amount_total is in the smallest currency unit (cents for USD)
    //    - metadata carries bookingId so the webhook can reconcile
    const checkoutParameters = {
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(totalPrice * 100), // dollars → cents
            product_data: {
              name: `${roomData.hotel.name} — ${roomData.roomType}`,
              description: `${nights} night${nights !== 1 ? "s" : ""} · Check-in ${checkInDate} · Check-out ${checkOutDate}`,
              images: roomData.images?.length ? [roomData.images[0]] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(booking._id),
        userId: String(userId),
        roomId: String(roomId),
        reservationToken: lockToken,
      },
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel?booking_id=${booking._id}`,
      // Session expires after 30 minutes; the webhook handles the expired event.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    };
    stripeCreateAttempted = true;
    session = await stripe.checkout.sessions.create(checkoutParameters, {
      idempotencyKey: `checkout-initial-${booking._id}`,
    });

    const sessionLeaseExpiresAt = new Date(session.expires_at * 1000);
    await attachStripeSessionToRoomNights(
      booking._id,
      session.id,
      sessionLeaseExpiresAt,
      lockToken
    );

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        stripeSessionLockToken: lockToken,
        stripeSessionId: null,
        paymentStatus: "pending",
        isPaid: { $ne: true },
      },
      {
        $set: { stripeSessionId: session.id },
        $unset: {
          stripeSessionLockToken: 1,
          stripeSessionLockExpiresAt: 1,
        },
      },
      { new: true }
    );
    if (!updatedBooking) {
      const currentBooking = await Booking.findById(booking._id);
      if (
        currentBooking?.stripeSessionId === session.id &&
        ["pending", "paid"].includes(currentBooking.paymentStatus)
      ) {
        return res.json({ success: true, url: session.url });
      }
      throw new Error("Booking changed before the Stripe session could be saved.");
    }

    return res.status(201).json({ success: true, url: session.url });
  } catch (error) {
    console.error("[payment] createCheckoutSession error:", error.message);
    if (booking && reservationCreated) {
      let safeToRelease =
        !stripeCreateAttempted || isDefinitiveStripeRequestFailure(error);

      if (session) {
        try {
          await attachStripeSessionToRoomNights(
            booking._id,
            session.id,
            new Date(session.expires_at * 1000),
            lockToken
          );
          let currentSession = await stripe.checkout.sessions.retrieve(session.id);
          if (currentSession.status === "open") {
            await stripe.checkout.sessions.expire(session.id);
            currentSession = await stripe.checkout.sessions.retrieve(session.id);
          }
          safeToRelease =
            currentSession.status === "expired" &&
            currentSession.payment_status === "unpaid";
        } catch (recoveryError) {
          console.error(
            `[payment] Could not safely expire Checkout Session ${session.id}:`,
            recoveryError.message
          );
        }

        if (!safeToRelease) {
          try {
            await Booking.updateOne(
              {
                _id: booking._id,
                stripeSessionLockToken: lockToken,
                stripeSessionId: null,
                paymentStatus: "pending",
                isPaid: { $ne: true },
              },
              {
                $set: { stripeSessionId: session.id },
                $unset: {
                  stripeSessionLockToken: 1,
                  stripeSessionLockExpiresAt: 1,
                },
              }
            );
          } catch (persistError) {
            console.error(
              `[payment] Could not persist recovery session ${session.id}:`,
              persistError.message
            );
          }
        }
      }

      if (safeToRelease) {
        try {
          const cancelledBooking = await Booking.findOneAndUpdate(
            {
              _id: booking._id,
              paymentStatus: "pending",
              isPaid: { $ne: true },
              ...(session
                ? {
                    $or: [
                      { stripeSessionLockToken: lockToken },
                      { stripeSessionId: session.id },
                    ],
                    stripeSessionId: { $in: [null, session.id] },
                  }
                : {
                    stripeSessionId: null,
                    stripeSessionLockToken: lockToken,
                  }),
            },
            {
              $set: { status: "cancelled", paymentStatus: "expired" },
              $unset: {
                stripeSessionLockToken: 1,
                stripeSessionLockExpiresAt: 1,
              },
            },
            { new: true, projection: { _id: 1 } }
          );
          if (cancelledBooking) {
            await releaseRoomNights(
              booking._id,
              session
                ? { stripeSessionId: session.id, reservationToken: lockToken }
                : { reservationToken: lockToken }
            );
          }
        } catch (cleanupError) {
          console.error("[payment] Could not release failed checkout reservation:", cleanupError.message);
        }
      }
    }
    return res.status(500).json({ success: false, message: "Unable to create payment session. Please try again." });
  }
};

// ─── POST /api/payments/webhook ──────────────────────────────────────────────

/**
 * Receives and verifies Stripe webhook events.
 *
 * Security:
 *  - express.raw({ type: "application/json" }) MUST be applied to this route
 *    BEFORE the global express.json() middleware so the raw body is preserved
 *    for Stripe signature verification.
 *  - STRIPE_WEBHOOK_SECRET is the signing secret from the Stripe Dashboard
 *    (whsec_...). Never expose it to the client.
 *
 * Idempotency:
 *  - All DB updates use findOneAndUpdate with { paymentStatus: "pending" } in
 *    the filter. If the same event is delivered twice, the second call finds no
 *    matching document and silently skips, preventing double-confirmation and
 *    duplicate emails.
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set.");
    return res.status(500).send("Webhook secret not configured.");
  }

  // Verify the event signature — throws if the signature is invalid or the
  // body has been altered. req.body must be the raw Buffer (express.raw).
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook signature error: ${err.message}`);
  }

  const session = event.data.object;
  let processingStatus = "processed";

  try {
    const previousEvent = await StripeWebhookEvent.findOne({
      stripeEventId: event.id,
    }).select("processingStatus");
    if (
      previousEvent &&
      ["processed", "ignored"].includes(previousEvent.processingStatus)
    ) {
      return res.status(200).json({ received: true });
    }

    if (event.type.startsWith("checkout.session.")) {
      const currentBooking = await Booking.exists({ stripeSessionId: session.id });
      if (
        !currentBooking &&
        mongoose.isValidObjectId(session.metadata?.bookingId) &&
        typeof session.metadata?.reservationToken === "string"
      ) {
        const reservation = await RoomNightReservation.findOne({
          booking: session.metadata.bookingId,
          reservationToken: session.metadata?.reservationToken,
          $or: [
            { stripeSessionId: session.id },
            { stripeSessionId: null },
          ],
        }).select("reservationToken");
        if (reservation?.reservationToken) {
          await RoomNightReservation.updateOne(
            {
              booking: session.metadata.bookingId,
              reservationToken: reservation.reservationToken,
              $or: [
                { stripeSessionId: session.id },
                { stripeSessionId: null },
              ],
            },
            {
              $set: {
                stripeSessionId: session.id,
                leaseExpiresAt: new Date(session.expires_at * 1000),
              },
            }
          );
          await Booking.updateOne(
            {
              _id: session.metadata.bookingId,
              stripeSessionLockToken: reservation.reservationToken,
              $or: [
                { paymentStatus: "pending" },
                {
                  paymentStatus: { $in: ["expired", "failed"] },
                  status: "cancelled",
                },
              ],
              isPaid: { $ne: true },
            },
            {
              $set: {
                stripeSessionId: session.id,
                status: "pending",
                paymentStatus: "pending",
              },
              $unset: {
                stripeSessionLockToken: 1,
                stripeSessionLockExpiresAt: 1,
              },
            }
          );
        }
      }
    }

    switch (event.type) {
      // ── Payment succeeded ───────────────────────────────────────────────
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        // Only confirm if the payment_status is "paid".
        // For async payment methods (e.g. bank transfers) the session status
        // may be "complete" but payment_status "unpaid" until the async event.
        if (session.payment_status !== "paid") break;

        const booking = await Booking.findOne({ stripeSessionId: session.id });
        if (!booking) {
          throw new Error(`No booking matches paid Checkout Session ${session.id}.`);
        }

        const expectedAmount = Math.round(Number(booking.totalPrice) * 100);
        const expectedCurrency = (booking.currency || "usd").toLowerCase();
        const receivedCurrency = (session.currency || "").toLowerCase();
        if (
          session.amount_total !== expectedAmount ||
          receivedCurrency !== expectedCurrency
        ) {
          console.error(
            `[webhook] ALERT: paid Checkout Session ${session.id} does not match booking ${booking._id}. ` +
            `Expected ${expectedAmount} ${expectedCurrency}; received ${session.amount_total} ${receivedCurrency}.`
          );
          processingStatus = "ignored";
          break;
        }

        if (booking.isPaid || booking.paymentStatus === "paid") {
          await updateRoomNightLease(booking._id, null);
          console.log(`[webhook] Booking ${booking._id} was already confirmed (session ${session.id}).`);
          break;
        }

        if (booking.paymentStatus !== "pending" || booking.status === "cancelled") {
          console.error(
            `[webhook] ALERT: paid Checkout Session ${session.id} belongs to inactive booking ${booking._id}.`
          );
          processingStatus = "ignored";
          break;
        }

        // Clear the lease before changing payment state so a failed lease update
        // leaves the booking pending and safely retryable by Stripe.
        await updateRoomNightLease(booking._id, null);

        // Atomic idempotency guard: only one delivery can confirm the booking.
        const confirmedBooking = await Booking.findOneAndUpdate(
          {
            _id: booking._id,
            stripeSessionId: session.id,
            paymentStatus: "pending", // guard: skip if already processed
            isPaid: { $ne: true },
          },
          {
            $set: {
              status: "confirmed",
              isPaid: true,
              paymentStatus: "paid",
              stripePaymentIntentId: session.payment_intent ?? null,
              paidAt: new Date(),
            },
            $unset: {
              stripeSessionLockToken: 1,
              stripeSessionLockExpiresAt: 1,
            },
          },
          { new: true }
        )
          .populate("user")
          .populate({ path: "room", populate: { path: "hotel" } });

        if (!confirmedBooking) {
          const currentBooking = await Booking.findById(booking._id);
          if (currentBooking?.isPaid && currentBooking.paymentStatus === "paid") {
            console.log(`[webhook] Booking ${booking._id} was concurrently confirmed.`);
            break;
          }
          console.error(
            `[webhook] ALERT: paid Checkout Session ${session.id} could not confirm booking ${booking._id}.`
          );
          processingStatus = "ignored";
          break;
        }

        console.log(`[webhook] Booking ${confirmedBooking._id} confirmed (session ${session.id}).`);

        // Send confirmation email only on first confirmation (idempotency above
        // guarantees findOneAndUpdate returns null on subsequent deliveries).
        try {
          await sendBookingConfirmationEmail({
            booking: confirmedBooking,
            user: confirmedBooking.user,
            room: confirmedBooking.room,
            hotel: confirmedBooking.room.hotel,
          });
        } catch (mailErr) {
          console.error("[payment] confirmation email failed:", mailErr.message);
        }
        break;
      }

      // ── Async payment failed ────────────────────────────────────────────
      case "checkout.session.async_payment_failed": {
        const failedBooking = await Booking.findOneAndUpdate(
          {
            stripeSessionId: session.id,
            paymentStatus: "pending",
            isPaid: { $ne: true },
            $or: [
              { stripeSessionLockExpiresAt: { $exists: false } },
              { stripeSessionLockExpiresAt: null },
              { stripeSessionLockExpiresAt: { $lte: new Date() } },
            ],
          },
          {
            $set: {
              status: "cancelled",
              paymentStatus: "failed",
            },
          },
          { new: true, projection: { _id: 1 } }
        );
        if (failedBooking) {
          await releaseRoomNights(failedBooking._id, { stripeSessionId: session.id });
        }
        console.log(`[webhook] Payment failed for session ${session.id}.`);
        break;
      }

      // ── Session expired without payment ────────────────────────────────
      case "checkout.session.expired": {
        const expiredBooking = await Booking.findOneAndUpdate(
          {
            stripeSessionId: session.id,
            paymentStatus: "pending",
            isPaid: { $ne: true },
            $or: [
              { stripeSessionLockExpiresAt: { $exists: false } },
              { stripeSessionLockExpiresAt: null },
              { stripeSessionLockExpiresAt: { $lte: new Date() } },
            ],
          },
          {
            $set: {
              status: "cancelled",
              paymentStatus: "expired",
            },
          },
          { new: true, projection: { _id: 1 } }
        );
        if (expiredBooking) {
          await releaseRoomNights(expiredBooking._id, { stripeSessionId: session.id });
        }
        console.log(`[webhook] Session ${session.id} expired.`);
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt so Stripe stops retrying.
        console.log(`[webhook] Unhandled event type: ${event.type}`);
        processingStatus = "ignored";
    }

    await StripeWebhookEvent.updateOne(
      { stripeEventId: event.id },
      {
        $set: {
          eventType: event.type,
          processingStatus,
          processedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[webhook] Handler error:", err.message);
    try {
      await StripeWebhookEvent.updateOne(
        { stripeEventId: event.id },
        {
          $set: {
            eventType: event.type,
            processingStatus: "failed",
          },
          $unset: { processedAt: 1 },
        },
        { upsert: true }
      );
    } catch (recordErr) {
      console.error("[webhook] Could not record failed event:", recordErr.message);
    }
    // Return 500 so Stripe will retry delivery.
    return res.status(500).send("Webhook handler error.");
  }

  // Always return 200 quickly so Stripe considers the event delivered.
  return res.status(200).json({ received: true });
};

// ─── POST /api/payments/reactivate-session ───────────────────────────────────

/**
 * "Pay Now" handler for existing unpaid bookings.
 *
 * When a customer returns to My Bookings and clicks "Pay Now" on a booking
 * whose Stripe session has expired (or was never created), this endpoint:
 *   1. Loads the existing booking by ID, verifying ownership.
 *   2. If the booking already has a stripeSessionId and that session is still
 *      open, returns the existing session URL immediately — no new session.
 *   3. Otherwise creates a fresh Stripe Checkout Session and updates the
 *      existing booking's stripeSessionId + resets paymentStatus to "pending".
 *
 * Crucially, this NEVER creates a second Booking document. The customer
 * retries payment against the original booking record.
 *
 * Security: Protected route — req.user must own the booking.
 */
export const reactivateCheckoutSession = async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user._id;
  let lockToken = null;
  let retrySession = null;
  let retryStripeCreateAttempted = false;
  let retryReservationAcquired = false;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: "bookingId is required." });
  }
  if (!mongoose.isValidObjectId(bookingId)) {
    return res.status(400).json({ success: false, message: "Invalid booking ID." });
  }

  try {
    // 1. Load the booking and verify ownership
    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    }).populate({ path: "room", populate: { path: "hotel" } });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.paymentMethod !== "stripe") {
      return res.status(400).json({
        success: false,
        message: "Only Stripe bookings can be retried through Stripe Checkout.",
      });
    }

    // 2. Only allow reactivation of unpaid bookings
    if (booking.isPaid || booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "This booking is already paid." });
    }
    if (
      booking.status === "cancelled" &&
      !["expired", "failed"].includes(booking.paymentStatus)
    ) {
      // A manually cancelled booking should not be reactivated; only
      // Stripe-expired cancellations are eligible for retry.
      return res.status(400).json({ success: false, message: "This booking has been cancelled." });
    }

    const currentSessionId = booking.stripeSessionId ?? null;
    lockToken = randomUUID();
    const lockExpiresAt = new Date(Date.now() + 40 * 60 * 1000);
    const lockedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        user: userId,
        isPaid: { $ne: true },
        stripeSessionId: currentSessionId,
        $and: [
          {
            $or: [
              { paymentStatus: "pending", status: { $ne: "cancelled" } },
              { paymentStatus: "expired", status: "cancelled" },
              { paymentStatus: "failed", status: "cancelled" },
            ],
          },
          {
            $or: [
              { stripeSessionLockExpiresAt: { $exists: false } },
              { stripeSessionLockExpiresAt: null },
              { stripeSessionLockExpiresAt: { $lte: new Date() } },
            ],
          },
        ],
      },
      {
        $set: {
          stripeSessionLockToken: lockToken,
          stripeSessionLockExpiresAt: lockExpiresAt,
        },
      },
      { new: true }
    );

    if (!lockedBooking) {
      return res.status(409).json({
        success: false,
        message: "Payment is already being processed. Please try again shortly.",
      });
    }

    const releaseSessionLock = async () => {
      await Booking.updateOne(
        { _id: booking._id, stripeSessionLockToken: lockToken },
        {
          $unset: {
            stripeSessionLockToken: 1,
            stripeSessionLockExpiresAt: 1,
          },
        }
      );
    };

    // 3. If there is an existing Stripe session, verify its actual status.
    if (currentSessionId) {
      let existingSession;
      try {
        existingSession = await stripe.checkout.sessions.retrieve(currentSessionId);
      } catch (error) {
        console.error("[payment] Unable to verify existing Stripe session:", error.message);
        await releaseSessionLock();
        return res.status(502).json({
          success: false,
          message: "Unable to verify the current payment session. Please try again.",
        });
      }

      if (existingSession.status === "open") {
        await releaseSessionLock();
        return res.json({ success: true, url: existingSession.url });
      }
      const failedPaymentCanRetry =
        booking.paymentStatus === "failed" &&
        existingSession.payment_status !== "paid";
      if (
        existingSession.payment_status === "paid" ||
        (existingSession.status !== "expired" && !failedPaymentCanRetry)
      ) {
        await releaseSessionLock();
        return res.status(409).json({
          success: false,
          message: "The current payment is still processing. Please wait for confirmation.",
        });
      }
    }

    const checkInDate = booking.checkInDate.toISOString().split("T")[0];
    const checkOutDate = booking.checkOutDate.toISOString().split("T")[0];
    const reservationLeaseExpiresAt = new Date(Date.now() + 35 * 60 * 1000);
    const roomIsAvailable = await checkBookingAvailability({
      room: booking.room._id,
      checkInDate,
      checkOutDate,
      excludeBookingId: booking._id,
    });
    if (!roomIsAvailable) {
      await releaseSessionLock();
      return res.status(409).json({
        success: false,
        message: "Room availability has changed. This booking cannot be retried.",
      });
    }

    const reserved = await reserveRoomNights({
      room: booking.room._id,
      checkInDate,
      checkOutDate,
      bookingId: booking._id,
      reservationToken: lockToken,
      leaseExpiresAt: reservationLeaseExpiresAt,
    });
    if (!reserved) {
      await releaseSessionLock();
      return res.status(409).json({
        success: false,
        message: "Room availability has changed. This booking cannot be retried.",
      });
    }
    retryReservationAcquired = true;
    await updateRoomNightLease(booking._id, reservationLeaseExpiresAt);

    // 4. Create a fresh Stripe Checkout Session for the same booking
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const room = booking.room;
    const hotel = room.hotel;
    const nights = Math.ceil(
      (booking.checkOutDate - booking.checkInDate) / (1000 * 60 * 60 * 24)
    );

    retryStripeCreateAttempted = true;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(booking.totalPrice * 100), // cents
            product_data: {
              name: `${hotel.name} — ${room.roomType}`,
              description: `${nights} night${nights !== 1 ? "s" : ""} · Check-in ${checkInDate} · Check-out ${checkOutDate}`,
              images: room.images?.length ? [room.images[0]] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(booking._id),
        userId: String(userId),
        roomId: String(room._id),
        reservationToken: lockToken,
      },
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel?booking_id=${booking._id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    }, {
      idempotencyKey: `checkout-retry-${booking._id}-${lockToken}`,
    });
    retrySession = session;

    await attachStripeSessionToRoomNights(
      booking._id,
      session.id,
      new Date(session.expires_at * 1000),
      lockToken
    );

    // 5. Update the EXISTING booking with the new session ID and reset
    //    paymentStatus to "pending" so the webhook can confirm it.
    //    Use findOneAndUpdate with ownership guard for atomic safety.
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        user: userId,
        paymentMethod: "stripe",
        stripeSessionId: currentSessionId,
        stripeSessionLockToken: lockToken,
        isPaid: { $ne: true },
        $or: [
          { paymentStatus: "pending", status: { $ne: "cancelled" } },
          { paymentStatus: "expired", status: "cancelled" },
          { paymentStatus: "failed", status: "cancelled" },
        ],
      },
      {
        $set: {
          stripeSessionId: session.id,
          paymentStatus: "pending",
          status: "pending",
        },
        $unset: {
          stripeSessionLockToken: 1,
          stripeSessionLockExpiresAt: 1,
        },
      }
    );

    if (!updatedBooking) {
      const currentBooking = await Booking.findOne({ _id: booking._id, user: userId });
      if (
        currentBooking?.stripeSessionId === session.id &&
        ["pending", "paid"].includes(currentBooking.paymentStatus)
      ) {
        return res.json({ success: true, url: session.url });
      }

      let safeToReleaseLock =
        session.status === "expired" && session.payment_status === "unpaid";
      if (session.status === "open" && session.payment_status !== "paid") {
        try {
          await stripe.checkout.sessions.expire(session.id);
          const expiredSession = await stripe.checkout.sessions.retrieve(session.id);
          safeToReleaseLock =
            expiredSession.status === "expired" &&
            expiredSession.payment_status === "unpaid";
        } catch (expireError) {
          console.error(
            `[payment] Could not expire unlinked Stripe session ${session.id}:`,
            expireError.message
          );
        }
      }
      if (safeToReleaseLock) {
        await releaseRoomNights(booking._id, {
          stripeSessionId: session.id,
          reservationToken: lockToken,
        });
        await releaseSessionLock();
      }
      return res.status(409).json({
        success: false,
        message: "Booking payment status changed. Refresh your bookings and try again.",
      });
    }

    console.log(`[payment] Reactivated session ${session.id} for booking ${booking._id}.`);
    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("[payment] reactivateCheckoutSession error:", error.message);
    let safeToReleaseLock =
      !retryStripeCreateAttempted || isDefinitiveStripeRequestFailure(error);
    if (safeToReleaseLock && retryReservationAcquired && !retrySession) {
      try {
        await releaseRoomNights(bookingId, { reservationToken: lockToken });
      } catch (releaseError) {
        console.error("[payment] Could not release failed retry reservation:", releaseError.message);
        safeToReleaseLock = false;
      }
    }
    if (retryReservationAcquired && lockToken) {
      try {
        const currentBooking = await Booking.findOne({
          _id: bookingId,
          user: userId,
        });
        if (
          currentBooking &&
          !currentBooking.isPaid &&
          currentBooking.paymentStatus !== "paid" &&
          retrySession
        ) {
          await attachStripeSessionToRoomNights(
            bookingId,
            retrySession.id,
            new Date(retrySession.expires_at * 1000),
            lockToken
          );
          let sessionState = await stripe.checkout.sessions.retrieve(retrySession.id);
          if (sessionState.status === "open") {
            await stripe.checkout.sessions.expire(retrySession.id);
            sessionState = await stripe.checkout.sessions.retrieve(retrySession.id);
          }
          if (
            sessionState.status === "expired" &&
            sessionState.payment_status === "unpaid"
          ) {
            await releaseRoomNights(bookingId, {
              stripeSessionId: retrySession.id,
              reservationToken: lockToken,
            });
            safeToReleaseLock = true;
          }
        }
      } catch (recoveryError) {
        console.error("[payment] Could not safely recover failed retry:", recoveryError.message);
      }
    }
    if (lockToken && safeToReleaseLock) {
      try {
        await Booking.updateOne(
          { _id: bookingId, user: userId, stripeSessionLockToken: lockToken },
          {
            $unset: {
              stripeSessionLockToken: 1,
              stripeSessionLockExpiresAt: 1,
            },
          }
        );
      } catch (releaseError) {
        console.error("[payment] Could not release checkout lock:", releaseError.message);
      }
    }
    return res.status(500).json({ success: false, message: "Unable to reactivate payment session. Please try again." });
  }
};

// ─── GET /api/payments/booking-status/:bookingId ─────────────────────────────

/**
 * Returns the payment and booking status for a single booking.
 * Used by the frontend PaymentSuccess page to verify payment server-side
 * rather than trusting the Stripe redirect URL alone.
 *
 * Security: Only the booking owner can query their booking status.
 */
export const getBookingPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id, // ownership check
    })
      .populate("hotel", "name address")
      .populate("room", "roomType images");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    return res.json({
      success: true,
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        isPaid: booking.isPaid,
        totalPrice: booking.totalPrice,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        hotel: booking.hotel,
        room: booking.room,
        paidAt: booking.paidAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/payments/session-status/:sessionId ─────────────────────────────

/**
 * Returns booking + payment status for a given Stripe session ID.
 * Called by the frontend PaymentSuccess page to verify payment server-side.
 * Requires authentication so only the booking owner can query their session.
 */
export const getSessionStatus = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      stripeSessionId: req.params.sessionId,
      user: req.user._id, // ownership check — cannot spy on other users' sessions
    })
      .populate("hotel", "name address")
      .populate("room", "roomType images");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found for this session." });
    }

    return res.json({
      success: true,
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        isPaid: booking.isPaid,
        totalPrice: booking.totalPrice,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        hotel: booking.hotel,
        room: booking.room,
        paidAt: booking.paidAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};