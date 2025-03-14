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
    phone: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    isBlocked: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    cart: [{ type: Schema.Types.ObjectId, ref: 'Cart' }],
    orderHistory: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    wallet: {
      balance: { type: Number, default: 0 },
      transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
    },
    referralCode: { type: String, unique: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    referralDiscount: { type: Number, default: 0 },
    referrals: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = { User };
