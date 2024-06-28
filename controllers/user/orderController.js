const Product = require('../../models/productModel')
const Cart = require('../../models/cartModel')
const User = require('../../models/userModel')
const Address = require('../../models/addressModel')
const Order = require('../../models/orderModel')

const placeOrder = async (req, res) => {
    try {
        let total = [];
        const { addressId } = req.body;
        const userId = req.session.userId;
        const user = await User.findOne({ _id: userId });
        const address = await Address.findOne({ userId });
        const addressData = address.address.filter(data => data._id == addressId);
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        const cartItems = cart.cartItems;
        
        cartItems.forEach(data => {
            total.push(data.quantity * data.price);
        });
        
        const order = new Order({
            userId, cartItems,
            totalPrice: total.reduce((acc, cur) => acc + cur, 0),
            paymentMethod: "COD",
            paymentStatus: "NOT PAID",
            status: "ORDER PLACED",
            address: addressData[0]
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
module.exports = {
    placeOrder
}