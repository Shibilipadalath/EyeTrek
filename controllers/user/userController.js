const User = require('../../models/userModel')
const Product = require('../../models/productModel')
const Cart = require('../../models/cartModel')
const WishList = require('../../models/wishListModel')
const otpGenerator = require('otp-generator')
const mailController = require("../../util/mailSender")
const bcrypt = require('bcrypt')


const homePage = async (req, res) => {
    try {
        const userId = req.session.userId
        
        const activedProducts = await Product.find({ isActive: true }).limit(6).sort({createdAt:-1}).populate('category')
        const product = activedProducts.filter((item) => item.category.isActive === true)
        const userExist = await User.findOne({ _id: userId })

        const cart = await Cart.findOne({ userId })
        const cartQuantity = cart?.cartItems.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

        const wishList = await WishList.findOne({ userId })     
        const wishListQuantity = wishList?.products.length ?? 0

        res.render('home', { product, userExist, cartQuantity, wishListQuantity })
    } catch (error) {
        console.error(error);
    }
}

const loginPage = async (req, res) => {
    try {
        res.render('login', { error: '' })
    } catch (error) {
        console.error(error);
    }
}

const userLogin = async (req, res) => {
    try {
        const { email, loginPassword } = req.body
        const userExist = await User.findOne({ email: email })

        if (userExist) {
            if (userExist.isBlocked == false) {
                const match = await bcrypt.compare(loginPassword, userExist.password)
                if (match) {
                    req.session.userId = userExist._id
                    res.redirect('/')
                } else {
                    res.render('login', { error: "Invalid password" })
                }
            } else {
                res.render('login', { error: "User is Blocked" })
            }
        } else {
            res.render('login', { error: "Email not found" })
        }

    } catch (error) {
        console.error(error);
    }
}

const userLogout = (req, res) => {
    try {
        if (req.session.userId) {
            delete req.session.userId;

        }
        res.redirect('/');
    } catch (error) {
        res.redirect('/error');
    }

};


const signupPage = async (req, res) => {
    try {
        res.render('createAccount', { signUpAlert: '' })
    } catch (error) {
        console.error(error)
    }
}

const securedPassword = async (passaword) => {
    try {
        const passwordHash = await bcrypt.hash(passaword, 10)
        return passwordHash
    } catch (error) {
        console.error(error.message)
    }
}

const userSignUp = async (req, res) => {
    try {
        req.session.userDetails = req.body
        const email = req.session.userDetails.email
        const userChecker = await User.findOne({ email: email })
        if (userChecker) {
            return res.render('createAccount', { signUpAlert: 'Email already exist' })
        } else {
            let otp = otpGenerator.generate(4, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            })
            req.session.otp = otp

            console.log(req.session.otp);

            let mailSender = mailController.mailSender
            await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your OTP: <b>${otp}</b></h5>`);
            res.render('otpPage', { error: '' })

        }

    } catch (error) {
        console.error(error)
    }
}

const otpVerification = async (req, res) => {
    try {
        const otpFromUser = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4
        const sentOtp = req.session.otp
        const userDetails = req.session.userDetails;

        if (otpFromUser === sentOtp) {
            const sPassword = await securedPassword(userDetails.password)
            const user = new User({
                userName: userDetails.name,
                email: userDetails.email,
                mobile: userDetails.mobile,
                password: sPassword
            });

            await user.save()
            res.render('login', { error: '' })
        } else {
            res.render('otpPage', { error: 'Invalid OTP' })
        }
    } catch (error) {
        console.error(error);
        res.render('otpPage', { error: 'An error occurred. Please try again.' })
    }
}

const resendOtp = async (req, res) => {
    try {
        const email = req.session.userDetails.email;
        let otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        req.session.otp = otp;
        console.log(req.session.otp);

        let mailSender = mailController.mailSender;
        await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your OTP: <b>${otp}</b></h5>`);
        res.render('otpPage', { error: '', resendMessage: 'A new OTP has been sent to your email.' })

    } catch (error) {
        console.error(error);
        res.render('otpPage', { error: 'Error sending OTP. Please try again.', resendMessage: '' })
    }
};


const forgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword', { error: '' })
    } catch (error) {
        console.error(error);
    }
}

const forgotPasswordVerify = async (req, res) => {
    const email = req.body.email;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('forgotPassword', { error: 'The email does not exist' });
        }

        let otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        req.session.forgotOtp = otp;
        req.session.email = email;

        let mailSender = mailController.mailSender;
        await mailSender(email, 'Forgot Password Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your OTP: <b>${otp}</b></h5>`);
        res.render('forgotOtpPage', { error: '' });
    } catch (error) {
        console.error(error);
    }
};


const forgotOtpVerify = async (req, res) => {
    const { digit1, digit2, digit3, digit4 } = req.body;
    const otp = digit1 + digit2 + digit3 + digit4;

    if (otp === req.session.forgotOtp) {
        res.render('newPassword', { error: '' });
    } else {
        res.render('forgotOtpPage', { error: 'Invalid OTP' });
    }
};

const resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.render('newPassword', { error: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const email = req.session.email;
        await User.findOneAndUpdate({ email }, { password: hashedPassword });
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.render('newPassword', { error: 'Something went wrong, please try again' });
    }
};

const searchProducts = async (req, res) => {
    try {
        const query = req.query.query;
        if (query) {
            const regex = new RegExp(query, 'i');
            const products = await Product.find({ name: { $regex: regex } }, 'name image');
            res.json(products);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};



module.exports = {
    homePage,
    loginPage,
    userLogin,
    userLogout,
    signupPage,
    userSignUp,
    otpVerification,
    resendOtp,
    forgotPassword,
    forgotPasswordVerify,
    forgotOtpVerify,
    resetPassword,
    searchProducts
}