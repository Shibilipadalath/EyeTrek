const User = require('../../models/userModel')

const loadAdmin = async (req, res) => {
    res.render('adminLogin', { error: '' })
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (process.env.adminEmail == email && process.env.adminPassword == password) {
            req.session.adminId = email
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
                return res.status(500).send('Internal Server Error'); // Handle the error as appropriate
            }
            return res.redirect('/admin');
        });
    } catch (error) {
        console.error('Unexpected error during user logout:', error);
        return res.status(500).send('Internal Server Error'); // Handle the error as appropriate
    }
}

const adminHome = async (req, res) => {
    try {
        res.render('adminHome')
    } catch (error) {
        console.log(error);
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
        if(req.session.userId === userId)
            req.session.userId = null
        console.log("blocked", block);
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
        if(req.session.userId === userId)
            req.session.userId = userId
        console.log("unBlocked", unBlock);
        return res.status(200).json(unBlock)


    } catch (error) {
        console.error(error)
    }
}

const orderPage = async (req, res) => {
    try {
        return res.render('orderManagement')
    } catch (error) {
        console.error(error);
    }
}



module.exports = {
    loadAdmin,
    adminLogin,
    adminHome,
    userManagement,
    userEditPage,
    blockUser,
    unBlockUser,
    adminLogout,
    orderPage
}