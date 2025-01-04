const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');
const bookController=require('../controllers/bookController');
const{userAuth,adminAuth}=require('../middlewares/auth');

const passport = require('passport');


router.get('/',userController.loadHomePage);

router.get('/login',userController.loadLogin);
router.post('/login',userController.login);
router.get('/signup',userController.loadSignUp);
router.get('/checkout',userController.loadCheckOut)
router.get('/contact',userController.loadContact)
router.get('/pageerror',userController.pageNotFound);
router.post('/signup',userController.signup);
router.get('/verify',userController.loadVerifyOtp);
router.post('/verify',userController.verifyOtp);

router.get('/resendOtp',userController.resendOtp);
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signup' }),  // On failure, redirect to login page
    (req, res) => {
      // Successful authentication, redirect to the home page (or any other page you prefer)
      res.redirect('/');
    }
  );
  router.get('/logout',userController.logout);
router.get('/shop',userAuth,userController.loadShop)
router.get('/book/:id',userAuth,userController.loadBookDetails)
router.get('/fiction',userController.loadFiction);
module.exports=router;