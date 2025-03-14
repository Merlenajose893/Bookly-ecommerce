const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    subTotal: {
      type: Number,
      default: 0
    }
  }],
  subTotal: {
    type: Number,
    default: 0
  },
  couponId: { 
    type: Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  discountAmount: { 
    type: Number,
    default: 0
  },
  appliedCoupon: { type: String, default: null },
  total: { 
    type: Number,
    default: 0
  }
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = { Cart };
