const mongoose = require('mongoose');

const addOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    extraPrice: { type: Number, required: true, min: 0 },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AddOn', addOnSchema);
