const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User model
    required: true,
  },
  balance: {
    type: Number,
    default: 0,  // Starting balance
    required: true,
  },
  transactions: [{
    type: Schema.Types.ObjectId,
    ref: 'Transaction',  // Reference to the Transaction model
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
