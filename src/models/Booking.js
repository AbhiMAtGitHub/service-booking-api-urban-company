const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pro: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    addOns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
    slot: { type: Date, required: true }, // start time of the booking slot
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING'
    },
    idempotencyKey: { type: String, unique: true, required: true }
  },
  { timestamps: true }
);

// unique index for slot locking (pro + slot)
bookingSchema.index({ pro: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
