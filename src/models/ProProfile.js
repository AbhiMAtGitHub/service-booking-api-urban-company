const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true }, // start time of available block
    duration: { type: Number, default: 60 }, // duration in minutes
    // optional: repeat rule, metadata etc. -> keep simple for now
  },
  { _id: false }
);

const proProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    pincodes: [{ type: String, index: true }], // simple coverage list e.g. "560001"
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    coverageRadiusKm: { type: Number, default: 20 }, // fallback radius if pincode not matched
    servicesProvided: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    ],
    availabilitySlots: [availabilitySlotSchema],
    bio: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

// 2dsphere index for geo queries
proProfileSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ProProfile", proProfileSchema);
