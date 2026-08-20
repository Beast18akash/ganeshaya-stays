import Hotel from "../models/hotel.model.js";
import User from "../models/user.js";

export const registerHotel = async (req, res) => {
    try {
        const { name, address, contact, city } = req.body;

        const owner = req.user._id;
        // Check if the User Already Registered 
        const hotel = await Hotel.findOne({ owner });
        if (hotel) {
            return res.status(400).json({ success: false, message: "User already registered a hotel" });
        }

        await Hotel.create({name, address,contact,city,owner})
        await User.findByIdAndUpdate(owner ,{role:"hotelOwner"})
        res.json({success : true , message : "Hotel registered Successfully"})
    }
    catch (error){
        res.json({success:false , message:error.message})
    }


};