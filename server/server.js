import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhook from "./controllers/clerkWebhooks.js";
import userRouter from "./Routes/user.route.js";
import hotelRouter from './Routes/hotel.Route.js'
import roomRouter from './Routes/roomRoute.js'
import connectCloudinary from "./config/cloudinary.js";
const app = express();

// Connect MongoDB
connectDB();

// Connect Cloudinary
connectCloudinary();

// Enable CORS
app.use(cors());

// Clerk webhook
// IMPORTANT: This must come BEFORE express.json()
app.post(
    "/api/clerk",
    express.raw({ type: "application/json" }),
    clerkWebhook
);

// Parse JSON requests
app.use(express.json());

// Clerk middleware
app.use(clerkMiddleware());

// Test route
app.get("/", (req, res) => {
    res.send("API is working!");
});

app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;