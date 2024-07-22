const Product = require('../../models/productModel')
const User = require('../../models/userModel')
const Category = require('../../models/categoryModel')

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
        const categoryId = req.query.category || null; // Get category from query params
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

        let filter = { isActive: true };
        if (categoryId) {
            filter.category = categoryId;
        }

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / productsPerPage);
        const activedProducts = await Product.find(filter)
            .populate('category')
            .sort(sort)
            .skip((page - 1) * productsPerPage)
            .limit(productsPerPage);

        const product = activedProducts.filter((item) => item.category.isActive === true);
        const user = await User.findOne({ _id: req.session.userId });

        // Fetch all categories to display in the category filter
        const categories = await Category.find({ isActive: true });

        res.render('shop', { user, product, sort: sortParam, currentPage: page, totalPages, categories, selectedCategory: categoryId });
    } catch (error) {
        console.error(error);
    }
};





module.exports = {
    productDetails,
    shoppingPage
}