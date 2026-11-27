import "dotenv/config";
import mongoose from "mongoose";
import Booking from "../models/booking.js";
import RoomNightReservation from "../models/roomNightReservation.js";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be configured before creating Stripe indexes.");
}

try {
  await mongoose.connect(process.env.MONGODB_URI);

  await Booking.collection.createIndex(
    { stripeSessionId: 1 },
    {
      unique: true,
      name: "uniq_stripe_session_id_string",
      partialFilterExpression: { stripeSessionId: { $type: "string" } },
    }
  );
  await RoomNightReservation.collection.createIndex(
    { room: 1, date: 1 },
    { unique: true, name: "uniq_room_night" }
  );
  await RoomNightReservation.collection.createIndex(
    { booking: 1 },
    { name: "room_night_booking" }
  );

  const bookingIndexes = await Booking.collection.indexes();
  const legacySessionIndex = bookingIndexes.find(
    (index) =>
      index.unique &&
      index.sparse &&
      index.key?.stripeSessionId === 1
  );
  if (legacySessionIndex) {
    console.warn(
      `Legacy unique sparse index "${legacySessionIndex.name}" remains. ` +
      "Review it and drop it manually after confirming the partial index is active."
    );
  }

  console.log("Stripe session and room-night indexes are present.");
} finally {
  await mongoose.disconnect();
}
