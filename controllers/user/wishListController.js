const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Wishlist = require('../../models/wishListModel');

const wishListPage = async (req, res) => {
    try {
        const userExist = await User.findOne({ _id: req.session.userId });
        if (!userExist) {
            return res.status(404).send('User not found');
        }
        
        const wishlist = await Wishlist.findOne({ userId: req.session.userId }).populate('products');
        const products = wishlist ? wishlist.products : [];

        res.render('wishList', { userExist, products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const addToWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const userId = req.session.userId;

        console.log(`User ID: ${userId}, Product ID: ${productId}`);

        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }

        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
            return res.status(200).json({ message: 'Product added to wishlist successfully' });
        } else {
            return res.json({ error: 'Product already in wishlist' });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
        await wishlist.save();

        return res.status(200).json({ message: 'Product removed from wishlist successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = {
    wishListPage,
    addToWishList,
    removeFromWishlist
};
