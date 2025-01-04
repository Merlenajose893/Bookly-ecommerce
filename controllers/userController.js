const {User} = require('../models/userSchema');
const {Book}=require('../models/bookSchema');
const{Genre}=require('../models/GenresSchema')
const OTP=require('../models/otpSchema');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const loadHomePage = async (req, res) => {
    try {
        return res.render('home');
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Server Error');
    }
}
const loadVerifyOtp=async(req,res)=>
{
    try {
        return res.render('verify');
    } catch (error) {
        console.error('Error loading verify otp',error);
        res.status(500).send('Server Error');
        
    }
}
const pageNotFound=async(req,res)=>
{
    try {
        res.render('pageerror');
    } catch (error) {
        res.redirect('/pageerror');
    }
}
const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.error('Error loading login page:', error);
        res.status(500).send('Internal Server Error');
    }
}
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body);

        // Find the user by email and check if they are an admin
        const findUser = await User.findOne({ isAdmin: false, email: email });

        if (!findUser) {
            return res.render('login', { message: 'User not found' });
        }

        if (findUser.isBlocked) {
            // If the user is blocked, destroy their session and log them out
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(500).send('Internal Server Error');
                }
                return res.render('login', { message: 'Your account is blocked by the admin' });
            });
        } else {
            const passwordMatch = await bcrypt.compare(password, findUser.password);

            if (!passwordMatch) {
                return res.render('login', { message: 'Incorrect Password' });
            }

            // Store user ID in session after successful login
            req.session.user = findUser._id;
            res.redirect('/');
        }
    } catch (error) {
        console.error('Login error', error);
        res.render('login', { message: 'Login failed' });
    }
};



const loadSignUp = async (req, res) => {
    try {
        res.render('signup');
    } catch (error) {
        console.error('Error loading signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
       
           
            
        });
        console.log(process.env.NODEMAILER_EMAIL);
        

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your email',
            text: `Your OTP is ${otp}`,
            html: `<p>Your OTP is ${otp}</p>`
        });

        return info.accepted.length > 0;
        if (info.accepted.length > 0) {
            console.log("OTP Sent Successfully to:", email);
            return true;
        } else {
            console.error("Failed to send OTP to:", email);
            return false;
        }
    } catch (error) {
        console.error("Error Sending Email:", error);
        return false;
    }
}
const signup = async (req, res) => {
    try {
        const { name, email, password, cpassword } = req.body;
        console.log(req.body);
        

        // Validate input fields
        if (!name || !email || !password || !cpassword) {
            return res.render('signup', { message: "All fields are required." });
        }

        // Check if passwords match
        if (password !== cpassword) {
            return res.render('signup', { message: "Passwords don't match each other" });
        }

        // Log the received data for debugging
        console.log("Received Name:", name);
        console.log("Received Email:", email);
        console.log("Received Password:", password);
        console.log("Received Confirm Password:", cpassword);

        // Check if the email already exists
        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render('signup', { message: "Email is already taken" });
        }

        // Generate OTP and send it to the user
        const otp = generateOtp();
        console.log(otp);
        

        // Assume sendVerificationEmail sends the OTP to the email and returns true/false
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json({ success: false, message: 'Email sending failed' });
        }

        // Store OTP and user data in session
        req.session.userOtp = otp;
        req.session.userData = { name, email, password };
        
        console.log("Session:",req.session.userData);
        
        console.log('OTP Sent:', otp);
        console.log('Session OTP:', req.session.userOtp);

        // Render the OTP verification page
        res.render('verify');
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).send('Internal Server Error');
    }
};









const resendOtp = async (req, res) => {
    try {
        
        console.log("SessionData:",req.session.userData);
        
        const { email } = req.session.userData;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        const otp = generateOtp();
        console.log(otp);

        req.session.userOtp = otp;
        console.log(req.session.userOtp);

        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp);
            return res.redirect('/verify');
        } else {
            return res.status(500).json({ success: false, message: "Failed to resend OTP, please try again" });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        return res.status(500).json({ success: false, message: "Internal Server Error, please try again" });
    }
};





const loadCheckOut = async (req, res) => {
    try {
        res.render('checkout');
    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send('Server Error');
    }
}

