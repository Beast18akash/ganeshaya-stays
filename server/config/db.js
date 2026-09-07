import mongoose from 'mongoose';

mongoose.connection.once('connected', () => {
  console.log('MongoDB connected');
});

const connectDB = async () => {
  const startedAt = performance.now();

  try {
    await mongoose.connect(process.env.MONGODB_URI)
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }

};

export default connectDB;
