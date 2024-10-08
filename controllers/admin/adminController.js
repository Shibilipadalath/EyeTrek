const User = require('../../models/userModel')
const Order = require('../../models/orderModel')

const loadAdmin = async (req, res) => {
    try {
        res.render('adminLogin', { error: '' })
    } catch (error) {
        console.error(error);
    }
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (process.env.adminEmail == email && process.env.adminPassword == password) {
            req.session.adminId = email
            res.redirect('/admin/adminHome')
        } else {
            return res.render('adminLogin', { error: 'Admin credentials not recognized' })
        }
    } catch (error) {
        console.error(error)
    }

}
const adminLogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            return res.redirect('/admin');
        });
    } catch (error) {
        return res.status(500).send('Internal Server Error')
    }
}


const userManagement = async (req, res) => {
    try {
        const user = await User.find({})
        return res.render('userManagement', { user })
    } catch (error) {
        console.error(error)
    }
}


const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const block = await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });
        if (req.session.userId === userId)
            req.session.userId = null
        return res.status(200).json(block);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error blocking user" });
    }
};

const unBlockUser = async (req, res) => {
    try {
        const userId = req.params.id
        const unBlock = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true })
        if (req.session.userId === userId)
            req.session.userId = userId
        return res.status(200).json(unBlock)
    } catch (error) {
        console.error(error)
    }
}

const orderPage = async (req, res) => {
    try {
        const orders = await Order.find().populate('userId').populate('cartItems.productId').sort({ createdAt: -1 })
        res.render('orderManagement', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
}


const orderDetailsPage = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('userId').populate('cartItems.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('orderDetails', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Internal Server Error');
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const cartItem = order.cartItems.find(item => item.productId.toString() === productId);

        if (!cartItem) {
            return res.status(404).send('Product not found in the order');
        }

        cartItem.status = status;
        await order.save();

        res.redirect(`/admin/orders/${orderId}`);
    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(500).send('Internal Server Error');
    }
}



module.exports = {
    loadAdmin,
    adminLogin,
    userManagement,
    blockUser,
    unBlockUser,
    adminLogout,
    orderPage,
    orderDetailsPage,
    updateOrderStatus
}