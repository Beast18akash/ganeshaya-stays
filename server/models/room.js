import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomType: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    totalQuantity: {
      type: Number,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "totalQuantity must be a positive integer.",
      },
    },
    amenities: { type: Array, required: true },
    images: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);
export default Room;
