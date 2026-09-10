const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      default: 15000.00,
      min: [0, 'Balance cannot be negative'],
      unique: true, 
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0.00,
      min: [0, 'Balance cannot be negative'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN', 'CLOSED'],
      default: 'ACTIVE',
    },
    currency: {
      type: String,
      default: 'NGN',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);