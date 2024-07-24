const Product = require('../../models/productModel')
const Category = require('../../models/categoryModel')
const Offer = require('../../models/offerModel')

const offerPage = async (req, res) => {
    try {
        const offers = await Offer.find();

        const categories = await Category.find();

        const products = await Product.find();

        const categoryMap = categories.reduce((map, category) => {
            map[category._id] = category.name;
            return map;
        }, {});

        const productMap = products.reduce((map, product) => {
            map[product._id] = product.name;
            return map;
        }, {});

        res.render('offerList', { offers, categoryMap, productMap });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal server error');
    }
};

const addOfferPage = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        const products = await Product.find({ isActive: true });
        res.render('addOffer', { categories, products });
    } catch (error) {
        console.error("Error:", error);
    }
};

const createOffer = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        const products = await Product.find({ isActive: true });
        const { name, discountOn, discountType, discountValue, expireOn, discountedProduct, discountedCategory } = req.body;
        if (discountOn === 'category') {
            let categoryOfferExists = await Offer.findOne({ discountedCategory });
            if (categoryOfferExists) {
                return res.render('addOffer', { categories, products, alert: 'Category offer already exists' });
            }
            const newOffer = new Offer({
                name,
                discountOn,
                discountType,
                discountValue,
                expireOn,
                discountedCategory,
            });
            await newOffer.save();
            const offerCategoryProducts = await Product.find({ category: discountedCategory });
            if (discountType === "fixedAmount") {
                const offerAmount = discountValue;
                offerCategoryProducts.forEach(async (item) => {
                    item.offerPrice = item.originalPrice - offerAmount;
                    await item.save();
                });
            } else {
                offerCategoryProducts.forEach(async (item) => {
                    item.offerPrice = item.originalPrice - Math.floor((item.originalPrice * discountValue)) / 100;
                    await item.save();
                });
            }
        } else {
            let productOfferExists = await Offer.findOne({ discountedProduct });
            if (productOfferExists) {
                return res.render('addOffer', { categories, products, alert: 'Product offer already exists' });
            }
            const newOffer = new Offer({
                name,
                discountOn,
                discountType,
                discountValue,
                expireOn,
                discountedProduct,
            });
            await newOffer.save();
            const offerProduct = await Product.findOne({ _id: discountedProduct });
            if (discountType === "fixedAmount") {
                const offerAmount = discountValue;
                offerProduct.offerPrice = offerProduct.originalPrice - offerAmount;
                await offerProduct.save();
            } else {
                const offerAmount = Math.floor((offerProduct.originalPrice * discountValue)) / 100;
                offerProduct.offerPrice = offerProduct.originalPrice - offerAmount;
                await offerProduct.save();
            }
        }
        res.redirect('/admin/offerPage');
    } catch (error) {
        console.error("Error:", error);
    }
};

const offerToggle = async (req, res) => {
    try {
        const offerId = req.query.offerId;
        console.log(offerId);
        const offer = await Offer.findById(offerId);
        if (offer.discountOn === 'category') {
            const offerCategoryProducts = await Product.find({ category: offer.discountedCategory });
            if (offer.discountType === "fixedAmount") {
                const offerAmount = offer.discountValue;
                offerCategoryProducts.forEach(async (item) => {
                    item.offerPrice = offer.isActive ? item.originalPrice + 0 : item.originalPrice - offerAmount;
                    await item.save();
                });
            } else {
                offerCategoryProducts.forEach(async (item) => {
                    const offerAmount = Math.floor((item.originalPrice * offer.discountValue)) / 100;
                    item.offerPrice = offer.isActive ? item.originalPrice + 0 : item.originalPrice - offerAmount;
                    await item.save();
                });
            }
        } else {
            const offerProduct = await Product.findOne({ _id: offer.discountedProduct });
            if (offer.discountType === "fixedAmount") {
                const offerAmount = offer.discountValue;
                offerProduct.offerPrice = offer.isActive ? offerProduct.originalPrice + 0 : offerProduct.originalPrice - offerAmount;
                await offerProduct.save();
            } else {
                const offerAmount = Math.floor((offerProduct.originalPrice * offer.discountValue)) / 100;
                offerProduct.offerPrice = offer.isActive ? offerProduct.originalPrice + 0 : offerProduct.originalPrice - offerAmount;
                await offerProduct.save();
            }
        }
        offer.isActive = !offer.isActive;
        await offer.save();
        res.redirect('/admin/offerPage');
    } catch (error) {
        console.error("Error:", error);
    }
};

module.exports = {
    offerPage,
    addOfferPage,
    createOffer,
    offerToggle
};