const Product = require('../../models/productModel')
const Cart = require('../../models/cartModel')
const User = require('../../models/userModel')


const cartPage = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const user = await User.findOne({ _id: userId });

        const cart = await Cart.findOne({ userId }).populate({
            path: 'cartItems.productId',
            model: 'Product'
        });

        if (!cart) {
            return res.render('cart', { cart: null, productsWithQuantity: [], user, totalPrice: '0.00' });
        }


        const productsWithQuantity = cart.cartItems.map(item => ({
            product: item.productId,
            quantity: item.quantity
        }));

        const totalPrice = productsWithQuantity.reduce((total, item) => {
            const price = parseFloat(item.product.offerPrice);
            const quantity = parseInt(item.quantity, 10);

            if (!isNaN(price) && !isNaN(quantity)) {
                total += price * quantity;
            }
            return total;
        }, 0);

        return res.render('cart', { cart, productsWithQuantity, user, totalPrice: totalPrice.toFixed(2) });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
    }
};


const addToCart = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const product = await Product.findById(productId);
        if (!product || product.stock === 0) {
            return res.status(404).json({ success: false, error: 'Product is out of stock' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, cartItems: [] });
        }

        const existingProduct = cart.cartItems.find(item => item.productId.toString() === productId);
        if (existingProduct) {
            const totalQuantity = existingProduct.quantity + 1;
            if (totalQuantity > product.stock || totalQuantity > 10) {
                return res.status(400).json({ success: false, error: 'Cannot add more items than available stock or exceed limit of 10 items per product' });
            }
            existingProduct.quantity = totalQuantity;
        } else {
            if (product.stock < 1) {
                return res.status(400).json({ success: false, error: 'Product is out of stock' });
            }
            cart.cartItems.push({ productId, quantity: 1, price: product.offerPrice });
        }

        await cart.save();

        const cartLength = cart.cartItems.reduce((total, item) => total + item.quantity, 0);
        res.status(200).json({ success: true, message: 'Product added to cart successfully', cartLength });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};


const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.query;

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        cart.cartItems = cart.cartItems.filter(item => item.productId.toString() !== productId);

        await cart.save();

        return res.status(200).send('Product removed from cart');
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
    }
};

const updateCartQuantity = async (req, res) => {
    try {
        const { productId, action } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const cart = await Cart.findOne({ userId }).populate({
            path: 'cartItems.productId',
            model: 'Product'
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const cartItem = cart.cartItems.find(item => item.productId._id.toString() === productId);

        if (!cartItem) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        if (action === 'increase') {
            if (cartItem.quantity < cartItem.productId.stock && cartItem.quantity < 10) {
                cartItem.quantity += 1;
            } else {
                return res.status(400).json({ message: 'Cannot add more items. Stock limit or maximum limit of 10 items reached.' });
            }
        } else if (action === 'decrease' && cartItem.quantity > 1) {
            cartItem.quantity -= 1;
        } else {
            return res.status(400).json({ message: 'Cannot decrease quantity below 1' });
        }

        await cart.save();

        const totalPrice = cart.cartItems.reduce((total, item) => {
            return total + item.productId.offerPrice * item.quantity;
        }, 0);

        const subtotal = cartItem.productId.offerPrice * cartItem.quantity;

        res.json({ quantity: cartItem.quantity, subtotal: subtotal.toFixed(2), totalPrice: totalPrice.toFixed(2) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};





module.exports = {
    cartPage,
    addToCart,
    removeFromCart,
    updateCartQuantity,
}