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

        const filter = {
            status: 'Delivered'
        };

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

        const filter = {
            status: 'Delivered'
        };
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

            doc.fontSize(12).text('Order ID', 50, doc.y, { width: 90, align: 'left' })
                .text('Billing Name', 150, doc.y, { width: 100, align: 'left' })
                .text('Date', 250, doc.y, { width: 70, align: 'left' })
                .text('Total', 320, doc.y, { width: 70, align: 'right' })
                .text('Payment Status', 390, doc.y, { width: 100, align: 'left' })
                .text('Payment Method', 490, doc.y, { width: 90, align: 'left' });
            doc.moveDown();

            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            orders.forEach(order => {
                doc.fontSize(10).text(order._id, 50, doc.y, { width: 90, align: 'left' })
                    .text(order.userId ? order.userId.userName : 'Unknown', 150, doc.y, { width: 100, align: 'left' })
                    .text(new Date(order.createdAt).toLocaleDateString(), 250, doc.y, { width: 70, align: 'left' })
                    .text(order.totalPrice.toFixed(2), 320, doc.y, { width: 70, align: 'right' })
                    .text(order.paymentStatus, 390, doc.y, { width: 100, align: 'left' })
                    .text(order.paymentMethod, 490, doc.y, { width: 90, align: 'left' });
                doc.moveDown();
            });

            doc.end();
        } else if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

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

            worksheet.addRow([]); 
            worksheet.addRow(['Sales Summary']); 
            worksheet.addRow([]); 
            worksheet.addRow(['Overall Sales Count:', overallSalesCount]);
            worksheet.addRow(['Overall Order Amount:', overallOrderAmount.toFixed(2)]);
            worksheet.addRow(['Overall Discount:', overallDiscount.toFixed(2)]);
            worksheet.addRow([]);

            worksheet.addRow(['Order ID', 'Billing Name', 'Date', 'Total', 'Payment Status', 'Payment Method']);

            orders.forEach(order => {
                worksheet.addRow([
                    order._id,
                    order.userId ? order.userId.userName : 'Unknown',
                    new Date(order.createdAt).toLocaleDateString(),
                    order.totalPrice.toFixed(2),
                    order.paymentStatus,
                    order.paymentMethod
                ]);
            });

            const fileName = `Sales_Report_${new Date().toISOString()}.xlsx`;
            res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            await workbook.xlsx.write(res);
            res.end();;
        } else {
            res.status(400).json({ message: 'Invalid format specified' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const sales = async (req, res) => {
    try {
        const { filter } = req.query;
        let groupBy = {};

        if (filter === 'daily') {
            groupBy = { $dayOfMonth: '$createdAt' };
        } else if (filter === 'monthly') {
            groupBy = { $month: '$createdAt' };
        } else if (filter === 'yearly') {
            groupBy = { $year: '$createdAt' };
        } else {
            return res.status(400).json({ success: false, message: 'Invalid filter' });
        }

        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: groupBy,
                    total: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        return res.status(200).json(salesData);
    } catch (error) {
        console.error('Error generating chart:', error);
        res.status(500).json({ error: 'Failed to generate sales chart' });
    }
};

module.exports = {
    adminHome,
    fetchOrders,
    generateReport,
    sales
}