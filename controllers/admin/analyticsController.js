const Order=require('../../models/orderModel')

const popularProductPage = async (req, res) => {
    try {
        const bestSellingProducts = await Order.aggregate([
            { $unwind: '$cartItems' },
            {
                $group: {
                    _id: '$cartItems.productId',
                    totalQuantity: { $sum: '$cartItems.quantity' },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: '$product._id',
                    name: '$product.name',
                    description: '$product.description',
                    brand: '$product.brand',
                    stock: '$product.stock',
                    originalPrice: '$product.originalPrice',
                    offerPrice: '$product.offerPrice',
                    category: '$product.category',
                    image: '$product.image',
                    isActive: '$product.isActive',
                    totalQuantity: 1,
                },
            },
        ]);

        res.render('popularProduct', { products: bestSellingProducts });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

const bestCategoryPage = async (req, res) => {
    try {
        const bestSellingCategories = await Order.aggregate([
            { $unwind: '$cartItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'cartItems.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    totalQuantity: { $sum: '$cartItems.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    _id: '$category._id',
                    name: '$category.name',
                    totalQuantity: 1
                }
            }
        ]);

        res.render('bestCategory', { categories: bestSellingCategories });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


const topBrandPage = async (req, res) => {
    try {
        const topBrands = await Order.aggregate([
            { $unwind: '$cartItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'cartItems.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.brand',
                    totalQuantity: { $sum: '$cartItems.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    brand: '$_id',
                    totalQuantity: 1
                }
            }
        ]);

        res.render('topBrand', { brands: topBrands });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

module.exports={
    popularProductPage,
    bestCategoryPage,
    topBrandPage
}