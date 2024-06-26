const User = require('../models/userModel');

const isBlocked = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        console.log('userid', userId);

        // Check if userId exists in session
        if (!userId) {
            return res.status(401).send('User not logged in');
        }

        const user = await User.findOne({ _id: userId });
        // console.log('user', user);

        // Check if user exists
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.isBlocked) {
            req.session.userId = null; // Clear the session userId before redirecting
            return res.redirect('/userLogout');
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
