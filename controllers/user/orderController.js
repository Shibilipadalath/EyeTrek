const Product = require('../../models/productModel')
const Cart = require('../../models/cartModel')
const User = require('../../models/userModel')
const Address = require('../../models/addressModel')
const Order = require('../../models/orderModel')
const Wallet = require('../../models/walletModel')
const Coupon = require('../../models/couponModel')
const Razorpay = require('razorpay')

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
})

const checkOutPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/login'); 
        }

        const currentDate = new Date();
        await Coupon.updateMany({ expiryDate: { $lt: currentDate } }, { $set: { isListed: false } });
        
        const userData = await User.findOne({ _id: userId });
        const addressData = await Address.findOne({ userId }).populate('userId');
        const cartData = await Cart.findOne({ userId }).populate('cartItems.productId');
        const coupons = await Coupon.find({ isListed: true });

        if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
            return res.redirect('/');
        }

        let cartTotalPrice = 0;
        if (cartData.cartItems) {
            cartTotalPrice = cartData.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        }
        
        return res.render('checkOut', { user: userData, address: addressData, cart: cartData, cartTotalPrice, coupons });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}



const applyCoupon = async (req, res) => {
    const { couponCode, cartTotal } = req.body;
    try {
        const coupon = await Coupon.findOne({ coupon_code: couponCode, isListed: true });
        if (coupon) {
            let discount = (cartTotal * coupon.percentage) / 100;

            if (discount > coupon.maximumAmount) {
                discount = coupon.maximumAmount;
            }

            const totalPrice = cartTotal - discount;

            return res.json({ success: true, totalPrice: totalPrice.toFixed(2), discount: discount.toFixed(2) });
        } else {
            return res.json({ success: false, message: 'Invalid coupon code' });
        }
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: 'An error occurred' });
    }
}




const onlinePay = async (req, res) => {
    try {
        let total = [];
        const userId = req.session.userId;
        const address = await Address.findOne({ userId });
        const addressData = address.address.filter(data => data._id == req.body.addressId);
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        const cartItems = cart.cartItems;

        cartItems.forEach(data => {
            total.push(data.quantity * data.price);
        });

        const generateOrderId = () => {
            const timestamp = Date.now().toString();
            const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let orderId = 'ORD';
            while (orderId.length < 6) {
                const randomIndex = Math.floor(Math.random() * randomChars.length);
                orderId += randomChars.charAt(randomIndex);
            }
            return orderId + timestamp.slice(-6);
        };

        const totalAmount = total.reduce((acc, cur) => acc + cur, 0);

        const order = new Order({
            userId,
            cartItems,
            totalPrice: totalAmount,
            paymentMethod: "RazorPay",
            paymentStatus: "Pending",
            status: "ORDER PLACED",
            address: addressData
        });

        await order.save();

        for (const item of cartItems) {
            const productData = await Product.findOne({ _id: item.productId });
            productData.stock -= item.quantity;
            await productData.save();
        }

        await Cart.deleteOne({ userId });

        const order2 = await instance.orders.create({
            amount: totalAmount * 100,
            currency: "INR",
            receipt: req.session.user,
        });

        res.json({ order2, order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const saveOrder = async (req, res) => {
    try {
        const orderId = req.query.id;
        const { paymentStatus } = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        order.paymentStatus = paymentStatus;
        await order.save();
        
        res.status(200).json({ message: "Order updated successfully" });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ message: "Failed to save the order" });
    }
};



const placeOrder = async (req, res) => {
    try {
        let total = [];
        console.log(req.body, "Request body");

        const userId = req.session.userId;
        const address = await Address.findOne({ userId });
        const addressData = address.address.filter(data => data._id == req.body.addressId);

        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        const cartItems = cart.cartItems;

        cartItems.forEach(data => {
            total.push(data.quantity * data.price);
        });

        const totalAmount = total.reduce((acc, cur) => acc + cur, 0);

        let paymentStatus;
        if (req.body.paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });

            if (!wallet||wallet.balance < totalAmount) {
                return res.status(400).json({ message: "Insufficient wallet balance", success: false });
            }

            wallet.balance -= totalAmount;
            wallet.history.push({
                amount: totalAmount,
                type: 'debit',
                createdAt: new Date()
            });
            await wallet.save();

            paymentStatus = "Success";
        } else if (req.body.paymentMethod === 'Cash on Delivery') {
            paymentStatus = "Pending";
        } else if (req.body.paymentMethod === 'Razorpay') {
            paymentStatus = "Pending";
        } else {
            paymentStatus = "Pending";
        }
        const order = new Order({
            userId,
            cartItems,
            totalPrice: totalAmount,
            paymentMethod: req.body.paymentMethod,
            paymentStatus: paymentStatus,
            status: "ORDER PLACED",
            address: addressData
        });

        await order.save();

        for (const item of cartItems) {
            const productData = await Product.findOne({ _id: item.productId });
            productData.stock -= item.quantity;
            await productData.save();
        }

        await Cart.deleteOne({ userId });

        res.status(200).json({ message: "Order placed successfully", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false });
    }
};



const thankYou = async (req, res) => {
    try {
        const userId = req.session.userId
        const latestOrder = await Order.findOne({ userId }).sort({ createdAt: -1 }).exec()

        res.render('thankPage', { order: latestOrder })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}



module.exports = {
    placeOrder,
    thankYou,
    onlinePay,
    checkOutPage,
    applyCoupon,
    saveOrder
}