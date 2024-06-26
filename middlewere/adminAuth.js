const isLogin = (req, res, next) => {
    try {
        if (req.session.adminId) {
            next()
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error('Error in isLogin middleware:', error);
        res.status(500).send('Internal Server Error');
    }
};

const isLogout = (req, res, next) => {
    try {
        if (req.session.adminId) {
            return res.redirect('/admin/adminHome')
        } else {
            next()
        }
    } catch (error) {
        console.error('Error in isLogout middleware:', error);
        res.status(500).send('Internal Server Error');
    }
}


module.exports = {
    isLogin,
    isLogout
};  