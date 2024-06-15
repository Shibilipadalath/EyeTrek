const express=require("express")
const userController=require("../controllers/user/userController")
const productDetailsController=require("../controllers/user/productController")
const cartController=require('../controllers/user/cartController')
const accountController=require('../controllers/user/accountController')
const userAuth=require('../middlewere/userAuth')


const userRoute=express()

userRoute.set('views','views/user')
userRoute.set("view engine","ejs")

userRoute.get('/',userController.homePage)
userRoute.get('/login',userAuth.isLogout,userController.loginPage)
userRoute.post('/login',userAuth.isLogout,userController.userLogin)
userRoute.get('/userLogout',userController.userLogout)
userRoute.get('/signUp',userController.signupPage)
userRoute.post('/signUp',userController.userSignUp)
userRoute.post('/verify-otp',userController.otpVerification)


//product

userRoute.get('/productDetails',productDetailsController.productDetails)
userRoute.get('/shop',productDetailsController.shoppingPage)

//cart

userRoute.get('/cart',userAuth.isLogin,cartController.cartPage)
userRoute.get('/addToCart',userAuth.isLogin,cartController.addToCart)
userRoute.delete('/deleteFromCart',userAuth.isLogin,cartController.removeFromCart)
userRoute.post('/updateCartQuantity',userAuth.isLogin,cartController.updateCartQuantity)
userRoute.get('/checkOut',userAuth.isLogin,cartController.checkOutPage)

//account


userRoute.get('/myAccount',userAuth.isLogin,accountController.myAccount)
userRoute.post('/addAddress',userAuth.isLogin,accountController.addAddress)
userRoute.post('/editAddress',userAuth.isLogin,accountController.editAddress)
userRoute.delete('/deleteAddress/:addressId',userAuth.isLogin,accountController.deleteAddress)



module.exports=userRoute
