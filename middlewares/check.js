const mongoose=require('mongoose');
const {User} = require('../models/userSchema'); // Adjust the path to your User model

const checkBlockedUser = async (req, res, next) => {
    try {
        // Ensure session exists before accessing it
        if (req.session && req.session.user) {
            const user = await User.findById(req.session.user);

            if (user && user.isBlocked) {
                // Set the message in the session without destroying it
                req.session.message = 'Your account is blocked. Please contact support.';

                // Redirect to homepage with the message
                return res.redirect('/ban');
            } else {
                next(); // Proceed if user is not blocked
            }
        } else {
            next(); // Proceed if no session
        }
    } catch (error) {
        console.error('Error checking blocked user:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { checkBlockedUser };


