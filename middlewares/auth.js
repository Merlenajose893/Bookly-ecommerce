const {User} = require('../models/userSchema');
const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(user => {
                if (!user) {
                    // User not found
                    return res.redirect('/login');
                }

                if (user.isBlocked) {
                    // Blocked users are redirected
                    return res.redirect('/login');
                }

                if (user.isAdmin) {
                    // Allow admins to proceed regardless of isBlocked status
                    return next();
                }

                // Allow non-blocked, non-admin users
                next();
            })
            .catch(error => {
                console.error('Error in user authentication:', error);
                res.status(500).send('Internal Server Error');
            });
    } else {
        // User not logged in
        res.redirect('/login');
    }
};


const adminAuth=(req,res,next)=>
{
    User.findOne({isAdmin:true}).then(data=>
    {
        if(data)
        {
            next();
        }
        else
        {
            res.redirect('/admin/login')
        }
    }).catch(error=>
    {
        console.log('Error in admin authentication',error);
        res.status(500).send('Internal Server Error');
        
    })
}
module.exports={
    userAuth,adminAuth 
}