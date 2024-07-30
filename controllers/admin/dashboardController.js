const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const adminHome = async (req, res) => {
    try {
        const revenue = await Order.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ]);

        const totalOrders = await Order.countDocuments();

        const totalProducts = await Product.countDocuments();

        const totalUsers = await User.countDocuments();

        const categories = await Category.find({ isActive: true });
        res.render('adminHome', {
            revenue: revenue[0]?.totalRevenue || 0,
            totalOrders,
            totalProducts,
            totalUsers,
            categories
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const fetchOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, startDate, endDate, paymentStatus, period } = req.query;

        const filter = {};

        if (category) {
            const categoryData = await Category.findOne({ name: category, isActive: true });
            if (categoryData) {
                filter['cartItems.productId'] = { $in: await Product.find({ category: categoryData._id }).distinct('_id') };
            }
        }

        if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            filter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            filter.createdAt = { $lte: new Date(endDate) };
        }

        if (paymentStatus && paymentStatus !== 'All') {
            filter.paymentStatus = paymentStatus;
        }

        if (period) {
            const now = new Date();
            switch (period) {
                case 'daily':
                    filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 1)) };
                    break;
                case 'weekly':
                    filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
                    break;
                case 'monthly':
                    filter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
                    break;
                case 'yearly':
                    filter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
                    break;
                default:
                    break;
            }
        }

        const orders = await Order.find(filter)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .populate('userId')
        .populate('cartItems.productId')
        .exec();
    

        const count = await Order.countDocuments(filter);

        console.log('Orders Fetched:', orders);

        res.json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



const generateReport = async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;

        const filter = {};
        if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            filter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            filter.createdAt = { $lte: new Date(endDate) };
        }

        const orders = await Order.find(filter).populate('userId').populate('cartItems.productId').exec();

        if (format === 'pdf') {
            const doc = new PDFDocument();
            const fileName = `Sales_Report_${new Date().toISOString()}.pdf`;

            res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-type', 'application/pdf');

            doc.pipe(res);

            doc.fontSize(18).text('Sales Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Report generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
            doc.moveDown();

            const overallSalesCount = orders.length;
            const overallOrderAmount = orders.reduce((total, order) => total + order.totalPrice, 0);
            const overallDiscount = orders.reduce((discount, order) => {
                const totalOriginalPrice = order.cartItems.reduce((total, item) => {
                    return total + (item.quantity * item.productId.originalPrice);
                }, 0);
                const totalOfferPrice = order.cartItems.reduce((total, item) => {
                    return total + (item.quantity * item.productId.offerPrice);
                }, 0);
                return discount + (totalOriginalPrice - totalOfferPrice);
            }, 0);

            doc.fontSize(12).text(`Overall Sales Count: ${overallSalesCount}`);
            doc.text(`Overall Order Amount: ${overallOrderAmount.toFixed(2)}`);
            doc.text(`Overall Discount: ${overallDiscount.toFixed(2)}`);
            doc.moveDown();

            orders.forEach(order => {
                doc.fontSize(12).text(`Order ID: ${order._id}`);
                doc.text(`Billing Name: ${order.userId ? order.userId.userName : 'Unknown'}`);
                doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
                doc.text(`Total: ${order.totalPrice.toFixed(2)}`);
                doc.text(`Payment Status: ${order.paymentStatus}`);
                doc.text(`Payment Method: ${order.paymentMethod}`);
                doc.moveDown();
            });

            doc.end();
        } else if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            worksheet.columns = [
                { header: 'Order ID', key: 'orderId', width: 20 },
                { header: 'Billing Name', key: 'billingName', width: 30 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Total', key: 'total', width: 15 },
                { header: 'Payment Status', key: 'paymentStatus', width: 20 },
                { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            ];

            orders.forEach(order => {
                worksheet.addRow({
                    orderId: order._id,
                    billingName: order.userId ? order.userId.userName : 'Unknown',
                    date: new Date(order.createdAt).toLocaleDateString(),
                    total: order.totalPrice.toFixed(2),
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod
                });
            });

            const fileName = `Sales_Report_${new Date().toISOString()}.xlsx`;
            res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            await workbook.xlsx.write(res);
            res.end();
        } else {
            res.status(400).json({ message: 'Invalid format specified' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    adminHome,
    fetchOrders,
    generateReport
}