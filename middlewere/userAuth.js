const isLogin = (req, res, next) => {
    try {
        if (req.session.userId) {
            next();
        } else {
            return res.redirect('/login');
        }
    } catch (error) {
        console.error(error)
    }
};

const isLogout = (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect('/');
        } else {
            next();
        }
    } catch (error) {
        console.error('Error in isLogout middleware:', error);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    isLogin,
    isLogout
};
