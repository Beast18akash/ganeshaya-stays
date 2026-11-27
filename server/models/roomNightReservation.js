import mongoose from "mongoose";

const roomNightReservationSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: { type: Date, required: true },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    stripeSessionId: { type: String, default: null },
    reservationToken: { type: String, default: null },
    leaseExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "roomnightreservations" }
);

roomNightReservationSchema.index(
  { room: 1, date: 1 },
  { unique: true, name: "uniq_room_night" }
);
roomNightReservationSchema.index({ booking: 1 }, { name: "room_night_booking" });

const RoomNightReservation =
  mongoose.models.RoomNightReservation ||
  mongoose.model("RoomNightReservation", roomNightReservationSchema);
export default RoomNightReservation;
