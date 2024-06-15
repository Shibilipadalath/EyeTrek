const User=require('../models/userModel')

const authMiddleware = async (req, res, next) => {
    if (req.session.userId) {
        const user = await User.findById(req.session.userId);
        if (user && user.isBlocked) {
            req.session.destroy(err => {
                if (err) {
                    console.error('Error destroying session for blocked user:', err);
                    return res.status(500).send('Internal Server Error');
                }
                res.redirect('/login');
            });
        } else {
            next();
        }
    } else {
        res.redirect('/login');
    }
};


module.exports=={
    authMiddleware
}