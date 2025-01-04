const express = require('express');
const router = express.Router();
const {mongoose} = require('mongoose');
const adminController = require('../controllers/adminController');
const GenreController = require('../controllers/GenreController');
const AdminUserController = require('../controllers/AdminUserController');
const bookController=require('../controllers/bookController');
const { userAuth, adminAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Admin Login Routes
router.get('/login', adminController.loadLogin);  // Display the login page
router.post('/login', adminController.login);  
router.get('/logout',adminController.adminLogout)// Handle login form submission

// Admin Dashboard Route
router.get('/', adminAuth, adminController.loadDashboard);  // Load the admin dashboard, after admin is authenticated

// Genre Management
  // Create a genre, requiring admin authentication

// User Management
router.get('/usermanage',adminAuth,AdminUserController.customerInfo);
router.get('/updateuser/:id',AdminUserController.updateUser);  // Get list of all users, requiring admin authentication
router.get('/blockCustomer',AdminUserController.blockUser);
router.get('/unblockCustomer',AdminUserController.unblockUser);
//Genre management
router.get('/genre', adminAuth, GenreController.genreInfo);  // Get list of all genres
router.post('/genre',GenreController.addGenre);
router.post('/addCategoryOffer',adminAuth,GenreController.addCategoryOffer);
router.post('/removeCategoryOffer',adminAuth,GenreController.removeCategoryInfo);
router.get('/listCategory',adminAuth,GenreController.listCategory);
router.get('/unlistCategory',adminAuth,GenreController.unlistCategory);
router.get('/pageerror',GenreController.pageerror);
router.get('/updateGenre', GenreController.getEditCategory);

router.post('/updateGenre/:id',adminAuth,GenreController.editCategory);
router.get('/deleteGenre/:id',adminAuth,GenreController.deleteCategory);
router.post('/deleteGenres/:id',adminAuth,GenreController.deleteCategory);
router.post('/admin/genre/:id',GenreController.toggleGenreStatus)

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







module.exports = router;














