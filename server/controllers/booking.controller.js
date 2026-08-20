import Booking from "../models/booking.js"
import Hotel from "../models/hotel.js";
import Room from "../models/room.js"

//  function to Check Availability of Room 
const checkAvailability = async ({checkInDate , checkOutDate, room}) => {
    try {
        const bookings  = await Booking.find({
            room,
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate },    
            
        });
      const isAvailable  = bookings.length === 0;
      return isAvailable;
    } catch (error) {
        console.error(error.message)

    }
}


//  Api to check Availability of Room
//  POST /api/bookings/check-availability

export const checkAvailabilityAPI = async(req,res) => {
    const {checkInDate , checkOutDate, room} = req.body;
    try {
        const isAvailable = await checkAvailability({checkInDate , checkOutDate, room});
        if(isAvailable){
            return res.json({success:true , isAvailable})
        }
    } catch (error) {
           res.json({success: false, message: error.message})
    }
}

// API to create a new booking
// POST /api/bookings/book

export const createBooking = async (req,res) => {
    const {room,guests,checkInDate, checkOutDate} = req.body;
    const user = req.user._id;
    try {
        const isAvailable = await checkAvailability({checkInDate , checkOutDate, room});
        if(!isAvailable){   
            return res.status(400).json({message: "Room is not available"});
        }
        //  Get totalPrice from Room
        const roomData = await Room.findbyid(room).populate("hotel")
        let totalPrice = roomData.pricePerNight;


        // Calculate totalPrice based on nights
        const checkIn = new Date(checkInDate)
        const checkOut = new Date(checkOutDate)
        const diff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(diff / (1000*60*60*24));
        totalPrice = totalPrice * nights;

        const booking = await Booking.create({user,room,hotel: roomData.hotel._id,guests : +guests,checkInDate, checkOutDate,totalPrice});
        return res.status(201).json({success: true, message : "Booking Successfull"});
    } catch (error) {
        res.json({success: false, message: error.message})
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
     const hotel = Hotel.findOne({owner : req.auth.userId})
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