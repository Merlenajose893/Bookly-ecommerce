const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    books: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1, // Ensures at least 1 item is ordered
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: false, // Added discount field
      default: 0, // Default discount is 0 if not provided
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "Debit Card", "PayPal", "Online Payment", "cod", "Razorpay"], // Added Razorpay
      required: true,
    },
    razorpay: {
      paymentId: String,
      orderId: String,
      signature: String,
    },
    shippingAddress: {
      name: { type: String, required: true },
      address: { type: String, default: false },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Shipped", "Delivered", "Cancelled", "Returning", "Returned", "Return Approve"],
      default: "Pending",
      required: true,
    },
    statusHistory: [
      {
        status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returning", "Returned", "Return Approve"] },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    returnedProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
        quantity: { type: Number, required: true },
        reason: { type: String, required: true },
        returnDate: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true } // Automatically handles createdAt & updatedAt
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
