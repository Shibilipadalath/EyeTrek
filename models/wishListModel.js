const mongoose = require('mongoose');

const wishListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Wishlist', wishListSchema);
