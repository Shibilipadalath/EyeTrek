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
        const productsPerPage = 6;
        const page = parseInt(req.query.page) || 1;
        const sortParam = req.query.sort || 'featured';
        let sort = {};

        switch (sortParam) {
            case 'priceLowHigh':
                sort = { offerPrice: 1 };
                break;
            case 'priceHighLow':
                sort = { offerPrice: -1 };
                break;
            case 'nameAZ':
                sort = { name: 1 };
                break;
            case 'nameZA':
                sort = { name: -1 };
                break;
            case 'newArrivals':
                sort = { createdAt: -1 };
                break;
            default:
                sort = {};
        }

        console.log('sortttttt',sortParam);

        const totalProducts = await Product.countDocuments({ isActive: true });
        const totalPages = Math.ceil(totalProducts / productsPerPage);
        const activedProducts = await Product.find({ isActive: true })
            .populate('category')
            .sort(sort)
            .skip((page - 1) * productsPerPage)
            .limit(productsPerPage);
        const product = activedProducts.filter((item) => item.category.isActive === true);
        const user = await User.findOne({ _id: req.session.userId });

        res.render('shop', { user, product, sort: sortParam, currentPage: page, totalPages });
    } catch (error) {
        console.error(error);
    }
};




module.exports = {
    productDetails,
    shoppingPage
}