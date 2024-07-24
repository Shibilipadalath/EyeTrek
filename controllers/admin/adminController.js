const User = require('../../models/userModel')
const Order = require('../../models/orderModel')

const loadAdmin = async (req, res) => {
    res.render('adminLogin', { error: '' })
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (process.env.adminEmail == email && process.env.adminPassword == password) {
            req.session.adminId = emailF
            res.redirect('/admin/adminHome')
            console.log("PAGE rendered`")
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
                console.error('Error occurred during user logout:', err);
                return res.status(500).send('Internal Server Error');
            }
            return res.redirect('/admin');
        });
    } catch (error) {
        console.error('Unexpected error during user logout:', error);
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

const userEditPage = async (req, res) => {
    try {
        const userId = req.query.id
        const userData = await User.findOne({ _id: userId })
        console.log(userId, userData)
    } catch (error) {
        console.error(error)
    }

}
const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log("block", userId);
        const block = await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });
        if (req.session.userId === userId)
            req.session.userId = null
        console.log("blockeddddd", block);
        return res.status(200).json(block);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error blocking user" });
    }
};

const unBlockUser = async (req, res) => {
    try {
        const userId = req.params.id
        console.log("unblock", userId);
        const unBlock = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true })
        if (req.session.userId === userId)
            req.session.userId = userId
        console.log("unBlocked", unBlock);
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
        const orderId = req.params.id;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.redirect(`/admin/orders/${orderId}`);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
}



module.exports = {
    loadAdmin,
    adminLogin,
    userManagement,
    userEditPage,
    blockUser,
    unBlockUser,
    adminLogout,
    orderPage,
    orderDetailsPage,
    updateOrderStatus
}