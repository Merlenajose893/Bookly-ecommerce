const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');
const bookController=require('../controllers/bookController');
const genreController=require('../controllers/GenreController');
const{userAuth,adminAuth}=require('../middlewares/auth');
const {checkBlockedUser}=require('../middlewares/check');
const profileController=require('../controllers/profileController');
const passport = require('passport');


router.get('/',checkBlockedUser,userController.loadHomePage);

router.get('/login',userController.loadLogin);
router.post('/login',userController.login);
router.get('/signup',userController.loadSignUp);
router.get('/checkout',userController.loadCheckOut)
router.get('/contact',userController.loadContact)
router.get('/pageerror',userController.pageNotFound);
router.post('/signup',userController.signup);
router.get('/verify',userController.loadVerifyOtp);
router.post('/verify',userController.verifyOtp);
router.get('/ban',userController.loadAccountBan);
router.get('/cart',userController.loadCart);

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
router.get('/',userController.getAllGenres);
router.get('/fiction',userController.getAllGenresWithBooks);
router.get('/genres/:id', userController.showGenre);
router.get('/book/:id', userController.showBookDetails);

router.get('/profiledashboard',userAuth,profileController.loaddashboard)
router.get('/profileorders',userAuth,profileController.loadorder);
router.get('/wallet',userAuth,profileController.loadWallet);
router.get('/address',userAuth,profileController.loadAddress);
router.get('/changepassword',userAuth,profileController.loadChangePassword);
module.exports=router;