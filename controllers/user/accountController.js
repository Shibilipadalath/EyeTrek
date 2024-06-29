const User = require('../../models/userModel')
const Address = require('../../models/addressModel')
const Order = require('../../models/orderModel')
const bcrypt = require('bcrypt');
// const { trusted } = require('mongoose');

const myAccount = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const addressData = await Address.findOne({ userId: user._id });
        const addresses = addressData ? addressData.address : [];

        // find orders
        const orderDetails = await Order.find({ userId: user._id });
        console.log(orderDetails); // For debugging

        return res.render('myAccount', { user, addresses, orderDetails });
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

            // Find the user
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

        const user = await User.findOne({ _id: req.session.userId }); // Assuming `req.session.userId` contains the authenticated user ID
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


        // Fetch the user from the database
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the current password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(npassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Respond with success message
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



module.exports = {
    myAccount,
    addAddress,
    editAddress,
    deleteAddress,
    updateDetails,
    updatePassword,
    checkPassword,
    viewOrder,
    cancelOrder
}