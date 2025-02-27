const express = require('express');
const router = express.Router();
const {mongoose} = require('mongoose');
const adminController = require('../controllers/adminController');
const GenreController = require('../controllers/GenreController');
const AdminUserController = require('../controllers/AdminUserController');
const bookController=require('../controllers/bookController');
const adminOrderController=require('../controllers/adminOrderController');
const { userAuth, adminAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const CouponController=require('../controllers/Couponcontroller');
const OfferController=require('../controllers/offerController')

// Admin Login Routes
router.get('/login', adminController.loadLogin);  // Display the login page
router.post('/login', adminController.login);  
router.get('/logout',adminController.adminLogout)// Handle login form submission

// Admin Dashboard Route
router.get('/', adminAuth, adminController.loadDashboard); 
// router.get('/',adminController.getDashboardData);
// router.get('/sales-report',adminController.salesReport) // Load the admin dashboard, after admin is authenticated
router.get('/sales-report', adminController.salesReport);


// Genre Management
  // Create a genre, requiring admin authentication

// User Management
router.get('/usermanage',adminAuth,AdminUserController.customerInfo);
router.get('/updateuser/:id',AdminUserController.updateUser); 
// router.get('/search',AdminUserController.customerInfo); // Get list of all users, requiring admin authentication
router.get('/blockCustomer',AdminUserController.blockUser);
router.get('/unblockCustomer',AdminUserController.unblockUser);
//Genre management
router.get('/genres', adminAuth, GenreController.genreInfo);  // Get list of all genres
router.post('/genres',GenreController.addGenre);
router.post('/addCategoryOffer',adminAuth,GenreController.addCategoryOffer);
router.post('/removeCategoryOffer',adminAuth,GenreController.removeCategoryInfo);
router.get('/listCategory',adminAuth,GenreController.listCategory);
router.get('/unlistCategory',adminAuth,GenreController.unlistCategory);
router.get('/pageerror',GenreController.pageerror);
router.get('/updateGenre', GenreController.getEditCategory);

router.post('/updateGenre/:id',adminAuth,GenreController.editCategory);

router.post('/toggleCategoryDeletion/:id', GenreController.toggleCategoryDeletion);


//Product Management
router.get('/books',adminAuth, bookController.getAllBooks);
router.get('/books',adminAuth,bookController.addProducts);
router.get('/addbooks',adminAuth,bookController.addProducts);
router.post('/books', upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), bookController.addProducts);
router.post('/books/:bookId/update', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]), bookController.editProduct);

router.post('/books/:bookId/update',bookController.editProduct);
router.post('/delete-books/:bookId', bookController.deleteProduct);
router.post('/undelete-books/:bookId', bookController.undeleteProduct);
router.post('/books/delete-image',bookController.deleteSingleImage);
router.get('/books/delete-image',bookController.deleteSingleImage);
router.get('/adminorders',adminOrderController.getOrders);
router.post('/adminorders/updateStatus/:orderId',adminOrderController.updateStatus);
router.get('/adminorders/updateStatus',adminOrderController.updateStatus);
router.get('/adminorders/viewOrder/:orderId',adminOrderController.viewOrders);

//Coupon Management

router.get('/coupon',CouponController.loadCoupon);
router.post('/coupon',CouponController.addCoupon);
router.get('/updateCoupon/:couponId',CouponController.loadUpdateCoupon)
router.post('/updateCoupon/:couponId',CouponController.updatedCoupon)
router.post("/toggleCouponStatus/:couponId", CouponController.toggleCouponStatus);

//OfferMangement

router.get('/offer',OfferController.loadOfferPage)
router.post('/offer',OfferController.createOffer)
router.post('/offer/edit/:offerId',OfferController.editOffer)
router.post("/offer/toggle/:offerId", OfferController.toggleOfferStatus);




module.exports = router;














