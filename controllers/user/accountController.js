const User = require('../../models/userModel')
const Address = require('../../models/addressModel')
const Order = require('../../models/orderModel')
const Wallet = require('../../models/walletModel')
const Product = require('../../models/productModel')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const PDFDocument= require('pdfkit')


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

        const ordersPerPage = 5;
        const orderPage = parseInt(req.query.orderPage) || 1;

        const totalOrders = await Order.countDocuments({ userId: user._id });
        const totalOrderPages = Math.ceil(totalOrders / ordersPerPage);

        const orderDetails = await Order.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .skip((orderPage - 1) * ordersPerPage)
            .limit(ordersPerPage);

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

            const reversedHistory = Userwallet.history.slice().reverse();
            paginatedHistory = reversedHistory.slice(startIndex, endIndex);
        }
        

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

        const user = await User.findOne({ _id: req.session.userId })
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

        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

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
        const { orderId } = req.params;
        const { productId } = req.body; 

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const item = order.cartItems.find(item => item.productId.toString() === productId);

        if (!item) {
            return res.status(404).send('Product not found in order');
        }

        if (['ORDER PLACED', 'Pending', 'Processing', 'Shipped'].includes(item.status)) {
            item.status = 'Cancelled';
            await order.save();

            const product = await Product.findById(productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }

             if (order.paymentMethod === 'Wallet' || order.paymentMethod === 'RazorPay') {
                const userWallet = await Wallet.findOne({ userId: order.userId });
                if (!userWallet) {
                    return res.status(404).send('Wallet not found');
                }

                const refundAmount = item.price * item.quantity;

                userWallet.balance += refundAmount;

                userWallet.history.push({
                    amount: refundAmount,
                    type: 'credit',
                    createdAt: new Date(),
                });

                await userWallet.save();
            }

            return res.redirect(`/order/${orderId}`);
        } else {
            return res.status(400).send('Product cannot be cancelled');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
};




const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { productId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const item = order.cartItems.find(item => item.productId.toString() === productId);

        if (!item) {
            return res.status(404).send('Product not found in order');
        }

        if (item.status === 'Delivered') {
            item.status = 'Returned';
            await order.save();

            const product = await Product.findById(productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }

            if (order.paymentMethod === 'Wallet' || order.paymentMethod === 'Razorpay') {
                const userWallet = await Wallet.findOne({ userId: order.userId });
                if (!userWallet) {
                    return res.status(404).send('Wallet not found');
                }

                const refundAmount = item.price * item.quantity;

                userWallet.balance += refundAmount;

                userWallet.history.push({
                    amount: refundAmount,
                    type: 'credit',
                    createdAt: new Date(),
                });

                await userWallet.save();
            }

            return res.redirect(`/order/${orderId}`);
        } else {
            return res.status(400).send('Product cannot be returned');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
};


const downloadInvoice=async(req,res)=>{
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('cartItems.productId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument();
        const fileName = `Invoice_${order._id}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        doc.fontSize(18).text(`Invoice for Order #${order._id}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Status: ${order.status}`);
        doc.text(`Total Price: ${order.totalPrice.toFixed(2)}`);
        doc.moveDown();

        doc.text('Items:', { underline: true });
        order.cartItems.forEach(item => {
            doc.text(`- ${item.productId.name} (Qty: ${item.quantity}) - ${item.price.toFixed(2)}`);
        });
        doc.moveDown();

        doc.text('Shipping Address:', { underline: true });
        const address = order.address[0];
        doc.text(`Name: ${address.name}`);
        doc.text(`Mobile: ${address.mobile}`);
        doc.text(`House: ${address.houseName}`);
        doc.text(`Street: ${address.street}`);
        doc.text(`City: ${address.city}`);
        doc.text(`State: ${address.state}`);
        doc.text(`Pin Code: ${address.pinCode}`);

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const pendingPayment=async(req,res)=>{
    const { orderId } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: order.totalPrice * 100,
            currency: 'INR',
            receipt: orderId
        });

        return res.json({
            success: true,
            key_id: process.env.RAZORPAY_ID_KEY,
            amount: order.totalPrice * 100,
            currency: 'INR',
            order_id: razorpayOrder.id,
            name: 'Customer Name',
            email: 'customer@example.com',
            contact: '1234567890'
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const finalizePendingPayment=async(req,res)=>{
    try {
        const { orderId, paymentId } = req.body;

        if (!orderId || !paymentId) {
            return res.status(400).json({ success: false, message: 'Order ID and Payment ID are required.' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        order.paymentStatus = 'success';
        await order.save();

        res.json({ success: true, message: 'Order finalized successfully.' });
    } catch (error) {
        console.error('Error finalizing order:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}


const addMoney = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.userId;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: '1'
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

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        let wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            wallet = new Wallet({
                userId: userId,
                balance: 0,
                history: []
            });
            await wallet.save();
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


const about=async(req,res)=>{
    try {
        const user = await User.findOne({ _id: req.session.userId });
        return res.render('aboutPage',{user})
    } catch (error) {
        console.error(error);
        
    }
}


const contact=async(req,res)=>{
    try {
        const user = await User.findOne({ _id: req.session.userId });
        return res.render('contactPage',{user})
    } catch (error) {
        console.error(error);
        
    }
}



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
    downloadInvoice,
    pendingPayment,
    finalizePendingPayment,
    addMoney,
    paymentSuccess,
    about,
    contact
}