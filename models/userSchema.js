const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    cpassword: { type: String, required: false },
    address: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
    phone: { type: String, required: false }, // Phone number
    googleId: { type: String, unique: true, sparse: true }, // Optional, with sparse indexing
    isBlocked: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false }, // Default to 'user'
    cart: [{ type: Schema.Types.ObjectId, ref: 'Cart' }],
    orderHistory: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    
    // Wallet Feature
    wallet: {
      balance: { type: Number, default: 0 }, // Wallet balance
      transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }], // Reference to transaction history
    },

    // Referral System
    referralCode: { type: String, unique: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    referralDiscount: { type: Number, default: 0 },
    referrals: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Users referred by this user

  },
  { timestamps: true } // Keep timestamps inside the schema definition
);

const User = mongoose.model('User', userSchema);
module.exports = { User };
