const Coupon=require('../../models/couponModel')


const couponList = async (req, res) => {
    try {
        const perPage = 8;
        const page = parseInt(req.query.page) || 1;
        const totalCoupons = await Coupon.countDocuments();
        const coupons = await Coupon.find()
            .skip(perPage * (page - 1))
            .limit(perPage);
        const totalPages = Math.ceil(totalCoupons / perPage);
        res.render('couponList', { coupons, totalPages, currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const addCouponPage = (req, res) => {
    try {
        res.render('addCoupon', { alert: req.query.alert || null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const addCoupon = async (req, res) => {
    try {
        const { coupon_code, description, percentage, min_amount, max_amount, expiry_date } = req.body;
        const existingCoupon = await Coupon.findOne({ coupon_code });

        if (existingCoupon) {
            return res.redirect('/admin/addCoupon?alert=The Coupon already exists');
        }

        const newCoupon = new Coupon({
            coupon_code,
            description,
            percentage,
            minimumAmount: min_amount,
            maximumAmount: max_amount,
            expiryDate: expiry_date
        });

        await newCoupon.save();
        res.redirect('/admin/couponPage');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const editCouponPage = async (req, res) => {
    try {
        const couponId = req.query.couponId;
        const coupon = await Coupon.findById(couponId);

        // Format the expiry date
        coupon.formattedExpiryDate = coupon.expiryDate.toISOString().substring(0, 10);

        res.status(200).render('editCoupon', { coupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const editCoupon = async (req, res) => {
    try {
        const { coupon_code, description, percentage, min_amount, max_amount, expiry_date, couponId } = req.body;
        const coupon = await Coupon.findById(couponId);

        if (coupon.coupon_code === coupon_code) {
            coupon.description = description;
            coupon.percentage = percentage;
            coupon.minimumAmount = min_amount;
            coupon.maximumAmount = max_amount;
            coupon.expiryDate = new Date(expiry_date);
            await coupon.save();
            res.redirect('/admin/couponPage');
        } else {
            const couponExists = await Coupon.findOne({ coupon_code });
            if (couponExists) {
                res.render('editCoupon', { coupon, alert: 'Coupon already exists' });
            } else {
                coupon.coupon_code = coupon_code;
                coupon.description = description;
                coupon.percentage = percentage;
                coupon.minimumAmount = min_amount;
                coupon.maximumAmount = max_amount;
                coupon.expiryDate = new Date(expiry_date);
                await coupon.save();
                res.redirect('/admin/couponPage');
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const couponUnblock = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        await Coupon.updateOne({ _id: couponId }, { isListed: true });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const couponBlock = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        await Coupon.updateOne({ _id: couponId }, { isListed: false });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



module.exports={
    couponList,
    addCouponPage,
    addCoupon,
    editCouponPage,
    editCoupon,
    couponUnblock,
    couponBlock
}