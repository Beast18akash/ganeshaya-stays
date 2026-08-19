import User from "../models/userModel.js";
import {Webhook} from 'svix';

const clerkWebhook = async (req, res) => {
    try {
        //  Create a Svix instance with your Clerk webhook secret
        const wbook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        //  Getting  Headers
        const headers = {
            'svix-id': req.headers['svix-id'],
            'svix-timestamp': req.headers['svix-timestamp'],
            'svix-signature': req.headers['svix-signature']
        };
        // Verifying The Header
        await wbook.verify(JSON.stringify(req.body), headers);

        // Getting Data from request body 
        const {data , type} =  req.body
        const userData = {
            _id : data._id,
            email : data.email_addresses[0].email_addresses,
            username : data.first_name + " " + data.last_name,
            image : data.image_url,

        }

        // Switch Cases for  different Events
        switch(type){
            case "user.created" : {
                await User.create(userData)
                break;
            }
             case "user.updated" : {
                await User.findByIdAndUpdate( data.id,userData)
                break;
        }

         case "user.deleted" : {
                await User.findByIdAndDelete(data.id)
                break;
    }
    default :
    break;
}

res.json({success : true , message : "Webhook Received"})
    }
catch(error){
console.log(error.message);
res.json({success : false, message : error.message})
}
}

export default clerkWebhook;