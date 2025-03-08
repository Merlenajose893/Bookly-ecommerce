const {User}=require('../models/userSchema');
const env=require('dotenv').config();
const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const customerInfo = async (req, res) => {
  try {
    let search = req.query.query || '';
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let skip = (page - 1) * limit;

    // Fetch user data
    const users = await User.find({
      isAdmin: false,
      $or: [{ name: { $regex: search, $options: 'i' } }],
    })
      .limit(limit)
      .skip(skip)
      .exec();

    // Get the total number of users (for pagination)
    const totalCount = await User.countDocuments({
      isAdmin: false,
      $or: [{ name: { $regex: search, $options: 'i' } }],
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Create a pagination object
    const pagination = {
      previous: page > 1 ? `?page=${page - 1}&search=${search}` : null,
      next: page < totalPages ? `?page=${page + 1}&search=${search}` : null,
      current: page,
      totalPages,
      pages: [],
    };

    // Generate page numbers for pagination
    for (let i = 1; i <= totalPages; i++) {
      pagination.pages.push({
        number: i,
        url: `?page=${i}&search=${search}`,
        active: i === page,
      });
    }

    // Render the page with user data
    res.render('usermanage', {
      users,   // Pass users data
      search,
      page,
      limit,
      count: totalCount,  // Pass total count for pagination
      pagination, // Pass pagination object
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('An error occurred while fetching users');
  }
};



  
const blockUser = async (req, res) => {
  try {
    const userId = req.query.id;  // Accessing the userId from the query string
    console.log('User ID:', userId);

    // Validate the userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ success: false, message: 'User does not exist' });
    }

    // Block the user
    user.isBlocked = true;
    await user.save();

    // Send success response and redirect
    res.redirect('/admin/usermanage');
  } catch (error) {
    console.error('Error blocking user:', error);

    // Send error response
    return res.status(500).json({ success: false, message: 'Error blocking user' });
  }
};

  
const unblockUser = async (req, res) => {
  try {
    const userId = req.query.id;  // Get user ID from query parameters
    console.log('User ID:', userId);

    // Validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User does not exist' });
    }

    // Unblock the user
    user.isBlocked = false;
    await user.save();

    // Redirect to the user management page
    res.redirect('/admin/usermanage');
  } catch (error) {
    console.error('Error unblocking user:', error);

    // Send error response if something goes wrong
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Error unblocking user' });
    }
  }
};





  const updateUser = async (req, res) => {
    try {
      // Extract user ID and updated data from the request
      const { userId } = req.params; // Assuming userId is passed as a route parameter
      const updatedData = req.body; // The updated fields sent in the request body
  
      // Validate user ID
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      // Find the user and update
      const updatedUser = await User.findByIdAndUpdate(
        {userId:_id},
        updatedData,
        { new: true, runValidators: true } // Return updated user and run validations
      );
  
      // Check if the user exists
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Send success response
      res.status(200).json({
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "An error occurred while updating the user" });
    }
  };
  
  

module.exports={customerInfo,blockUser,unblockUser,updateUser};