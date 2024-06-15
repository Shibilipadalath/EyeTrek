const User=require('../../models/userModel')
const Address=require('../../models/addressModel')

const myAccount = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const addressData = await Address.findOne({ userId: user._id });
        const addresses = addressData ? addressData.address : [];

        console.log("user", user);
        console.log("addresses", addresses);
        return res.render('myAccount', { user, addresses });
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

            res.redirect('/myAccount');
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

        // Find the user by userId and addressId
        const addressDoc = await Address.findOne({ userId: userId, "address._id": addressId });
        if (!addressDoc) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Find the specific address in the array
        const address = addressDoc.address.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Update the address fields
        address.name = name;
        address.mobile = mobile;
        address.houseName = houseName;
        address.street = street;
        address.city = city;
        address.state = state;
        address.pinCode = pinCode;


        await addressDoc.save();

        // Respond with the updated address
        res.json({ message: 'Address updated successfully', address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteAddress=async(req,res)=>{
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


module.exports={
    myAccount,
    addAddress,
    editAddress,
    deleteAddress
}