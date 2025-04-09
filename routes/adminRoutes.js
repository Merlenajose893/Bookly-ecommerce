const express = require('express');
const router = express.Router();
const { mongoose } = require('mongoose');
const adminController = require('../controllers/adminController');
const GenreController = require('../controllers/GenreController');
const AdminUserController = require('../controllers/AdminUserController');
const bookController = require('../controllers/bookController');
const adminOrderController = require('../controllers/adminOrderController');
const { userAuth, adminAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const CouponController = require('../controllers/Couponcontroller');
const OfferController = require('../controllers/offerController');

router.get('/login', adminController.loadLogin);
router.post('/login', adminController.login);
router.get('/logout', adminController.adminLogout);

router.get('/', adminAuth, adminController.loadDashboard);
router.get('/sales-report', adminController.salesReport);

router.get('/usermanage', adminAuth, AdminUserController.customerInfo);
router.get('/updateuser/:id',adminAuth, AdminUserController.updateUser);
router.get('/blockCustomer',adminAuth, AdminUserController.blockUser);
router.get('/unblockCustomer',adminAuth,AdminUserController.unblockUser);

router.get('/genres', adminAuth, GenreController.genreInfo);
router.post('/genres', adminAuth,GenreController.addGenre);
router.get('/listCategory', adminAuth, GenreController.listCategory);
router.get('/unlistCategory', adminAuth, GenreController.unlistCategory);
router.get('/pageerror', GenreController.pageerror);
router.get('/updateGenre', GenreController.getEditCategory);
router.post('/updateGenre/:id', adminAuth, GenreController.editCategory);
router.post('/toggleCategoryDeletion/:id', GenreController.toggleCategoryDeletion);

router.get('/books', adminAuth, bookController.getAllBooks);
router.get('/books', adminAuth, bookController.addProducts);
router.get('/addbooks', adminAuth, bookController.addProducts);
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
router.post('/books/:bookId/update', bookController.editProduct);
router.post('/delete-books/:bookId', bookController.deleteProduct);
router.post('/undelete-books/:bookId', bookController.undeleteProduct);
router.post('/books/delete-image', bookController.deleteSingleImage);
router.get('/books/delete-image', bookController.deleteSingleImage);

router.get('/adminorders', adminAuth, adminOrderController.getOrders);
router.post('/adminorders/updateStatus/:orderId', adminOrderController.updateStatus);
router.get('/adminorders/updateStatus', adminOrderController.updateStatus);
router.get('/adminorders/viewOrder/:orderId', adminOrderController.viewOrders);

router.get('/coupon', adminAuth, CouponController.loadCoupon);
router.post('/coupon', adminAuth,CouponController.addCoupon);
router.get('/updateCoupon/:couponId', adminAuth,CouponController.loadUpdateCoupon);
router.post('/updateCoupon/:couponId', adminAuth,CouponController.updatedCoupon);
router.post('/toggleCouponStatus/:couponId', adminAuth,CouponController.toggleCouponStatus);

router.get('/offer', adminAuth, OfferController.loadOfferPage);
router.post('/offer', adminAuth,OfferController.createOffer);
router.post('/offer/edit/:offerId', OfferController.editOffer);
router.post('/offer/toggle/:offerId', OfferController.toggleOfferStatus);

module.exports = router;
