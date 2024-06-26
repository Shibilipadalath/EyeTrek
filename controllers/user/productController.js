const Product = require('../../models/productModel')
const User = require('../../models/userModel')

const productDetails = async (req, res) => {
    try {
        const productId = req.query.productId
        const product = await Product.findById(productId)

        console.log(product)
        res.render('productDetails', { product })
    } catch (error) {
        console.error(error);
    }
}

const shoppingPage = async (req, res) => {
    try {
        const product = await Product.find({})
        const user = await User.findOne({ _id: req.session.userId })
        res.render('shop', { user, product })
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    productDetails,
    shoppingPage
}