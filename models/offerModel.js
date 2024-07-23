const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    discountOn: {
        type: String,
        enum: ["product", "category"],
        required: true,
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixedAmount"],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expireOn: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    discountedProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
    },
    discountedCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
});

module.exports = mongoose.model('Offer', offerSchema);
