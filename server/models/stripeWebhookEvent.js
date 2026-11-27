import mongoose from "mongoose";

const stripeWebhookEventSchema = new mongoose.Schema(
  {
    stripeEventId: { type: String, required: true },
    eventType: { type: String, required: true },
    processingStatus: {
      type: String,
      required: true,
      enum: ["processing", "processed", "failed", "ignored"],
    },
    processedAt: { type: Date },
  },
  { timestamps: true, collection: "stripewebhookevents" }
);

stripeWebhookEventSchema.index(
  { stripeEventId: 1 },
  { unique: true, name: "uniq_stripe_webhook_event_id" }
);

const StripeWebhookEvent =
  mongoose.models.StripeWebhookEvent ||
  mongoose.model("StripeWebhookEvent", stripeWebhookEventSchema);
export default StripeWebhookEvent;
