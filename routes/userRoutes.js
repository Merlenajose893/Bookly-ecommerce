const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const bookController = require('../controllers/bookController');
const genreController = require('../controllers/GenreController');
const cartController = require('../controllers/cartController');
const { userAuth, adminAuth } = require('../middlewares/auth');
const { checkBlockedUser } = require('../middlewares/check');
const profileController = require('../controllers/profileController');
const wishlistController=require('../controllers/wishlistController')
const passport = require('passport');

router.get('/', checkBlockedUser, userController.loadHomePage);

router.get('/login', userController.loadLogin);
router.post('/login', checkBlockedUser, userController.login);
router.get('/signup', userController.loadSignUp);
router.get('/checkout', userController.loadCheckOut);
router.post('/checkout',userController.loadCheckOut);
router.get('/contact', userController.loadContact);
router.get('/pageerror', userController.pageNotFound);
router.post('/signup', userController.signup);
router.get('/verify', userAuth, userController.loadVerifyOtp);
router.post('/verify', userController.verifyOtp);
router.get('/resendOtp', userController.resendOtp);
router.post('/resendOtp', userController.resendOtp);
router.get('/ban', userController.loadAccountBan);

router.get('/resendOtp', userController.resendOtp);
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }), // On failure, redirect to login page
  (req, res) => {
    req.session.user = req.user._id;
    // Successful authentication, redirect to the home page (or any other page you prefer)
    res.redirect('/');
  },
);
router.get('/logout', userController.logout);
router.get('/shop', userController.loadShop);
router.get('/book/:id', userController.loadBookDetails);
router.get('/fiction', userController.loadFiction);
router.get('/', userController.getAllGenres);
router.get('/fiction', userController.getAllGenresWithBooks);
router.get('/genres/:id', userController.showGenre);
router.get('/book/:id', userController.showBookDetails);

router.get('/profiledashboard', userAuth, profileController.loaddashboard);
// router.get('/profileorders', userAuth, profileController.loadorder);
router.get('/wallet', userAuth, profileController.loadWallet);
router.get('/wallet/:walletId/transaction', profileController.getTransactions);
router.post('/add-money',profileController.addMoney);

router.get('/changepassword', userAuth, profileController.loadChangePassword);
router.post('/change-password',userAuth,profileController.changePassword);
router.get('/updateprofile', userAuth, profileController.loadUpdateProfile);
router.post('/profiledashboard', profileController.editProfile);


router.get('/forgetpassword',userController.loadForgetPassword)
router.get('/verifyemail',userController.loadVerifyEmail);
router.post('/verifyemail',userController.verifyPassword);
router.get('/reset',userController.loadResetPassword);
router.post('/forgotpassword',userController.forgetPassword);
router.post('/reset',userController.resetPassword)


//Cart Mangement

router.get('/cart', cartController.loadCart);
router.post('/cart', cartController.addToCart);
router.post('/cart/update',cartController.updateCart);
router.get('/cart/update',cartController.updateCart);
router.get('/cart/apply-coupon',cartController.applyCoupon)
router.post('/cart/apply-coupon',cartController.applyCoupon)
router.post('/cart/remove-coupon',cartController.removeCoupon)
router.post('/cart/:productId',cartController.deleteCart)
router.get('/cart/:productId',cartController.deleteCart)

module.exports = router;
 //AddressManagement

 router.get('/address',profileController.loadAddress);
// router.get('/editaddress',profileController.loadEditAddress);
 router.post('/address',profileController.addAddress);
 router.post('/address/:addressId',profileController.editAddress);
 router.get('/address/:addressId',profileController.deleteAddress);
 router.delete('/address/:addressId',profileController.deleteAddress);
router.post('/place-order',userController.placeOrder);
// router.post('/create-order',userController.createOrder);
router.post('/create-razorpay-order', userController.createRazorOrder);
router.post('/verify-razorpay-payment', userController.verifyRazorPay);

router.get('/order-success/:orderId',userController.loadOrder);
router.get('/profileorder',profileController.loadOrder);
// router.post('/viewOrder/:orderId',userController.viewOrder);
router.get('/profileorder/viewOrder/:orderId',userController.viewOrder)
router.post('/profileorder/cancel/:orderId',profileController.cancelOrder);
router.get('/profileorder/cancel/:orderId',profileController.cancelOrder);
router.post('/profileorder/return/:orderId',profileController.returnOrder)
router.get('/profileorder/invoice/:orderId',profileController.generateInvoice);
router.post('/resend-otp',userController.resendotp)

router.get('/wishlist',wishlistController.loadWishlist);
router.post('/wishlist/add',wishlistController.addWishlist);
 router.get('/wishlist/add',wishlistController.addWishlist);
 router.post('/wishlist-to-cart',wishlistController.addWishlistToCart)
 router.post('/wishlist/remove',wishlistController.removeBookFromWishlist)