const loadContact = async (req, res) => {
    try {
        res.render('contact');
    } catch (error) {
        console.error('Error loading contact page:', error);
        res.status(500).send('Server Error');
    }
} // Adjust the path based on your project structure

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log(otp);
        
        

        // Check if OTP is provided and matches the session OTP
        if (!otp || otp !== req.session.userOtp) {
            // Log the failed OTP verification attempt
            await OTP.create({
                email: req.session.userData?.email || 'Unknown',
                otp,
            });

            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Check if user data exists in the session
        const userData = req.session.userData;
        if (!userData) {
            // Log the failed OTP verification attempt due to missing session data
            await OTP.create({
                email: 'Unknown',
                otp,
            });

            return res.status(400).json({ success: false, message: 'Session expired. Please register again.' });
        }

        // Hash the user's password before saving it to the database
        const passwordHash = await bcrypt.hash(userData.password, 10);

        // Create a new user object with the session data
        const newUser = new User({
            name: userData.name,
            email: userData.email,
            password: passwordHash,
            cpassword: passwordHash,
             // Store hashed password for confirmation field if needed
        });

        // Save the new user to the database
        const savedUser = await newUser.save();
        console.log('User registered successfully:', savedUser);

        // Clear the session data after successful OTP verification and user registration
        req.session.userOtp = null;
        req.session.userData = null;

        // Respond with success and the redirect URL
        return res.status(200).json({ success: true, redirectUrl: '/' });
    } catch (error) {
        console.error('Error during OTP verification:', error);

        // Respond with a proper error message
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const loadShop = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Get the current page (default to 1 if not provided)
      const itemsPerPage = 10; // Number of books to show per page
  
      // Count the total number of books that are not deleted
      const totalItems = await Book.countDocuments({ isDeleted: false });
  
      // Calculate the total number of pages
      const totalPages = Math.ceil(totalItems / itemsPerPage);
  
      // Fetch the books for the current page with pagination
      const books = await Book.find({ isDeleted: false })
                              .skip((page - 1) * itemsPerPage)  // Skip books from previous pages
                              .limit(itemsPerPage);  // Limit the number of books per page
  
      // Render the 'shop' view and pass the books and pagination data to the template
      return res.render('shop', {
        books,
        currentPage: page,
        totalPages: totalPages,
        message: 'Shop is rendered successfully'
      });
  
    } catch (error) {
      console.error('Error during shop load:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  
  
const getBooksById = async (req, res) => {
    try {
        const bookId = req.params.id;
        console.log("Received Book ID:", bookId);

        // Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: "Invalid Book ID format" });
        }

        // Find the book by its ID
        const book = await Book.findById(bookId); // Using findById for simplicity
        console.log("Found Book:", book);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Render the details page with the book data
        return res.render('details', { book });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const logout = (req, res) => {
    // If using Passport
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out", error: err });
        }
        
        // Destroy session manually (if not using Passport)
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: "Error destroying session", error: err });
            }

            // Redirect to login page or homepage after logging out
            res.redirect('/login'); // Or '/home'
        });
    });
};


const loadBookDetails = async (req, res) => {
    try {
      const bookId = req.params.id; // Get the book ID from the URL parameters
      const book = await Book.findById(bookId); // Fetch the book from the database using the ID
  
      if (!book) {
        return res.status(404).send('Book not found');
      }
  
      // Render the 'details' view and pass the book data to the template
      return res.render('details', {
        book, 
        // Pass the book object to the view
      });
  
    } catch (error) {
      console.error('Error loading book details:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  

  const loadFiction = async (req, res) => {
    try {
      // Get the genre ID from the route parameter
      const genreId = req.params.genreId;  
      console.log('Genre ID:', genreId); // Log to check if the parameter is passed
  
      // Fetch the category details
      const category = await Genre.findById(genreId);
      console.log('Category:', category); // Log the result
  
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Fetch all books that belong to the category
      const books = await Book.find({ categories: genreId });
  
      // Render the page with books based on the category
      res.render('fiction', {
        books: books,
        category: category,
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  









module.exports = { loadHomePage, loadLogin, loadCheckOut, loadContact, loadSignUp, signup, verifyOtp, resendOtp,login,loadShop,getBooksById,pageNotFound,logout,loadBookDetails,loadFiction,loadVerifyOtp};
