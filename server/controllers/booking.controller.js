import Booking from "../models/booking.js"
import Hotel from "../models/hotel.js";
import Room from "../models/room.js"

const validateBookingDates = (checkInDate, checkOutDate, guests) => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(checkInDate) || !datePattern.test(checkOutDate)) {
        return "Check-in and check-out dates are required.";
    }

    const checkIn = new Date(`${checkInDate}T00:00:00.000Z`);
    const checkOut = new Date(`${checkOutDate}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
        return "Please provide valid dates.";
    }
    if (checkIn < today) {
        return "Check-in date cannot be in the past.";
    }
    if (checkOut <= checkIn) {
        return "Check-out date must be after check-in date.";
    }
    if (!Number.isInteger(Number(guests)) || Number(guests) < 1) {
        return "Guests must be at least 1.";
    }

    return null;
};

const toBookingDate = (date) => new Date(`${date}T00:00:00.000Z`);

//  function to Check Availability of Room 
const checkAvailability = async ({checkInDate , checkOutDate, room}) => {
    const requestedCheckIn = toBookingDate(checkInDate);
    const requestedCheckOut = toBookingDate(checkOutDate);
    const bookings  = await Booking.find({
        room,
        checkInDate: { $lt: requestedCheckOut },
        checkOutDate: { $gt: requestedCheckIn },
        status: { $ne: "cancelled" },
    });
    return bookings.length === 0;
}


//  Api to check Availability of Room
//  POST /api/bookings/check-availability

export const checkAvailabilityAPI = async(req,res) => {
    const {checkInDate , checkOutDate, room} = req.body;
    try {
        const validationError = validateBookingDates(checkInDate, checkOutDate, 1);
        if (validationError) {
            return res.status(400).json({success: false, message: validationError});
        }

        const roomData = await Room.findById(room);
        if (!roomData) {
            return res.status(404).json({success: false, message: "Room not found."});
        }
        if (!roomData.isAvailable) {
            return res.json({success: true, isAvailable: false, message: "This room is currently unavailable."});
        }

        const isAvailable = await checkAvailability({checkInDate , checkOutDate, room});
        return res.json({
            success: true,
            isAvailable,
            message: isAvailable ? "Room is available." : "Room is already booked for those dates.",
        });
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

// API to create a new booking
// POST /api/bookings/book

export const createBooking = async (req,res) => {
    const {room,guests,checkInDate, checkOutDate} = req.body;
    const user = req.user._id;
    try {
        const validationError = validateBookingDates(checkInDate, checkOutDate, guests);
        if (validationError) {
            return res.status(400).json({success: false, message: validationError});
        }

        const roomData = await Room.findById(room).populate("hotel");
        if (!roomData) {
            return res.status(404).json({success: false, message: "Room not found."});
        }
        if (!roomData.isAvailable) {
            return res.status(400).json({success: false, message: "This room is currently unavailable."});
        }

        const isAvailable = await checkAvailability({checkInDate , checkOutDate, room});
        if(!isAvailable){   
            return res.status(400).json({success: false, message: "Room is not available for those dates."});
        }
        //  Get totalPrice from Room
        let totalPrice = roomData.pricePerNight;


        // Calculate totalPrice based on nights
        const checkIn = toBookingDate(checkInDate)
        const checkOut = toBookingDate(checkOutDate)
        const diff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(diff / (1000*60*60*24));
        totalPrice = totalPrice * nights;

        await Booking.create({user,room,hotel: roomData.hotel._id,guests : +guests,checkInDate, checkOutDate,totalPrice});
        return res.status(201).json({success: true, message : "Booking Successfull"});
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

// API to get all bookings of a user
// GET /api/bookings/user/

export const getBookingsByUser = async (req,res) => {
    try {
        const user = req.user._id;
        const bookings = await Booking.find({user}).populate("room hotel").sort({createdAt : -1});

        return res.json({success:true , bookings});
    } catch (error) {
        res.json({success: false, message: "Failed to fetch bookings"})
    }
}

export const getHotelBookings = async (req,res) => {
    try {
     const hotel = await Hotel.findOne({owner : req.user._id})
     if (!hotel){
        return res.status(404).json({message : "Hotel not found"});
     }
     const bookings = await Booking.find({hotel : hotel._id}).populate("room hotel user").sort({createdAt : -1});
    //  Total Bookings 
     const totalBookings = bookings.length;
    //  Total Revenue
    const totalRevenue = bookings.reduce((acc,booking) => acc + booking.totalPrice,0);
    
     return res.json({success:true , dashboardData : {totalBookings,totalRevenue,bookings}});
    } catch (error) {
        res.json({success: false, message: "Failed to fetch bookings"})
    }
}