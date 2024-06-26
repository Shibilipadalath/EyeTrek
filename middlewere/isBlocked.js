const User = require('../models/userModel');

const isBlocked = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        console.log('userid', userId);

        if (!userId) {
            return res.redirect('/')
        }
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.redirect('/')
        }

        if (user.isBlocked) {
            req.session.userId = null;
            // return res.redirect('/userLogout');
            return res.redirect('/')
        } else {
            next();
        }
    } catch (error) {
        console.error('Error in isBlocked middleware:', error);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    isBlocked
}
