import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ["local", "google", "github"],
    },
    providerId: {
      type: String,
      default: null,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    providers: {
      type: [providerSchema],
      default: [],
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "hotelOwner"],
      default: "user",
    },
    recentSearchedCities: {
      type: [String],
      default: [],
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.hasProvider = function (providerName) {
  return this.providers.some((p) => p.provider === providerName);
};

userSchema.methods.linkProvider = function (providerName, providerId) {
  const alreadyLinked = this.providers.some((p) => p.provider === providerName);

  if (!alreadyLinked) {
    this.providers.push({
      provider: providerName,
      providerId: providerId ?? null,
      linkedAt: new Date(),
    });
    return true;
  }

  return false;
};

export default mongoose.model("User", userSchema);
