const { User } = require('../models/userSchema');
const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(user => {
                if (!user) {
                    return res.redirect('/login');
                }

                if (user.isBlocked) {
                    return res.redirect('/login');
                }

                // Allow access to the route if the user is not blocked and is authenticated
                if (user.isAdmin) {
                    // Admin-specific logic can go here if needed
                    // For example, you can allow admins to access certain routes or dashboards
                    return next();
                }

                // For regular users, allow access
                next();
            })
            .catch(error => {
                console.error('Error in user authentication:', error);
                res.status(500).send('Internal Server Error');
            });
    } else {
        res.redirect('/login');
    }
};


const adminAuth = (req, res, next) => {
    User.findOne({ isAdmin: true }).then(data => {
        if (data) {
            next();
        } else {
            res.redirect('/admin/login');
        }
    }).catch(error => {
        console.log('Error in admin authentication', error);
        res.status(500).send('Internal Server Error');
    });
};

module.exports = {
    userAuth,
    adminAuth,
    
};
