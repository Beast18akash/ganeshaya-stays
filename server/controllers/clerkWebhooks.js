import User from "../models/user.js";
import { Webhook } from "svix";

const clerkWebhook = async (req, res) => {
    try {
        // Create Svix Webhook instance
        const webhook = new Webhook(
            process.env.CLERK_WEBHOOK_SECRET
        );

        // Get Svix headers
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        };

        // Verify webhook signature
        const payload = await webhook.verify(req.body, headers);

        // Get event data
        const { data, type } = payload;

        console.log("Clerk webhook received:", type);
        console.log("Clerk user ID:", data.id);

        // Prepare user data
        const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address,
            username: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            image: data.image_url,
        };

        // Handle different Clerk events
        switch (type) {
            case "user.created": {
                await User.create(userData);

                console.log("User created successfully:", data.id);
                break;
            }

            case "user.updated": {
                await User.findByIdAndUpdate(
                    data.id,
                    userData,
                    { new: true }
                );

                console.log("User updated successfully:", data.id);
                break;
            }

            case "user.deleted": {
                await User.findByIdAndDelete(data.id);

                console.log("User deleted successfully:", data.id);
                break;
            }

            default:
                console.log("Unhandled Clerk event:", type);
                break;
        }

        return res.status(200).json({
            success: true,
            message: "Webhook received successfully",
        });

    } catch (error) {
        console.error("Clerk webhook error:", error);

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export default clerkWebhook;