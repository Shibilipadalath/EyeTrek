const User = require('../../models/userModel')
const Address = require('../../models/addressModel')
const Order = require('../../models/orderModel')
const Wallet = require('../../models/walletModel')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Razorpay = require('razorpay');


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});


const myAccount = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const addressData = await Address.findOne({ userId: user._id });
        const addresses = addressData ? addressData.address : [];

        // Pagination for orders
        const ordersPerPage = 5;
        const orderPage = parseInt(req.query.orderPage) || 1;

        const totalOrders = await Order.countDocuments({ userId: user._id });
        const totalOrderPages = Math.ceil(totalOrders / ordersPerPage);

        const orderDetails = await Order.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .skip((orderPage - 1) * ordersPerPage)
            .limit(ordersPerPage);
        console.log(orderDetails);

        // Pagination for wallet
        const transactionsPerPage = 5;
        const transactionPage = parseInt(req.query.transactionPage) || 1;

        const Userwallet = await Wallet.findOne({ userId: user._id });
        let paginatedHistory = [];
        let totalTransactionPages = 1;

        if (Userwallet) {
            const totalTransactions = Userwallet.history.length;
            totalTransactionPages = Math.ceil(totalTransactions / transactionsPerPage);
            const startIndex = (transactionPage - 1) * transactionsPerPage;
            const endIndex = Math.min(startIndex + transactionsPerPage, totalTransactions);
            paginatedHistory = Userwallet.history.slice(startIndex, endIndex);
        }

        console.log(Userwallet);
        return res.render('myAccount', {
            user,
            addresses,
            orderDetails,
            totalOrderPages,
            orderPage,
            Userwallet: Userwallet ? { ...Userwallet.toObject(), history: paginatedHistory } : null,
            transactionPage,
            totalTransactionPages
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};



const addAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, mobile, houseName, street, city, state, pinCode } = req.body;

        if (userId) {
            const newAddress = {
                name,
                mobile,
                houseName,
                street,
                city,
                state,
                pinCode
            };

            await Address.findOneAndUpdate(
                { userId: userId },
                { $push: { address: newAddress } },
                { new: true, upsert: true }
            );

            res.redirect(req.get('referer'));
        } else {
            res.status(400).send('User ID not found in session');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while adding the address');
    }
};

const editAddress = async (req, res) => {
    try {
        const { userId, addressId, name, mobile, houseName, street, city, state, pinCode } = req.body;

        const addressDoc = await Address.findOne({ userId: userId, "address._id": addressId });
        if (!addressDoc) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const address = addressDoc.address.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        address.name = name;
        address.mobile = mobile;
        address.houseName = houseName;
        address.street = street;
        address.city = city;
        address.state = state;
        address.pinCode = pinCode;


        await addressDoc.save();

        res.json({ message: 'Address updated successfully', address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const userId = req.session.userId;


        const addressDoc = await Address.findOneAndUpdate(
            { userId: userId, "address._id": addressId },
            { $pull: { address: { _id: addressId } } },
            { new: true }
        );

        if (addressDoc) {
            res.json({ success: true, message: 'Address deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Address not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete the address' });
    }
}

const updateDetails = async (req, res) => {
    try {
        const { name, mobile } = req.body;
        console.log("req body=======", name, mobile);
        console.log(`Received name: ${name}, mobile: ${mobile}`);

        const user = await User.findOne({ _id: req.session.userId })
        console.log(user);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        user.userName = name;
        user.mobile = mobile;
        await user.save();

        res.redirect('/myAccount')
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}

const updatePassword = async (req, res) => {
    try {
        const { password, npassword, cpassword } = req.body;

        console.log(password, npassword, cpassword);


        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // checking current password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(npassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.redirect('/myAccount')
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
}
const checkPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the current password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Current password is incorrect', success: false });
        }
        return res.status(500).json({ message: 'Current password is correct', success: true });

    } catch (error) {
        console.log(error);
    }
}

const viewOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('cartItems.productId').exec();
        if (!order) {
            return res.status(404).send('Order not found');
        }

        return res.render('viewOrder', { order });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log('orderId................', orderId);
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (['Pending', 'Processing', 'Shipped', 'ORDER PLACED'].includes(order.status)) {
            order.status = 'Cancelled';
            await order.save();
            return res.redirect(`/order/${orderId}`);
        } else {
            return res.status(400).send('Order cannot be cancelled');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
}

const returnOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log('orderId................', orderId);
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.status === 'Delivered') {
            order.status = 'Returned';
            await order.save();
            return res.redirect(`/order/${orderId}`);
        } else {
            return res.status(400).send('Order cannot be returned');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
}

const addMoney = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.userId;
        console.log(amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Create a Razorpay order
        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: '1' // auto capture
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            userId: userId
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const paymentSuccess = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, amount } = req.body;

        console.log(req.body);

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        console.log('Payment validation successful');

        let wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            wallet = new Wallet({
                userId: userId,
                balance: 0,
                history: []
            });
            await wallet.save();
            console.log("Created new wallet:", wallet);
        } else {
            console.log("Found wallet:", wallet);
        }

        wallet.balance += amount / 100;
        wallet.history.push({
            amount: amount / 100,
            type: 'credit',
            description: 'Added money to wallet'
        });

        await wallet.save();

        res.json({ message: 'Payment successful' });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = {
    myAccount,
    addAddress,
    editAddress,
    deleteAddress,
    updateDetails,
    updatePassword,
    checkPassword,
    viewOrder,
    cancelOrder,
    returnOrder,
    addMoney,
    paymentSuccess
}