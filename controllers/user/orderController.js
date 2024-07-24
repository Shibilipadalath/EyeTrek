const Product = require('../../models/productModel')
const Cart = require('../../models/cartModel')
const User = require('../../models/userModel')
const Address = require('../../models/addressModel')
const Order = require('../../models/orderModel')
const Razorpay = require('razorpay')

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
})


const onlinePay = async (req, res) => {
    try {
        let total = [];
        const userId = req.session.userId;
        const user = await User.findOne({ _id: userId });
        const address = await Address.findOne({ userId });
        const addressData = address.address.filter(data => data._id == req.body.addressId);
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        const cartItems = cart.cartItems;

        cartItems.forEach(data => {
            total.push(data.quantity * data.price);
        });


        function generateOrderId() {
            const timestamp = Date.now().toString();
            const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let orderId = 'ORD';
            while (orderId.length < 6) {
                const randomIndex = Math.floor(Math.random() * randomChars.length);
                orderId += randomChars.charAt(randomIndex);
            }
            return orderId + timestamp.slice(-6);
        }

        const newOrderId = generateOrderId();

        let TotalAmount = total.reduce((acc, cur) => acc + cur, 0)


        console.log("TotalAmount", TotalAmount)



        const order = new Order({
            userId, cartItems,
            totalPrice: TotalAmount,
            paymentMethod: "RazorPay",
            paymentStatus: "success",
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

        const amounts = TotalAmount;
        const order2 = await instance.orders.create({
            amount: amounts * 100,
            currency: "INR",
            receipt: req.session.user
        });

        console.log(order);
        console.log(order2);

        res.json({ order2, order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const placeOrder = async (req, res) => {
    try {
        let total = [];

        // const { addressId } = req.body.addressId;
        console.log(req.body, "dddddddddddddddddddddddddddddddddddddddd")
        const userId = req.session.userId;
        const user = await User.findOne({ _id: userId });
        const address = await Address.findOne({ userId });
        const addressData = address.address.filter(data => data._id == req.body.addressId);
        console.log("sssssssssssssssss", addressData)
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        const cartItems = cart.cartItems;


        cartItems.forEach(data => {
            total.push(data.quantity * data.price);
        });

        const order = new Order({
            userId, cartItems,
            totalPrice: total.reduce((acc, cur) => acc + cur, 0),
            paymentMethod: req.body.paymentMethod,
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

        res.status(200).json({ message: "order placed successfully", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false });
    }
}

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
}