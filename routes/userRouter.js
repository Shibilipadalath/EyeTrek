const express = require("express")
const userController = require("../controllers/user/userController")
const productDetailsController = require("../controllers/user/productController")
const cartController = require('../controllers/user/cartController')
const accountController = require('../controllers/user/accountController')
const userAuth = require('../middlewere/userAuth')
const userBlock = require('../middlewere/isBlocked')
const orderController = require("../controllers/user/orderController")
const googleAuthController = require('../controllers/user/googleAuthController')


const userRoute = express()

userRoute.set('views', 'views/user')

//googleAuth

userRoute.get('/auth/google', googleAuthController.googleAuth);
userRoute.get('/auth/google/callback', googleAuthController.googleAuthCallback);
userRoute.get('/auth/google/failure', googleAuthController.failure);

//user

userRoute.get('/', userController.homePage)
userRoute.get('/login', userAuth.isLogout, userController.loginPage)
userRoute.post('/login', userAuth.isLogout, userController.userLogin)
userRoute.get('/userLogout', userController.userLogout)
userRoute.get('/signUp', userAuth.isLogout, userController.signupPage)
userRoute.post('/signUp', userAuth.isLogout, userController.userSignUp)
userRoute.post('/verify-otp', userAuth.isLogout, userController.otpVerification)
userRoute.get('/resendOtp', userAuth.isLogout, userController.resendOtp)
userRoute.get('/forgotPassword', userAuth.isLogout, userController.forgotPassword)
userRoute.post('/forgotPassword', userAuth.isLogout, userController.forgotPasswordVerify)
userRoute.post('/forgotOtpVerify', userAuth.isLogout, userController.forgotOtpVerify)
userRoute.post('/resetPassword', userAuth.isLogout, userController.resetPassword);



//product

userRoute.get('/productDetails', productDetailsController.productDetails)
userRoute.get('/shop', productDetailsController.shoppingPage)

//cart

userRoute.get('/cart', userBlock.isBlocked, userAuth.isLogin, cartController.cartPage)
userRoute.get('/addToCart', userBlock.isBlocked, userAuth.isLogin, cartController.addToCart)
userRoute.delete('/deleteFromCart', userBlock.isBlocked, userAuth.isLogin, cartController.removeFromCart)
userRoute.post('/updateCartQuantity', userBlock.isBlocked, userAuth.isLogin, cartController.updateCartQuantity)

//chenckOut

userRoute.get('/checkOut', userBlock.isBlocked, userAuth.isLogin, cartController.checkOutPage)
userRoute.get('/thankYou', userBlock.isBlocked, userAuth.isLogin, cartController.thankYou)

//account

userRoute.get('/myAccount', userBlock.isBlocked, userAuth.isLogin, accountController.myAccount)
userRoute.post('/addAddress', userBlock.isBlocked, userAuth.isLogin, accountController.addAddress)
userRoute.post('/editAddress', userBlock.isBlocked, userAuth.isLogin, accountController.editAddress)
userRoute.delete('/deleteAddress/:addressId', userBlock.isBlocked, userAuth.isLogin, accountController.deleteAddress)
userRoute.post('/updateDetails', userBlock.isBlocked, userAuth.isLogin, accountController.updateDetails);
userRoute.post('/updatePassword', userBlock.isBlocked, userAuth.isLogin, accountController.updatePassword);
userRoute.post('/checkPassword', userBlock.isBlocked, userAuth.isLogin, accountController.checkPassword);
userRoute.get('/order/:id', userBlock.isBlocked, userAuth.isLogin, accountController.viewOrder);
userRoute.post('/orders/:orderId/cancel', userBlock.isBlocked, userAuth.isLogin, accountController.cancelOrder);


//order
userRoute.post('/placeOrder', userBlock.isBlocked, userAuth.isLogin, orderController.placeOrder)


module.exports = userRoute
