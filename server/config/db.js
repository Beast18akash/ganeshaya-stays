import mongoose from 'mongoose';
import RoomNightReservation from "../models/roomNightReservation.js";
import StripeWebhookEvent from "../models/stripeWebhookEvent.js";

mongoose.connection.once('connected', () => {
  console.log('MongoDB connected');
});

const connectDB = async () => {
  const startedAt = performance.now();

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,
      autoCreate: false,
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }

  try {
    await Promise.all([
      RoomNightReservation.createIndexes(),
      StripeWebhookEvent.createIndexes(),
    ]);
  } catch (error) {
    console.error(`Required MongoDB payment indexes could not be created: ${error.message}`);
    throw error;
  }

};

export default connectDB;
