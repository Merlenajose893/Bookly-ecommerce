const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new Schema({
    offerType: { type: String, required: true, enum: ['Product', 'Category', 'Referral'] },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre' },
    // referralCode: { type: String, unique: true, sparse: true },
    discountType: { type: String, required: true, enum: ['Percentage', 'Fixed'] },
    discountValue: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


const Offer = mongoose.model('Offer', offerSchema);
module.exports = { Offer };