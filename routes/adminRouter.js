const express = require("express")
const adminController = require("../controllers/admin/adminController")
const productController = require('../controllers/admin/productController')
const categoryController = require("../controllers/admin/categoryController")
const adminAuth = require('../middlewere/adminAuth')

const MulterImg = require('../config/multer')

const adminRouter = express()
adminRouter.set('views', 'views/admin')

//admin

adminRouter.get('/', adminAuth.isLogout, adminController.loadAdmin)
adminRouter.post('/', adminAuth.isLogout, adminController.adminLogin);
adminRouter.get('/adminHome', adminAuth.isLogin, adminController.adminHome);
adminRouter.get('/userManagement', adminAuth.isLogin, adminController.userManagement)
adminRouter.get('/userEditPage', adminAuth.isLogin, adminController.userEditPage)
adminRouter.put('/blockUser/:id', adminAuth.isLogin, adminController.blockUser)
adminRouter.put('/UnBlockUser/:id', adminAuth.isLogin, adminController.unBlockUser)
adminRouter.get('/adminLogout', adminAuth.isLogin, adminController.adminLogout)

//product

adminRouter.get('/productList', adminAuth.isLogin, productController.productManagement)
adminRouter.get('/addProductPage', adminAuth.isLogin, productController.addProductPage)
adminRouter.post('/addProduct', adminAuth.isLogin, MulterImg.upload.array('images', 5), productController.addProduct)
adminRouter.get('/editProduct', adminAuth.isLogin, productController.editProductPage)
adminRouter.post('/removeImage', adminAuth.isLogin, productController.removeImage)
adminRouter.post('/updateEditProduct', adminAuth.isLogin, MulterImg.upload.array('images', 5), productController.updateEditProduct)
adminRouter.post('/toggleBlockProduct', adminAuth.isLogin, productController.ToggleBlockProduct)




//category

adminRouter.get('/categoryPage', adminAuth.isLogin, categoryController.categoryPage)
adminRouter.post('/addCategory', adminAuth.isLogin, categoryController.addCategory)
adminRouter.get('/categoryEdit', adminAuth.isLogin, categoryController.categoryEditing)
adminRouter.post('/categoryUpdate', adminAuth.isLogin, categoryController.categoryUpdate)
adminRouter.post('/ToggleBlockCategories/:id', adminAuth.isLogin, categoryController.ToggleBlockCategories)

//order

adminRouter.get('/orderPage', adminAuth.isLogin, adminController.orderPage)


module.exports = adminRouter