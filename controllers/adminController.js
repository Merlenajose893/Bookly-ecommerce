const {User} = require('../models/userSchema');
const bcrypt = require('bcrypt');

const loadLogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin');
    }
    res.render('adminlogin', { message: null }); // Null instead of string 'null'
};

const login=async(req,res)=>
{
    try {
        const{email,password}=req.body;
        console.log(req.body);
        const admin=await User.findOne({email,isAdmin:true});
        if(admin)
        {
            const passwordMatch=await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin={id:admin._id,email:admin.email};
                console.log('Admin Logged In:',req.session.admin);
                
                return res.redirect('/admin');

            }
            else
            {
                return res.redirect('/login')
            }
        }else{
            return res.redirect('/login')
        }

    } catch (error) {
        console.log('Error Login',error);
        return res.redirect('/pageerror');
        
        
    }
}

const adminLogout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error during logout:', err);
        return res.redirect('/admin');
      }
  
      // Clear session cookie
      res.clearCookie('connect.sid', { path: '/' });
  
      // Respond with success or redirect
      res.redirect('/admin/login');
  
     
    });
  };

const loadDashboard = async (req, res) => {
    // Check if the session has the admin flag
    if (req.session.admin) {
        try {
            // Render the dashboard if the admin is authenticated
            return res.render('dashboard');
        } catch (error) {
            // Handle any error that occurs while rendering
            console.error('Error rendering dashboard:', error);
            return res.redirect('/pageerror');
        }
    } else {
        // If the admin is not authenticated, redirect to the login page
        return res.redirect('/admin/login?msg=Please log in first');
    }
};

module.exports = { loadLogin, login, loadDashboard ,adminLogout};
