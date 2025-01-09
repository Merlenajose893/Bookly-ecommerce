const mongoose=require('mongoose')
const {User}=require('../models/userSchema');
const {Address}=require('../models/addressSchema');
const loaddashboard = async (req, res) => {
    try {
        const userId = req.session.user;  // Match the key from login function
        if (!userId) {
            console.log("No userId found in session");
            return res.status(400).json({ message: "User not logged in" });
        }

        console.log("Attempting to find user with ID:", userId);

        const user = await User.findById(userId);

        if (!user) {
            console.log("User not found with ID:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        res.render('profiledashboard', { user });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
};



const loadorder=async(req,res)=>
{
    try {
        res.render('profileorders');
    } catch (error) {
        console.error(error);
        
    }
}
const loadWallet=async(req,res)=>
{
    try {
        res.render('wallet');
    } catch (error) {
        console.error(error);
        
    }
}

const loadAddress=async(req,res)=>
{
    try {
        res.render('address');
        
    } catch (error) {
        console.error(error);
        
    }
}
const loadChangePassword=async(req,res)=>
{
    try {
        res.render('changepassword');
        
    } catch (error) {
        console.error(error);
        
    }
}
const addNewAddress=async(req,res)=>
{
try {
    const{}=req.body;
} catch (error) {
    
}
}
module.exports={loaddashboard,loadorder,loadWallet,loadAddress,loadChangePassword,addNewAddress}