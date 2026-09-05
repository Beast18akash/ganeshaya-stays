//  Api to create a new room for a hotel
import Room from "../models/room.js";
import Hotel from "../models/hotel.js";
import { v2 as cloudinary } from "cloudinary";

export const createRoom = async (req, res) => {
    try {
        const { roomType, pricePerNight, amenities } = req.body;
        const hotel = await Hotel.findOne({ owner: req.user._id });
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        if (!req.files?.length) {
            return res.status(400).json({ success: false, message: "At least one room image is required" });
        }

        if (!roomType || !pricePerNight || !amenities) {
            return res.status(400).json({ success: false, message: "Room type, price, and amenities are required" });
        }

        // Upload images to Cloudinary
        const uploadImages = req.files.map(async (file) => {
            const response = await cloudinary.uploader.upload(file.path);
            return response.secure_url;

        });

        //  wait for all images to be uploaded
        const images = await Promise.all(uploadImages);

        const room = await Room.create({ hotel: hotel._id, roomType, pricePerNight: +pricePerNight, amenities: JSON.parse(amenities), images });
        res.status(201).json({ success: true, message: "Room created successfully", });
    } catch (error) {
        console.error("Room creation failed:", error);
        const isCloudinaryUploadError = error.http_code === 403;
        res.status(isCloudinaryUploadError ? 503 : 500).json({
            success: false,
            message: isCloudinaryUploadError
            ? "Cloudinary rejected the image upload because this API key is missing the create permission. Generate an API key with upload/create permissions, update the server .env, and restart the server."
                : error.message,
        });
    }
}

//  Api to get all rooms for a hotel
export const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isAvailable: true }).populate({ path: 'hotel', populate: { path: 'owner', select: 'profilePicture fullname' } }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


//  Api to get all rooms for a  specific hotel
export const getOwnerRooms = async (req, res) => {
    try {
        const hotelData  = await Hotel.findOne({ owner : req.user._id });
        if(!hotelData) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        const rooms = await Room.find({ hotel : hotelData._id.toString() }).populate("hotel");
        res.status(200).json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Api to toggle the availability of a room
export const toggleRoomAvailability = async (req, res) => {
    try {
        const {roomId} = req.body;
        const roomData = await Room.findById(roomId);
        if(!roomData) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save();
        res.status(200).json({ success: true, message: "Room availability updated ", roomData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}