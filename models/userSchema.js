const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() { return !this.googleId; } },
    cpassword: { type: String, required: false }, // Optional for Google sign-in
    googleId: { type: String, unique: true, sparse: true }, // Optional, with sparse indexing
    isBlocked: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false }, // Default to 'user'
    cart: [{ // Correctly placed
        type: Schema.Types.ObjectId,
        ref: 'Cart'
    }],
    orderHistory: [{ // Correctly placed
        type: Schema.Types.ObjectId,
        ref: 'Order'
    }]
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const User = mongoose.model('User', userSchema);
module.exports = {
    User
};
