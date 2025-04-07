const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    isbn: { type: String, required: true },
    publisher: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    regularPrice: { type: Number, required: true },
    salesPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    images: [{ type: String, required: true }],
    formats: [{ type: String }],
    bookImages: [{ type: String }],
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    
});

const Book = mongoose.model('Book', bookSchema);
module.exports = { Book };
