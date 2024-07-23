const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    coupon_code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    minimumAmount: {
        type: Number,
        required: true
    },
    maximumAmount: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Coupon', CouponSchema);
