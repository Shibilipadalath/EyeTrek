const Product = require('../../models/productModel')
const Category = require('../../models/categoryModel')


const productManagement = async (req, res) => {
    try {
        const product = await Product.find({}).sort({createdAt:-1})
        const category = await Category.find({})
        res.render('productsList', { product, category })
    } catch (error) {
        console.error(error)

    }
}
const addProductPage = async (req, res) => {
    try {
        const category = await Category.find({})
        return res.render('addProduct', { category })
    } catch (error) {
        console.error(error)
    }
}

const addProduct = async (req, res) => {
    try {
        const { name, Description, brand, stock, originalPrice, offerPrice, category, } = req.body
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        const imagePath = req.files.map(file => file.filename);


        const newProduct = new Product({
            name: name,
            description: Description,
            brand: brand,
            stock: stock,
            originalPrice: originalPrice,
            offerPrice: offerPrice,
            category: category,
            image: imagePath
        })

        const saveProduct = await newProduct.save()
        if (saveProduct) {
            res.redirect('/admin/addProductPage')
        } else {
            console.log('somthing wrong happened');
        }
    } catch (error) {
        console.error(error)
    }
}
const editProductPage = async (req, res) => {
    try {
        const productId = req.query.productId
        const product = await Product.findById(productId)
        const category = await Category.find({})
        res.render('editProduct', { product, category })
    } catch (error) {
        console.error(error);
    }
}

const removeImage = async (req, res) => {
    try {
        const imageName = req.body.filename;
        const product = await Product.findById(req.body.productid);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const index = product.image.findIndex((image) => image === imageName);

        if (index !== -1) {
            product.image.splice(index, 1);
            await product.save();
            res.status(200).json({ message: 'Image removed successfully', index });
        } else {
            res.status(404).json({ message: 'Image not found in product' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateEditProduct = async (req, res) => {
    try {
        const { name, Description, brand, stock, originalPrice, offerPrice, category } = req.body;
        const id = req.query.id;

        const imagePath = req.files ? req.files.map(file => file.filename) : [];

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }


        product.name = name;
        product.description = Description;
        product.brand = brand;
        product.stock = stock;
        product.originalPrice = originalPrice;
        product.offerPrice = offerPrice;
        product.category = category;

        if (imagePath.length > 0) {
            if (!product.image) {
                product.image = [];
            }
            product.image.push(...imagePath)
        }


        const savedProduct = await product.save();
        if (savedProduct) {
            res.redirect('/admin/productList');
        } else {
            res.status(500).json({ message: 'Failed to update product' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const ToggleBlockProduct = async (req, res) => {
    try {
        const id = req.query.id
        const product = await Product.findOne({ _id: id })
        product.isActive = !product.isActive
        await product.save()
        res.redirect('/admin/productList')
    } catch (error) {
        console.error(error)
    }
}


module.exports = {
    productManagement,
    addProductPage,
    addProduct,
    editProductPage,
    ToggleBlockProduct,
    removeImage,
    updateEditProduct
}