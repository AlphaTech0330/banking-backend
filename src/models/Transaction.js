const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    senderAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null, // null for external deposits
    },
    receiverAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null, // null for external withdrawals
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Transaction amount must be at least 1'],
    },
    type: {
      type: String,
      required: true,
      enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'SUCCESSFUL', 'FAILED'],
      default: 'PENDING',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);