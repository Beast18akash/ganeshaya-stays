import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhook from "./controllers/clerkWebhooks.js";

const app = express();

// Connect MongoDB
connectDB();

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;