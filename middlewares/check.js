const mongoose = require('mongoose');
const { User } = require('../models/userSchema');

const checkBlockedUser = async (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            const user = await User.findById(req.session.user);

            if (user && user.isBlocked) {
                return res.redirect('/ban');
            } else {
                next();
            }
        } else {
            next();
        }
    } catch (error) {
        console.error('Error checking blocked user:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { checkBlockedUser };
