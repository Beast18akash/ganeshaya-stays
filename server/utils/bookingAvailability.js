import Booking from "../models/booking.js";
import RoomNightReservation from "../models/roomNightReservation.js";
import stripe from "../config/stripe.js";

const toBookingDate = (date) => new Date(`${date}T00:00:00.000Z`);

const getNights = (checkInDate, checkOutDate) => {
  const nights = [];
  const checkIn = toBookingDate(checkInDate);
  const checkOut = toBookingDate(checkOutDate);

  for (let night = checkIn; night < checkOut; night.setUTCDate(night.getUTCDate() + 1)) {
    nights.push(new Date(night));
  }
  return nights;
};

const releaseCreatedReservations = async (reservationIds) => {
  if (reservationIds.length) {
    await RoomNightReservation.deleteMany({ _id: { $in: reservationIds } });
  }
};

const rollbackReservations = async (
  createdReservationIds,
  modifiedReservations,
  reservationToken
) => {
  await releaseCreatedReservations(createdReservationIds);
  for (const reservation of modifiedReservations) {
    await RoomNightReservation.updateOne(
      {
        _id: reservation._id,
        reservationToken,
      },
      {
        $set: {
          reservationToken: reservation.reservationToken,
          stripeSessionId: reservation.stripeSessionId,
          leaseExpiresAt: reservation.leaseExpiresAt,
        },
      }
    );
  }
};

export const reserveRoomNights = async ({
  room,
  checkInDate,
  checkOutDate,
  bookingId,
  reservationToken = null,
  leaseExpiresAt = null,
}) => {
  const createdReservationIds = [];
  const modifiedReservations = [];

  try {
    for (const date of getNights(checkInDate, checkOutDate)) {
      try {
        const reservation = await RoomNightReservation.create({
          room,
          date,
          booking: bookingId,
          reservationToken,
          leaseExpiresAt,
        });
        createdReservationIds.push(reservation._id);
      } catch (error) {
        if (error.code !== 11000) throw error;

        const existingReservation = await RoomNightReservation.findOne({
          room,
          date,
        }).select("booking reservationToken stripeSessionId leaseExpiresAt");

        if (String(existingReservation?.booking) !== String(bookingId)) {
          await rollbackReservations(
            createdReservationIds,
            modifiedReservations,
            reservationToken
          );
          return false;
        }
        modifiedReservations.push({
          _id: existingReservation._id,
          reservationToken: existingReservation.reservationToken,
          stripeSessionId: existingReservation.stripeSessionId,
          leaseExpiresAt: existingReservation.leaseExpiresAt,
        });
        await RoomNightReservation.updateOne(
          { _id: existingReservation._id, booking: bookingId },
          {
            $set: {
              reservationToken,
              stripeSessionId: null,
              leaseExpiresAt,
            },
          }
        );
      }
    }

    return true;
  } catch (error) {
    try {
      await rollbackReservations(
        createdReservationIds,
        modifiedReservations,
        reservationToken
      );
    } catch (rollbackError) {
      console.error("[booking] Failed to roll back partial room-night reservation:", rollbackError.message);
    }
    throw error;
  }
};

export const releaseRoomNights = async (
  bookingId,
  { stripeSessionId, reservationToken } = {}
) => {
  const filter = { booking: bookingId };
  if (stripeSessionId) filter.stripeSessionId = stripeSessionId;
  if (reservationToken) filter.reservationToken = reservationToken;
  await RoomNightReservation.deleteMany(filter);
};

export const updateRoomNightLease = async (bookingId, leaseExpiresAt) => {
  await RoomNightReservation.updateMany(
    { booking: bookingId },
    { $set: { leaseExpiresAt } }
  );
};

export const attachStripeSessionToRoomNights = async (
  bookingId,
  stripeSessionId,
  leaseExpiresAt,
  reservationToken
) => {
  const filter = { booking: bookingId };
  if (reservationToken) filter.reservationToken = reservationToken;
  await RoomNightReservation.updateMany(
    filter,
    { $set: { stripeSessionId, leaseExpiresAt } }
  );
};

const expirePendingBooking = async (booking, sessionId, now, reservationToken) => {
  const filter = {
    _id: booking._id,
    paymentStatus: "pending",
    isPaid: { $ne: true },
    $and: [
      {
        $or: [
          { stripeSessionLockExpiresAt: { $exists: false } },
          { stripeSessionLockExpiresAt: null },
          { stripeSessionLockExpiresAt: { $lte: now } },
        ],
      },
    ],
  };
  if (sessionId) {
    filter.$and.push({ $or: [
      { stripeSessionId: sessionId },
      { stripeSessionId: null },
    ] });
  } else {
    filter.stripeSessionId = null;
  }

  const expiredBooking = await Booking.findOneAndUpdate(
    filter,
    { $set: { status: "cancelled", paymentStatus: "expired" } },
    { new: true, projection: { _id: 1 } }
  );

  if (expiredBooking) {
    if (sessionId) {
      await releaseRoomNights(booking._id, { stripeSessionId: sessionId });
    } else if (reservationToken) {
      await releaseRoomNights(booking._id, { reservationToken });
    }
    return true;
  }
  return false;
};

