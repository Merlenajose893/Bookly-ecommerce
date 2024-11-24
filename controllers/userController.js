const loadHomePage=async(req,res)=>
{
    try {
        return res.render('users/home');
    } catch (error) {
        console.log('Home page is not find');
        res.status(500).send('Server Error');
    }
}
const loadLogin=async(req,res)=>
{
    try {
        res.render('login');
    } catch (error) {
        console.log('Error loading login page');
        res.status(500).send('Internal Server is failed');
        
        
    }
}
const loadCheckOut=async (req,res) => {
    try {
        res.render('checkout')
    } catch (error) {
        console.log('CheckOut page is not found');
        res.status(500).send('Server Error');
    }
    
}
const loadContact=async (req,res) => {
    try {
        res.render('contact')
    } catch (error) {
        console.log('Error to load contact page');
        res.status(500).send('Server error');
        
    }
    
}
module.exports={loadHomePage,loadLogin,loadCheckOut,loadContact}