const mongoose = require('mongoose');
const Order = require('../models/orderSchema');
const Book = require('../models/bookSchema');
const { User } = require('../models/userSchema');

const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';
        const users = await User.find({ isAdmin: false });

        let filter = { user: { $in: users.map(user => user._id) } };

        if (searchQuery) {
            filter.$or = [
                { orderId: { $regex: searchQuery, $options: "i" } },
                { 'books.productId.title': { $regex: searchQuery, $options: "i" } },
            ];

            const matchingUsers = await User.find({ name: { $regex: searchQuery, $options: "i" } }, '_id');
            if (matchingUsers.length > 0) {
                filter.$or.push({ user: { $in: matchingUsers.map(user => user._id) } });
            }
        }

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.find(filter)
            .populate('books.productId')
            .populate('user')
            .skip(skip)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const pagination = {
            current: page,
            previous: page > 1 ? `/admin/adminorders?page=${page - 1}&search=${searchQuery}` : null,
            next: page < totalPages ? `/admin/adminorders?page=${page + 1}&search=${searchQuery}` : null,
            total: totalPages,
            pages: Array.from({ length: totalPages }, (_, i) => i + 1),
        };

        res.render('adminorder', { orders, pagination, currentPage: page, totalPages, searchQuery });

    } catch (error) {
        console.error('Error Fetching Orders:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const allowedStatuses = ['Shipped', 'Pending', 'Delivered', 'Cancelled', 'Returned', 'Return Approve'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(400).json({ message: 'No Order found' });
        }

        order.status = status;
        
        await order.save();

        res.status(200).json({success:true,message:'Order updated successfully'})
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
};

const viewOrders = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('user').populate('books.productId');

        if (!order) {
            return res.status(400).json({ message: 'No order found' });
        }

        res.render('vieworder', { order });
    } catch (error) {
        console.error('Error loading the order', error);
        res.status(500).send('Error');
    }
};

module.exports = { getOrders, updateStatus, viewOrders };
