const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pro: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review: {
      type: String,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

// 1 rating per (booking, customer)
ratingSchema.index({ booking: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