const reconcilePendingBooking = async (booking, now) => {
  if (
    booking.paymentMethod !== "stripe" ||
    booking.paymentStatus !== "pending" ||
    booking.isPaid ||
    booking.stripeSessionLockExpiresAt > now
  ) {
    return;
  }

  if (!booking.stripeSessionId) {
    const reservation = await RoomNightReservation.findOne({ booking: booking._id })
      .select("leaseExpiresAt stripeSessionId reservationToken");
    const leaseExpiresAt = reservation?.leaseExpiresAt;
    const safeExpiry = leaseExpiresAt ||
      new Date((booking.createdAt || now).getTime() + 35 * 60 * 1000);
    if (safeExpiry <= now) {
      if (reservation?.stripeSessionId) {
        await reconcileReservationSession(booking, reservation.stripeSessionId, now);
      } else {
        await expirePendingBooking(
          booking,
          null,
          now,
          reservation?.reservationToken
        );
      }
    }
    return;
  }

  await reconcileReservationSession(booking, booking.stripeSessionId, now);
};

const reconcileReservationSession = async (booking, stripeSessionId, now) => {
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(stripeSessionId);
  } catch (error) {
    console.error(
      `[availability] Could not verify Stripe session ${stripeSessionId}; keeping booking active:`,
      error.message
    );
    return;
  }

  if (session.status === "expired" && session.payment_status === "unpaid") {
    if (
      !booking.stripeSessionId ||
      booking.stripeSessionId === session.id
    ) {
      await expirePendingBooking(booking, session.id, now);
    } else {
      await releaseRoomNights(booking._id, { stripeSessionId: session.id });
    }
    return;
  }

  if (session.status === "open" && session.expires_at * 1000 > now.getTime()) {
    await updateRoomNightLease(
      booking._id,
      new Date(session.expires_at * 1000)
    );
    return;
  }

  if (session.status === "complete") {
    // Completion may still be awaiting an asynchronous payment result.
    await updateRoomNightLease(booking._id, null);
  }
};

export const checkBookingAvailability = async ({
  checkInDate,
  checkOutDate,
  room,
  excludeBookingId,
}) => {
  const requestedCheckIn = toBookingDate(checkInDate);
  const requestedCheckOut = toBookingDate(checkOutDate);
  const now = new Date();
  const overlappingQuery = {
    room,
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
    checkInDate: { $lt: requestedCheckOut },
    checkOutDate: { $gt: requestedCheckIn },
    status: { $nin: ["cancelled"] },
    paymentStatus: { $nin: ["expired", "failed"] },
  };

  const overlappingBookings = await Booking.find(overlappingQuery);
  for (const booking of overlappingBookings) {
    await reconcilePendingBooking(booking, now);
  }

  const reservations = await RoomNightReservation.find({
    room,
    ...(excludeBookingId ? { booking: { $ne: excludeBookingId } } : {}),
    date: { $gte: requestedCheckIn, $lt: requestedCheckOut },
  });
  for (const reservation of reservations) {
    const leaseExpired =
      reservation.leaseExpiresAt && reservation.leaseExpiresAt <= now;
    const booking = await Booking.findById(reservation.booking);
    if (!booking) {
      if (!leaseExpired) continue;
      if (reservation.stripeSessionId) {
        let session;
        try {
          session = await stripe.checkout.sessions.retrieve(reservation.stripeSessionId);
        } catch (error) {
          console.error(
            `[availability] Could not verify orphaned Stripe session ${reservation.stripeSessionId}; keeping reservation:`,
            error.message
          );
          continue;
        }
        if (session.status === "expired" && session.payment_status === "unpaid") {
          await RoomNightReservation.deleteMany({
            _id: reservation._id,
            stripeSessionId: session.id,
          });
        }
      } else {
        await RoomNightReservation.deleteMany({
          _id: reservation._id,
          leaseExpiresAt: { $lte: now },
        });
      }
      continue;
    }

    if (booking.isPaid || booking.paymentStatus === "paid") {
      await updateRoomNightLease(booking._id, null);
      continue;
    }

    if (booking.paymentMethod !== "stripe") {
      if (booking.status === "cancelled") {
        await RoomNightReservation.deleteOne({
          _id: reservation._id,
          booking: booking._id,
        });
      } else {
        await updateRoomNightLease(booking._id, null);
      }
      continue;
    }

    if (["cancelled", "expired", "failed"].includes(booking.status) ||
        ["expired", "failed"].includes(booking.paymentStatus)) {
      if (booking.stripeSessionLockExpiresAt > now) continue;
      if (
        reservation.stripeSessionId &&
        reservation.stripeSessionId !== booking.stripeSessionId
      ) {
        await reconcileReservationSession(
          booking,
          reservation.stripeSessionId,
          now
        );
      } else if (reservation.stripeSessionId) {
        await releaseRoomNights(booking._id, {
          stripeSessionId: reservation.stripeSessionId,
        });
      } else if (reservation.reservationToken) {
        await releaseRoomNights(booking._id, {
          reservationToken: reservation.reservationToken,
        });
      }
      continue;
    }

    if (!leaseExpired) continue;

    const sessionId = booking.stripeSessionId || reservation.stripeSessionId;
    if (!sessionId) {
      await expirePendingBooking(
        booking,
        null,
        now,
        reservation.reservationToken
      );
      continue;
    }

    await reconcileReservationSession(booking, sessionId, now);
  }

  const activeBookings = await Booking.exists(overlappingQuery);
  const overlappingReservations = await RoomNightReservation.exists({
    room,
    ...(excludeBookingId ? { booking: { $ne: excludeBookingId } } : {}),
    date: { $gte: requestedCheckIn, $lt: requestedCheckOut },
  });

  return !activeBookings && !overlappingReservations;
};
