const mongoose=require('mongoose')
const Order=require('../models/orderSchema');
const Book=require('../models/bookSchema');
const {User}=require('../models/userSchema');
const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get current page
        const limit = 10; // Number of items per page
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || ''; // Get search query
        const users = await User.find({ isAdmin: false });

        let filter = { user: { $in: users.map(user => user._id) } };

        if (searchQuery) {
            // Search by orderId, user name, or book title
            filter.$or = [
                { orderId: { $regex: searchQuery, $options: "i" } }, // Case-insensitive Order ID search
                { 'books.productId.title': { $regex: searchQuery, $options: "i" } }, // Search by book title
            ];

            // Find users whose names match the search and add them to the filter
            const matchingUsers = await User.find({ name: { $regex: searchQuery, $options: "i" } }, '_id');
            if (matchingUsers.length > 0) {
                filter.$or.push({ user: { $in: matchingUsers.map(user => user._id) } });
            }
        }

        // Get total count of orders with filter
        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);

        // Fetch orders
        const orders = await Order.find(filter)
            .populate('books.productId') // Populate book details
            .populate('user') // Populate the user details
            .skip(skip)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        console.log('Orders:', orders);

        // Pagination object
        const pagination = {
            current: page,
            previous: page > 1 ? `/admin/adminorders?page=${page - 1}&search=${searchQuery}` : null,
            next: page < totalPages ? `/admin/adminorders?page=${page + 1}&search=${searchQuery}` : null,
            total: totalPages,
            pages: Array.from({ length: totalPages }, (_, i) => i + 1)
        };

        res.render('adminorder', { 
            orders,
            pagination,
            currentPage: page,
            totalPages,
            searchQuery // Pass searchQuery to EJS
        });

    } catch (error) {
        console.error('Error Fetching Orders:', error);
        res.status(500).send('Internal Server Error');
    }
};


    const updateStatus = async (req, res) => {
        try {
            const { orderId, status } = req.body;
            console.log(orderId,'eri');
            
            console.log('Status:',status);
            

            // Validate the status
            const allowedStatuses = ['Shipped', 'Pending', 'Delivered', 'Cancelled','Returned','Return Approve'];
            console.log(allowedStatuses,'fghjkl');
            
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }

            // Find the order
            const order = await Order.findById(orderId);
            console.log('Order',order);
            
            if (!order) {
                return res.status(400).json({ message: 'No Order found' });
            }

            // Update the order status
            order.status = status;
            await order.save();

            // Redirect or send a response
            res.redirect('/admin/adminorders');
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).send('Internal Server Error');
        }
    };
const viewOrders=async (req,res) => {
    try {
        const orderId=req.params.orderId;
        console.log('OrderId',orderId);
        
        const order=await Order.findById(orderId).populate('user').populate('books.productId');
        console.log('Order',order);
        
        if(!order)
        {
            return res.status(400).json({message:'No order found'});
        }
        res.render('vieworder',{order});
    } catch (error) {
        console.error('Error loading the order',error);
        res.status(500).send('Error');
        
    }
    
}
module.exports={getOrders,updateStatus,viewOrders}