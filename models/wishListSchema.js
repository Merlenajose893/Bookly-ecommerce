const mongoose = require('mongoose');
const Schema = mongoose.Schema;  // Define Schema correctly

const wishListSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('wishlist', wishListSchema);