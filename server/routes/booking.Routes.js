import express from "express";
import { checkAvailabilityAPI, createBooking, getBookingsByUser, getHotelBookings } from "../controllers/booking.controller.js";
import {protect} from "../middleware/auth.middleware.js"

const Bookingrouter = express.Router();

Bookingrouter.post("/check-availability",checkAvailabilityAPI);
Bookingrouter.post("/book",protect , createBooking);
Bookingrouter.get("/user",protect, getBookingsByUser);
Bookingrouter.get("/hotel",protect , getHotelBookings);

export default Bookingrouter;
