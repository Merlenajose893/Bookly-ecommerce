const { User } = require('../models/userSchema');
const env = require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const customerInfo = async (req, res) => {
  try {
    let search = req.query.query || '';
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let skip = (page - 1) * limit;

    const users = await User.find({
      isAdmin: false,
      $or: [{ name: { $regex: search, $options: 'i' } }],
    }).sort({createdAt:-1})
      .limit(limit)
      .skip(skip)
      .exec();

    const totalCount = await User.countDocuments({
      isAdmin: false,
      $or: [{ name: { $regex: search, $options: 'i' } }],
    });

    const totalPages = Math.ceil(totalCount / limit);

    const pagination = {
      previous: page > 1 ? `?page=${page - 1}&search=${search}` : null,
      next: page < totalPages ? `?page=${page + 1}&search=${search}` : null,
      current: page,
      totalPages,
      pages: [],
    };

    for (let i = 1; i <= totalPages; i++) {
      pagination.pages.push({
        number: i,
        url: `?page=${i}&search=${search}`,
        active: i === page,
      });
    }

    res.render('usermanage', {
      users,
      search,
      page,
      limit,
      count: totalCount,
      pagination,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('An error occurred while fetching users');
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    console.log('User ID:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User does not exist' });
    }

    user.isBlocked = true;
    await user.save();

    return res.status(200).json({ success: true, message: 'User blocked successfully' });

  } catch (error) {
    console.error('Error blocking user:', error);
    return res.status(500).json({ success: false, message: 'Error blocking user' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    console.log('User ID:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User does not exist' });
    }

    user.isBlocked = false;
    await user.save();
    return res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);

    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Error unblocking user' });
    }
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedData = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      { userId: _id },
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'An error occurred while updating the user' });
  }
};

module.exports = { customerInfo, blockUser, unblockUser, updateUser };
