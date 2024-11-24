const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');


router.get('/',userController.loadHomePage);
router.get('/login',userController.loadLogin);
router.get('/checkout',userController.loadCheckOut)
router.get('/contact',userController.loadContact)

module.exports=router;