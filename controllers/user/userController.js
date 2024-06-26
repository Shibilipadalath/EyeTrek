const User = require('../../models/userModel')
const Product = require('../../models/productModel')
const Category = require('../../models/categoryModel')
const otpGenerator = require('otp-generator')
const mailController = require("../../util/mailSender")
const bcrypt = require('bcrypt')


const homePage = async (req, res) => {
    try {

        const activedProducts = await Product.find({isActive:true}).limit(6).populate('category')
        const product = activedProducts.filter((item)=> item.category.isActive === true)
        const userExist = await User.findOne({ _id: req.session.userId })
        res.render('home', { product, userExist })
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
            console.log('user', req.session.userId)
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
            let otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            })
            console.log(otp)
            req.session.otp = otp
            
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
        const otpFromUser = req.body.otp
        const sentOtp = req.session.otp
        const userDetails = req.session.userDetails
        if (otpFromUser === sentOtp) {
            const sPassword = await securedPassword(userDetails.password)
            const user = new User({
                userName: userDetails.name,
                email: userDetails.email,
                mobile: userDetails.mobile,
                password: sPassword
            })
            await user.save()
            res.render('login', { error: '' })
        } else {
            res.render('otpPage', { error: 'invalid OTP' })
        }
    } catch (error) {
        console.error(error);
    }
}









module.exports = {
    homePage,
    loginPage,
    userLogin,
    userLogout,
    signupPage,
    userSignUp,
    otpVerification,
}