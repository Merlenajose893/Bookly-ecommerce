const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const Coupon = require('../models/couponSchema');

const loadCoupon = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : "";

        const filter = {};
        if (search) {
            filter.couponCode = { $regex: search, $options: "i" };
        }

        const totalCoupons = await Coupon.countDocuments(filter);

        const coupons = await Coupon.find(filter)
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalPages = Math.ceil(totalCoupons / itemsPerPage);
        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;

        res.render("coupon", {
            coupons,
            currentPage: page,
            itemsPerPage,
            hasPrevPage,
            hasNextPage,
            totalPages,
            pageNumbers: Array.from({ length: totalPages }, (_, i) => i + 1),
            search,
        });
    } catch (error) {
        console.error("Error Loading Coupon:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addCoupon = async (req, res) => {
    try {
        let { name, offerPrice, minimumPrice, expiredOn } = req.body;

        if (!offerPrice || !minimumPrice || !expiredOn) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        offerPrice=Number(offerPrice);
        minimumPrice=Number(minimumPrice);
        if(offerPrice<=0 || minimumPrice<=0)
        {
            return res.status(400).json({message:'Offerprice and minimumprice should be greater than 0'});
        }
        if(offerPrice>=minimumPrice)
        {
            return res.status(400).json({message:'Offer Price must be less than minimum Price'})
        }
        if(minimumPrice>5000)
        {
            return res.status(400).json({message:'Minimum Price should be less than 5000'})
        }

        if (!name) {
            const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
            name = `COUP-${offerPrice}-${randomCode}`;
        }

        const existingCoupon = await Coupon.findOne({ name });
        if (existingCoupon) {
            return res.status(400).json({ message: "Coupon name already exists" });
        }

        const newCoupon = new Coupon({ name, offerPrice, minimumPrice, expiredOn });
        await newCoupon.save();

        res.status(200).json({ message: "Coupon added successfully!", coupon: newCoupon });

    } catch (error) {
        console.error("Error Adding Coupon:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const loadUpdateCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        console.log("Received Coupon ID:", couponId);

        const query = { _id: new ObjectId(couponId) };

        const coupon = await Coupon.findOne(query);
        console.log("MongoDB Query Result:", coupon);

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        res.render("updatecoupon", { coupon });
    } catch (error) {
        console.error("Error Loading Update Coupon:", error);
        res.status(500).send("Internal Server Error");
    }
};

const updatedCoupon = async (req, res) => {
    const couponId = req.params.couponId;
    console.log('ID', couponId);
    
    const { name, offerPrice, minimumPrice, expiredOn } = req.body;
    console.log(req.body);
    
    if (!name || !offerPrice || !minimumPrice || !expiredOn) {
       return res.status(400).json({ message: 'All Fields are required' });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId, 
        { name, offerPrice, minimumPrice, expiredOn }, 
        { new: true }
    );

    if (!updatedCoupon) {
       return res.status(400).json({ message: 'Coupon is not updated' });
    }

    res.json({ success: true, message: "Coupon updated successfully", redirectUrl: "/admin/coupon" });
};

const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.params;
        const coupon = await Coupon.findById(couponId);
        
        if (!coupon) {
            return res.status(400).json({ message: 'No coupon is found' });
        }

        coupon.isList = !coupon.isList;
        await coupon.save();
        res.redirect('/admin/coupon');
    } catch (error) {
        console.error('Error updating the coupon', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { loadCoupon, addCoupon, loadUpdateCoupon, updatedCoupon, toggleCouponStatus };
