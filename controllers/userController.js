const { User } = require('../models/userSchema');
const { Book } = require('../models/bookSchema');
const { Genre } = require('../models/GenresSchema');
const { Cart } = require('../models/cartSchema');
const {Offer}=require('../models/offerSchema')
const Address = require('../models/addressSchema');
const OTP = require('../models/otpSchema');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto=require('crypto')
const path = require('path');
const { log } = require('util');
const orderSchema = require('../models/orderSchema.js');
const {razorpay}=require('../utils/razorpay.js');
const Order = require('../models/orderSchema.js');
const Coupon=require('../models/couponSchema')

const loadHomePage = async (req, res) => {
  try {
    let message = req.session.message || null;
    req.session.message = null;

    const userId = req.session.user;
    console.log('ID', userId);

    const userLogged = await User.findById(userId);
    console.log(userLogged, 'User Data');
    
    const searchQuery = req.query.search || '';
    // const genreQuery=req.query.search||'';
    let searchCondition = { isDeleted: false };

    console.log('Search Condition:', searchCondition);
    
    if (searchQuery) {
      searchCondition.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { publisher: { $regex: searchQuery, $options: 'i' } }
      ];
    }
//     if(genreQuery){
//       searchCondition.genres=genreQuery
//     }
// console.log(genreQuery);

    const genres = await Genre.find();
    
    const books = await Book.find(); 
    const bookResults = await Book.find(searchCondition).populate("genres");

    console.log('Book Results:', bookResults);

    // 🔥 Redirect if only one book is found
    if (bookResults.length === 1) {
      return res.redirect(`/book/${bookResults[0]._id}`);
    }

    // Render the home page if multiple books are found or no results
    return res.render('home', {
      genres,
      books,
      session: req.session,
      message,
      isAuthenticated: !!userId,
      userLogged,
      book: bookResults, // Pass search results
      searchQuery,
      // genreQuery
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).send('Server Error');
  }
};


const loadAccountBan = async (req, res) => {
  try {
    res.render('accountban');
  } catch (error) {
    console.error(error);
  }
};
const loadVerifyOtp = async (req, res) => {
  try {
    return res.render('verify');
  } catch (error) {
    console.error('Error loading verify otp', error);
    res.status(500).send('Server Error');
  }
};

const pageNotFound = async (req, res) => {
  try {
    res.render('pageerror');
  } catch (error) {
    res.redirect('/pageerror');
  }
};
const loadLogin = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect('/');
    } else {
      res.render('login');
    }
  } catch (error) {
    console.error('Error loading login page:', error);
    res.status(500).send('Internal Server Error');
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);

    // Find the user by email and check if they are an admin
    const findUser = await User.findOne({ isAdmin: false, email: email });
    console.log(findUser);

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
        return res.render('login', {
          message: 'Your account is blocked by the admin',
          user: findUser,
        });
      });
    } else {
      const passwordMatch = await bcrypt.compare(password, findUser.password);

      if (!passwordMatch) {
        return res.render('login', { message: 'Incorrect Password' });
      }

      // Store user ID in session after successful login
      req.session.user = findUser._id;

      console.log(findUser._id, 'FIND');

      req.session.isAuthenticated = true;
      console.log(req.session.isAuthenticated);

      console.log('Id', req.session.user);

      return res.redirect('/');
    }
  } catch (error) {
    console.error('Login error', error);
    res.render('login', { message: 'Login failed' });
  }
};

const loadSignUp = async (req, res) => {
  try {
    let message = '';
    res.render('signup', { message });
  } catch (error) {
    console.error('Error loading signup page:', error);
    res.status(500).send('Internal Server Error');
  }
};

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
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    console.log(process.env.NODEMAILER_EMAIL);

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Verify your email',
      text: `Your OTP is ${otp}`,
      html: `<p>Your OTP is ${otp}</p>`,
    });

    return info.accepted.length > 0;
    if (info.accepted.length > 0) {
      console.log('OTP Sent Successfully to:', email);
      return true;
    } else {
      console.error('Failed to send OTP to:', email);
      return false;
    }
  } catch (error) {
    console.error('Error Sending Email:', error);
    return false;
  }
}
const loadForgetPassword = async (req, res) => {
  try {
    res.render('forget-password');
  } catch (error) {
    console.error(error);
  }
};
const viewOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    console.log(userId, 'ghjkl');
    console.log(user, 'ghjklvcx');

    const orderId = req.params.orderId;
    const order = await orderSchema
      .findOne({ _id: orderId, user: userId })
      .populate('user')
      .populate('books.productId')
    console.log('Order', order);
    // console.log('Coupon',order);
    
    console.log('OrderId', orderId);

    if (!order) {
      return res.status(400).json({ message: 'No order is found' });
    }
    res.render('vieworders', { order });
  } catch (error) {
    console.error('Error viewing the Order', error);
    res.status(500).send('Internal Server Error');
  }
};
const signup = async (req, res) => {
  try {
    const { name, email, password, cpassword } = req.body;
    console.log(req.body);
    req.session.userData = { name, email, password };
    console.log(req.session.userData);

    // Validate input fields
    if (!name || !email || !password || !cpassword) {
      return res.render('signup', { message: 'All fields are required.' });
    }

    // Check if passwords match
    if (password !== cpassword) {
      return res.render('signup', { message: "Passwords don't match each other" });
    }

    // Log the received data for debugging
    console.log('Received Name:', name);
    console.log('Received Email:', email);
    console.log('Received Password:', password);
    console.log('Received Confirm Password:', cpassword);

    // Check if the email already exists
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render('signup', { message: 'Email is already taken' });
    }

    // Generate OTP and send it to the user
    const otp = generateOtp();
    console.log(otp);

    // Store OTP in the database with expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1); // OTP expires in 10 minutes

    const otpRecord = new OTP({
      email,
      otp,
      expiresAt,
    });

    await otpRecord.save();
    console.log('OTP saved in database:', otp);

    // Send OTP to the email
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json({ success: false, message: 'Email sending failed' });
    }

    // Store OTP in session (optional, for immediate verification)
    // req.session.userOtp = otp;
    // console.log("Session OTP:", req.session.userOtp);

    // Render the OTP verification page
    res.render('verify', { message: '' }); // Ensure message is defined here too
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const resendOtp = async (req, res) => {
  try {
    console.log('==================');
    console.log(req.session.userData); // Check the session data

    const { email } = req.session.userData || {}; // Extract email
    console.log(email); // Log email to verify it's being extracted correctly

    if (!email) {
      return res.status(400).json({ success: false, message: 'Invalid Email' });
    }

    // Generate and send OTP
    const otp = generateOtp();
    console.log('Generated OTP:', otp);

    // Remove any existing OTP for the email
    await OTP.findOneAndDelete({ email });

    // Store new OTP in the database with a createdAt timestamp
    const storedOtp = await OTP.create({
      email,
      otp,
      createdAt: new Date(), // Ensure this field exists in the schema
    });

    const otpExpirationTime = Date.now() + 60000; // 1 minute in milliseconds (60,000 ms)

    // Send the OTP via email
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to send OTP. Try again later.' });
    }

    // Store OTP and expiration time in the session
    req.session.userOtp = otp;
    req.session.otpExpiration = otpExpirationTime;

    console.log('Session Data:', req.session.userData);
    console.log('OTP Sent:', otp);
    console.log('OTP Expiration Time Stored:', otpExpirationTime);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. It will expire in 1 minute.',
    });
  } catch (error) {
    console.error('Error during OTP resend:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const loadCheckOut = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("User ID:", userId);

    if (!userId) {
      console.log("User not logged in, redirecting to login page.");
      return res.redirect('/login');
    }

    // Get the address document
    const addressDoc = await Address.findOne({ userId: userId });
    console.log("User Address Document:", addressDoc);

    const userAddress = addressDoc ? addressDoc.address : [];
    console.log("User Address:", userAddress);

    // Fetch cart with populated product details
    const cart = await Cart.findOne({ userId }).populate('items.productId').populate('couponId');
    console.log("Cart Data:", cart);

    if (!cart || !cart.items || cart.items.length === 0) {
      console.log("Cart is empty, rendering empty cart message.");
      return res.render('checkout', {
        message: 'Your cart is empty',
        userAddress,
        items: [],
        subtotal: 0,
        total: 50, // Default shipping fee
        cartId: cart?._id, // Optional chaining to prevent errors
      });
    }

    // Calculate subtotal
    let originalSubtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    console.log("Original Subtotal before Discount:", originalSubtotal);

    let discountAmount = cart.discountAmount || 0;
    console.log("Discount Amount Applied:", discountAmount);

    // Update subtotal after applying the discount
    let subtotal = originalSubtotal - discountAmount;
    console.log("Updated Subtotal after Discount:", subtotal);

    let shippingPrice = 50; // Default shipping fee
    console.log("Shipping Price:", shippingPrice);

    let total = subtotal + shippingPrice;
    console.log("Final Total after Discount and Shipping:", total);

    // Updated cartData
    const cartData = {
      items: cart.items,
      subtotal,
      discountAmount,
      delivery: shippingPrice,
      total,
    };

    console.log("Final Cart Data to Render:", cartData);

    res.render('checkout', {
      cart: cartData,
      cartId: cart._id,
      subtotal,
      discountAmount,
      total,
      items: cart.items,
      userAddress,
      message: 'Successfully entered the cart',
    });
  } catch (error) {
    console.error('Error loading Checkout page:', error);
    res.status(500).send('Internal Server Error');
  }
};


const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { addressId, paymentMethod } = req.body;

    console.log("User ID:", userId);
    console.log("Address ID:", addressId);
    console.log("Payment Method:", paymentMethod);

    if (!userId) {
      console.log("User not logged in. Redirecting to login.");
      return res.redirect('/login');
    }

    if (!addressId) {
      console.log("No address selected.");
      return res.json({
        success: false,
        message: 'Please select an address',
      });
    }

    if (paymentMethod === 'razorpay') {
      return createRazorOrder(req, res);
    }

    // Fetch cart with populated product details
    const cart = await Cart.findOne({ userId: userId }).populate({
      path: 'items.productId',
      select: 'salesPrice title quantity stock',
    });

    console.log("Cart Data:", cart);

    if (!cart || cart.items.length === 0) {
      console.log("Cart is empty.");
      return res.json({
        success: false,
        message: 'Your cart is empty',
      });
    }

    let books = [];
    let totalAmount = 0;
    let discountAmount = cart.discountAmount || 0; // Ensure discount is fetched properly

    console.log("Discount Amount:", discountAmount);

    // Calculate total amount (before discount)
    cart.items.forEach((item) => {
      const productPrice = item.productId?.salesPrice || 0;
      const quantity = item.quantity || 1;
      const itemTotal = productPrice * quantity;

      books.push({
        productId: item.productId?._id || item.productId,
        quantity: quantity,
        price: productPrice,
      });

      totalAmount += itemTotal;

      console.log(
        `Product: ${item.productId?.title}, Price: ${productPrice}, Quantity: ${quantity}, Item Total: ${itemTotal}`
      );
    });

    console.log("Total Before Discount:", totalAmount);

    // Apply discount correctly
    let subtotal = Math.max(0, totalAmount - discountAmount);
    console.log("Subtotal After Discount:", subtotal);

    // Define shipping cost
    const shippingCost = 50;
    console.log("Shipping Cost:", shippingCost);

    // Final total including shipping
    const finalTotalAmount = subtotal + shippingCost;
    console.log("Final Total Amount:", finalTotalAmount);
if(paymentMethod==='cod' && finalTotalAmount>1000){
  return res.json({
    success: false,
    message: 'COD payment is not available for orders above 1000',
  })
}
    // Fetch user address
    const userAddress = await Address.findOne({
      userId: userId,
      'address._id': addressId,
    });

    if (!userAddress) {
      console.log("Invalid Address");
      return res.json({
        success: false,
        message: 'Invalid address',
      });
    }

    // Find selected address object
    const selectedAddress = userAddress.address.find((addr) => addr._id.toString() === addressId);

    // Generate unique order ID
    const generateOrderId = () => {
      return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    };

    // Create the order
    const newOrder = await orderSchema.create({
      orderId: generateOrderId(),
      user: userId,
      addressId: userAddress._id,
      shippingAddress: {
        name: selectedAddress.name,
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phone,
      },
      books: books,
      totalAmount: subtotal, // Corrected subtotal after discount
      price: finalTotalAmount, // Final amount with shipping
      discountAmount: discountAmount,
      shippingCost: shippingCost,
      status: 'Pending',
      paymentMethod: paymentMethod,
    });

    console.log("New Order Created:", newOrder);

    // Update product stock
    for (const item of books) {
      const product = await Book.findById(item.productId);
      if (product) {
        const updatedStock = Math.max(0, product.stock - item.quantity);
        await Book.findByIdAndUpdate(item.productId, {
          $set: { stock: updatedStock },
        });
        console.log(`Updated stock for ${product.title}: ${updatedStock}`);
      }
    }

    // Clear the cart after placing the order
    await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [], discountAmount: 0 } });

    // Send response with updated total
    res.json({
      success: true,
      orderId: newOrder._id,
      message: 'Order placed Successfully',
      order: {
        ...newOrder.toObject(),
        totalAmount: finalTotalAmount, // Ensures correct final total
        discountAmount: discountAmount
      },
    });
  } catch (error) {
    console.error('Error Placing the Order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};



const loadContact = async (req, res) => {
  try {
    res.render('contact');
  } catch (error) {
    console.error('Error loading contact page:', error);
    res.status(500).send('Server Error');
  }
}; // Adjust the path based on your project structure

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log('Received OTP:', otp);

    const userData = req.session.userData;
    const userEmail = userData?.email;

    console.log(userEmail, 'userEmail');

    const otpData = await OTP.findOne({ email: userEmail });

    // Check if OTP exists
    if (!otpData) {
      console.log('OTP expired or not found');
      return res.status(400).json({
        success: false,
        error: 'OTP_EXPIRED',
        message: 'OTP expired. Please request a new one.',
      });
    }

    // Explicitly check if the OTP has expired based on createdAt
    const currentTime = new Date();
    const otpCreatedAt = new Date(otpData.createdAt);
    const expirationTime = 60 * 1000; // 60 seconds in milliseconds

    if (currentTime - otpCreatedAt > expirationTime) {
      console.log('OTP has expired');
      await OTP.findOneAndDelete({ email: userEmail });
      return res.status(400).json({
        success: false,
        error: 'OTP_EXPIRED',
        message: 'OTP expired. Please request a new one.',
      });
    }

    const actualOtp = otpData.otp;
    console.log(actualOtp, 'actual OTP');

    if (!otp || otp !== actualOtp) {
      console.log('OTP mismatch or OTP not provided');
      return res.status(400).json({ success: false, error: 'INVALID_OTP', message: 'Invalid OTP' });
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    const newUser = new User({
      name: userData.name,
      email: userData.email,
      password: passwordHash,
      cpassword: passwordHash,
    });

    const savedUser = await newUser.save();
    console.log('User registered successfully:', savedUser);

    req.session.userOtp = null;
    req.session.userData = null;
    req.session.otpTimestamp = null;

    await OTP.findOneAndDelete({ email: userEmail });

    res.status(200).json({ success: true, message: 'OTP Verified', redirectUrl: '/' });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const loadOrder = async (req, res) => {
  try {
    const { orderId } = req.params; // Extract orderId from params
    console.log('OrderID from params:', orderId);

    if (!orderId) {
      return res.status(400).send('Order ID is required.');
    }

    const order = await orderSchema.findById(orderId).populate('user').populate('books.productId');
    console.log('Order:', order);

    if (!order) {
      return res.status(400).json({ message: 'No order found' });
    }
    // Example of the order number
    res.render('thankyoupage', { order });
  } catch (error) {
    console.error('Error loading the Order:', error);
    res.status(500).send('Internal Server Error');
  }
};
const loadShop = async (req, res) => {
  try {
    console.log("Received request for shop with query:", req.query);

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;
    const currentDate = new Date();
    let filter = { isDeleted: false };

    // Handle search query
    if (req.query.search) {
      const searchQuery = req.query.search.trim();
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
      ];
      console.log("Search filter applied:", filter.$or);
    }

    // Handle genres filter
    let selectedGenres = [];
    if (req.query.genres) {
      selectedGenres = Array.isArray(req.query.genres)
        ? req.query.genres
        : req.query.genres.split(',');
      console.log("Selected genres:", selectedGenres);
    }

    if (selectedGenres.length > 0) {
      const genreDocs = await Genre.find({ name: { $in: selectedGenres } }).select('_id');
      const genreIds = genreDocs.map((genre) => genre._id);
      console.log("Genre IDs found:", genreIds);

      if (genreIds.length > 0) {
        filter.genres = { $in: genreIds };
      }
    }

    // Sort options
    const sortOptions = {
      'popularity': { salesCount: -1 },
      'price-low': { salesPrice: 1 },
      'price-high': { salesPrice: -1 },
      'rating': { averageRating: -1 },
      'new': { createdAt: -1 },
      'name-asc': { title: 1 },
      'name-desc': { title: -1 }
    };

    const sortOption = sortOptions[req.query.sort] || { createdAt: -1 };
    console.log("Sorting option selected:", sortOption);

    // Get paginated books
    const totalItems = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log(`Total books found: ${totalItems}, Total pages: ${totalPages}`);

    let books = await Book.find(filter)
      .populate('genres')
      .populate('offerId')
      .sort(sortOption)
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);
    console.log("Books fetched from DB:", books.length);

    // Process offers for each book
    books = await Promise.all(books.map(async (book) => {
      let finalPrice = book.salesPrice || book.regularPrice;
      let appliedOffer = null;

      console.log(`Processing book: ${book.title}, Regular price: ${book.regularPrice}, Sales price: ${book.salesPrice}`);

      // Check product-specific offer
      if (book.offerId && book.offerId.isActive && book.offerId.endDate >= currentDate) {
        appliedOffer = book.offerId;
        console.log(`Applied product offer: ${appliedOffer.discountType} - ${appliedOffer.discountValue}`);
      } else {
        // Check category offers
        const categoryOffer = await Offer.findOne({
          category: { $in: book.genres },
          isActive: true,
          endDate: { $gte: currentDate }
        }).sort({ discountValue: -1 }).limit(1);

        if (categoryOffer) {
          appliedOffer = categoryOffer;
          console.log(`Applied category offer: ${appliedOffer.discountType} - ${appliedOffer.discountValue}`);
        }
      }

      // Apply discount if offer exists
      if (appliedOffer) {
        if (appliedOffer.discountType === 'percentage') {
          finalPrice = finalPrice - (finalPrice * appliedOffer.discountValue / 100);
          
        } else {
          finalPrice = finalPrice - appliedOffer.discountValue;
        }
        finalPrice = Math.max(finalPrice, 0);
        console.log('Fin',finalPrice);
      }

      console.log(`Final price after discount: ${finalPrice}`);
book.salesPrice=finalPrice;
console.log('Sales',book.salesPrice);

      // Create new object to avoid modifying original document
      return {
        ...book.toObject(),
        finalPrice: finalPrice.toFixed(2),
        appliedOffer
      };
    }));

    // Fetch all genres and active offers
    const [genres, offers] = await Promise.all([
      Genre.find({ isDeleted: false }),
      Offer.find({ isActive: true, endDate: { $gte: currentDate } })
    ]);

    console.log("Genres fetched:", genres.length);
    console.log("Active offers fetched:", offers.length);

    res.render('shop', {
      books,
      genres,
      offers,
      currentPage: page,
      totalPages,
      searchQuery: req.query.search || '',
      selectedGenres,
      message: 'Shop rendered successfully'
    });

  } catch (error) {
    console.error('Error during shop load:', error);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
};


const getBooksById = async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log('Received Book ID:', bookId);

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: 'Invalid Book ID format' });
    }

    // Find the book by its ID
    const book = await Book.findById(bookId); // Using findById for simplicity
    console.log('Found Book:', book);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Render the details page with the book data
    return res.render('details', { book });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const logout = (req, res) => {
  // If using Passport
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err });
    }

    // Destroy session manually (if not using Passport)
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error destroying session', error: err });
      }

      // Redirect to login page or homepage after logging out
      res.redirect('/login'); // Or '/home'
    });
  });
};

const loadBookDetails = async (req, res) => {
  try {
    console.log('Request received for book details.');

    const user = req.user;
    if (user && user.isBlocked) {
      console.log('User is blocked:', user._id);
      return res
        .status(403)
        .send('<h1 style="background-color:red; color:white;">Access Denied: Your account is blocked.</h1>');
    }

    const { id: bookId } = req.params;
    console.log('Requested Book ID:', bookId);

    // Validate Book ID format (MongoDB ObjectId)
    if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid Book ID format.');
      return res.status(400).json({ success: false, message: 'Invalid book ID format' });
    }

    // Fetch book details
    const book = await Book.findById(bookId).populate('genres', 'name').populate('offerId');

    // Ensure `book` exists before accessing `offerId`
    if (!book || book.isDeleted) {
      console.log('Book not found or deleted.');
      return res.render('productban'); // or return a 404 JSON response
    }

    // Check if `offerId` exists before accessing it
    console.log('Book Offer ID:', book.offerId ? book.offerId : 'No Offer Found');

    const currentDate = new Date();
    console.log('Current Date:', currentDate);

    // Fetch Product-Specific Offer
    const productOffer = await Offer.findOne({
      product: bookId,
      isActive: true,
      endDate: { $gte: currentDate },
    });

    console.log('Product Offer:', productOffer || 'No product offer');

    // Fetch Category-Based Offer (if no product-specific offer exists)
    let categoryOffer = null;
    if (!productOffer) {
      categoryOffer = await Offer.findOne({
        category: { $in: book.genres },
        isActive: true,
        endDate: { $gte: currentDate },
      });
    }

    console.log('Category Offer:', categoryOffer || 'No category offer');

    const genres = await Genre.find({ isListed: true });
    console.log('Available Genres:', genres);

    // Apply Discount Logic
    let finalPrice = book.regularPrice;
    let appliedOffer = productOffer || categoryOffer || null;

    console.log('Applied Offer:', appliedOffer || 'No applied offer');

    if (appliedOffer) {
      if (appliedOffer.discountType === 'Percentage') {
        finalPrice -= (book.regularPrice * appliedOffer.discountValue) / 100;
      } else {
        finalPrice -= appliedOffer.discountValue;
      }
    }

    finalPrice = Math.max(finalPrice, 0); // Ensure price is not negative
    book.salesPrice = finalPrice;

    console.log('Final Sales Price:', book.salesPrice);

    // Fetch Related Books
    const relatedBooks = await Book.find({
      genres: { $in: book.genres },
      _id: { $ne: bookId },
      isDeleted: false,
    }).limit(4);

    console.log('Related Books:', relatedBooks);

    // Prepare `offers` array for rendering
    const offers = [];
    if (productOffer) offers.push(productOffer);
    if (categoryOffer) offers.push(categoryOffer);

    console.log('Offers Available:', offers);

    // Render the 'details' view
    return res.render('details', {
      book,
      appliedOffer,
      relatedBooks,
      genres,
      offers,
    });
  } catch (error) {
    console.error('Error loading book details:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};





const loadFiction = async (req, res) => {
  try {
    const books = await Book.find();

    // Render the page with books based on the category
    res.render('fiction', {
      books,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.find({ isListed: false, isDeleted: false });
    if (!genres.length) {
      console.log('No genres found.');
      return res.render('home', { genres: [] }); // Send an empty array to the view
    }
    console.log('Fetched Genres:', genres);
    res.render('home', { genres });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).send('Internal Server Error');
  }
};

const showGenre = async (req, res) => {
  try {
    const genreId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(genreId)) {
      return res.status(400).send('Invalid Genre ID');
    }

    const genre = await Genre.findById(genreId);
    if (!genre || genre.isDeleted) {
      return res.render('categoryban');
    }

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.page) || 1;
    const filter = { genres: genreId, 'genres.isDeleted': { $ne: true } };

    // Extract selected genres from the query parameters
    let selectedGenres = [];
    if (req.query.genres) {
      selectedGenres = Array.isArray(req.query.genres)
        ? req.query.genres
        : req.query.genres.split(',');
    }

    // Apply filtering based on genres
    if (selectedGenres.length > 0) {
      const genreDocs = await Genre.find({ name: { $in: selectedGenres } }).select('_id');
      const genreIds = genreDocs.map((g) => g._id);
      filter.genres = { $in: genreIds };
    }

    // Sorting options
    const sortOptions = {
      'popularity': { salesCount: -1 },
      'price-low': { salesPrice: 1 },
      'price-high': { salesPrice: -1 },
      'rating': { averageRating: -1 },
      'new': { createdAt: -1 },
      'name-asc': { title: 1 },
      'name-desc': { title: -1 }
    };
    const sortOption = sortOptions[req.query.sort] || { createdAt: -1 };

    // Get paginated books
    const totalBooks = await Book.countDocuments(filter);
    let books = await Book.find(filter)
      .populate('genres')
      .populate('offerId')
      .sort(sortOption)
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    // Process offers for books
    const currentDate = new Date();
    books = await Promise.all(books.map(async (book) => {
      let finalPrice = book.salesPrice || book.regularPrice;
      let appliedOffer = null;

      // Check for active product-specific offers
      if (book.offerId && book.offerId.isActive && book.offerId.endDate >= currentDate) {
        appliedOffer = book.offerId;
      } else {
        // Check for active category offers
        const categoryOffer = await Offer.findOne({
          category: { $in: book.genres },
          isActive: true,
          endDate: { $gte: currentDate }
        }).sort({ discountValue: -1 }).limit(1);

        if (categoryOffer) appliedOffer = categoryOffer;
      }

      // Apply discount
      if (appliedOffer) {
        finalPrice = appliedOffer.discountType === 'percentage'
          ? finalPrice - (finalPrice * appliedOffer.discountValue / 100)
          : finalPrice - appliedOffer.discountValue;
        finalPrice = Math.max(finalPrice, 0);
      }

      return {
        ...book.toObject(),
        finalPrice: finalPrice.toFixed(2),
        appliedOffer
      };
    }));

    // Fetch all genres
    const genres = await Genre.find({ isDeleted: false });

    res.render('genre', {
      genre,
      books,
      currentPage,
      totalPages: Math.ceil(totalBooks / itemsPerPage),
      genres,
      selectedGenres,  // Pass selectedGenres to the view
    });

  } catch (error) {
    console.error('Error in showGenre:', error);
    res.status(500).send('Server Error');
  }
};



const showBookDetails = async (req, res) => {
  try {
    const bookId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).send('Invalid Book ID');
    }
    const genres = await Genre.find();
    // Fetch the book and its categories (genres)
    const book = await Book.findById(bookId).populate('genres');
    if (!book) {
      return res.status(404).send('Book not found');
    }
    const relatedBook = await Book.find({
      genres: { $in: book.genres },
      _id: { $ne: bookId },
      isDeleted: false,
    }).limit(4);

    // Check if the book's categories contain any blocked genres
    const isCategoryBlocked = book.genres.some((genre) => genre.isDeleted === true);

    // If any category is blocked, don't allow the book to be displayed
    if (isCategoryBlocked) {
      return res.status(403).send('This book cannot be shown because its category is blocked');
    }

    // Fetch other books to display on the page
    const books = await Book.find().limit(6); // Adjust as needed for pagination or filters

    console.log('Book details:', book);

    // Render the book details page with both the single book and the list of books
    res.render('bookDetails', { book, books });
  } catch (error) {
    console.error('Error in showBookDetails:', error);
    res.status(500).send('Server Error');
  }
};

const getAllGenresWithBooks = async (req, res) => {
  try {
    const { genreId } = req.query; // Retrieve the genre ID from the query parameters (if provided).

    let booksByGenre;

    if (genreId) {
      // Fetch the specific genre
      const genre = await Genre.findOne({ _id: genreId, isListed: true, isDeleted: false });

      if (!genre) {
        return res.status(404).send('Genre not found');
      }

      // Fetch books for the selected genre
      const books = await Book.find({ genre: genre._id, isDeleted: false });

      booksByGenre = [{ genre, books }];
    } else {
      // Fetch all genres
      const genres = await Genre.find({ isListed: true, isDeleted: false });

      // Fetch all books
      const books = await Book.find({ isDeleted: false }).populate('genre'); // Assuming books have a 'genre' field.

      // Categorize books by genre
      booksByGenre = genres.map((genre) => {
        return {
          genre,
          books: books.filter((book) => book.genre && book.genre.equals(genre._id)),
        };
      });
    }

    // Render data to the home view
    res.render('fiction', { booksByGenre });
  } catch (error) {
    console.error('Error fetching genres or books:', error);
    res.status(500).send('Internal Server Error');
  }
};
const loadResetPassword = async (req, res) => {
  try {
    res.render('reset-password');
  } catch (error) {
    console.error(error);
  }
};
const loadVerifyEmail = async (req, res) => {
  try {
    res.render('verifyemail');
  } catch (error) {
    console.error(error);
  }
};
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    req.session.email = email;
    // console.log(email);

    const user = await User.findOne({ email });
    // console.log('User', user);

    if (!user) {
      res.render('forget-password', { message: 'User not found' });
    }

    const otp = generateOtp();
    console.log(otp);

    const otpExpiry = Date.now() + 60 * 1000;

    const isEmailSent = await sendVerificationEmail(email, otp);
    if (!isEmailSent) {
      res.render('forget-password', { message: 'Failed to Sent the verification email' });
      return;
    }

    // Use the upsert option here
    await OTP.findOneAndUpdate(
      { email }, // Find document by email
      { email, otp, otpExpiry }, // Update or insert these fields
      { upsert: true }, // If document doesn't exist, insert a new one
    );
    // console.log('Otp sent to database');

    res.redirect('/verifyemail');
  } catch (error) {
    console.error(error);
    // Handle error if necessary
  }
};
const resendotp = async (req, res) => {
  try {
    const email = req.session.email;
    if (!email) {
      return res.render('forget-password', { message: 'Provide a Email' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect('/login');
    }
    const otp = generateOtp();
    console.log('Otp', otp);
    const otpExpiry = Date.now() + 60 * 1000;
    console.log(otpExpiry);

    const isEmailSent = await sendVerificationEmail(email, otp);
    if (!isEmailSent) {
      return res.render('forget-password', { message: 'Failed to Sent the verification email' });
    }
    await OTP.findOneAndUpdate(
      {
        email,
      },
      { email, otp, otpExpiry },
      { upsert: true },
    );

    return res.redirect('/verifyemail');
  } catch (error) {
    console.error('Error resending the otp', error);
    res.status(500).send('Internal Server Error');
  }
};
const verifyPassword = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);

    const { email } = req.session;
    // console.log('The req.body from forgotpass:', req.body);
    // console.log(email,'pppp');

    const user = await User.findOne({ email });
    // console.log(user);
    // console.log(otp);

    if (!user) {
      res.render('verifyemail', { message: 'User not found' });
      return;
    }
    const actualOtp = await OTP.findOne({ email });
    // console.log(actualOtp);

    if (actualOtp.otp !== otp) {
      res.render('verifyemail', { message: 'Invalid Otp' });
      return;
    }
    if (user.otpExpiry < Date.now()) {
      res.render('verifyemail', { message: 'Otp expired' });
      return;
    }

    // Make sure you're passing `email` to the EJS view
    return res.render('reset-password', { email: email });
  } catch (error) {
    console.error(error);
    // Handle error if necessary
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log('reaching here');

    const email = req.session.email;
    console.log(email);

    if (!email) {
      return res.status(400).json({ message: 'User is not authorized' });
    }

    const { newPassword } = req.body;
    console.log('New', newPassword);

    // Hash the new password
    const newhashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('has', newhashedPassword);

    // Update the password for the user
    const updatedUser = await User.findOneAndUpdate(
      { email: email }, // Find user by ID
      { password: newhashedPassword }, // Update the password
      { new: true }, // Return the updated document
    );
    console.log('dfghjk', updatedUser);

    // Check if the user was found and updated
    if (!updatedUser) {
      return res.status(400).json({ message: 'User not found or password update failed' });
    }

    console.log('Updated:', updatedUser);

    // Redirect to the login page after password reset
    return res.redirect('/login');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
const createRazorOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log('Creating Razorpay order for user:', userId);

    if (!userId) {
      console.log('User not logged in. Redirecting to login.');
      return res.redirect('/login');
    }

    const { addressId } = req.body;
    console.log('Received addressId:', addressId);

    // Fetch user address
    const userAddress = await Address.findOne({ 'address._id': addressId, userId: userId });

    if (!userAddress) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const selectedAddress = userAddress.address.find((addr) => addr._id.toString() === addressId);
    console.log('Selected address:', selectedAddress);

    // Fetch cart details
    const cart = await Cart.findOne({ userId: userId })
  .populate('items.productId', 'salesPrice title quantity stock')
  .populate('couponId', 'name minimumPrice offerPrice');

console.log(cart.couponId);

    if (!cart || cart.items.length === 0) {
      console.log('Cart is empty');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    console.log('Cart details:', cart);

    // Calculate total amount
    let totalAmount = 0;
    cart.items.forEach((item) => {
      const productPrice = item.productId?.salesPrice || 0;
      const quantity = item.quantity || 1;
      totalAmount += productPrice * quantity;
    });
    let discount = 0;
    let couponCode = '';
    if (cart.couponId) {
      const coupon=cart.couponId;
      couponCode=coupon.name
      if (totalAmount >= coupon.minimumPrice) {
        discount = coupon.offerPrice;
        console.log(`Applied Coupon: ${couponCode}, Discount: ${discount}`);
      }
      else {
        console.log(`Coupon not applicable, minimum price required: ${coupon.minimumPrice}`);
      }
    }
    else {
      console.log('No coupon applied');
    }

    // const discount = cart.discountAmount || 0;
    const shippingCost = 50;
    const finalAmount = totalAmount - discount + shippingCost;
    

    console.log(`Total Amount: ${totalAmount}, Shipping Cost: ${shippingCost}, Final Amount: ${finalAmount}`);
    console.log('Discount',discount);
    

    // Razorpay Order options
    const options = {
      amount: finalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
      payment_capture: 1,
    };

    console.log('Creating Razorpay order with options:', options);

    // Create Razorpay order
    const order = await razorpay.orders.create(options);
    console.log('Razorpay Order Created:', order);
    if (!order || !order.id) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }


    // Generate custom order ID
    const generateOrderId = () => {
      return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    };
    console.log("Generated Razorpay Order ID:", order.id);
    // Save order to database
    const newOrder = new Order({
      orderId: generateOrderId(),
      user: userId,
      addressId: selectedAddress._id,
      shippingAddress: {
        name: selectedAddress.name,
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phone,
      },
      totalAmount: finalAmount,
      discountAmount:discount,
      books: cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.salesPrice,
      })),
      shippingCost,
      status: 'Payment Pending',  // Initial status
      paymentMethod: 'Online Payment',
      // razorpayOrderId: razorpayOrder.id, // Store Razorpay order ID
      razorpay: {
        orderId: order.id // ✅ Ensure this is assigned
      },
    });

    await newOrder.save(); // Save order

    // console.log('Order saved successfully in database');
    console.log('Order saved successfully in database:', newOrder);


    // Delete cart after successful order save
    // await Cart.findByIdAndDelete(cart._id);
    console.log('Cart deleted successfully');

    // Return response
    return res.json({
      success: true,
      order: newOrder,
      key: 'rzp_test_pxX6lfY1EAcvNw',
      amount: order.amount,
      addressId: addressId,
      order_id: order.id
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message,
    });
  }
};


  
// const verifyRazorPay = async (req, res) => {
//   try {
//     console.log("Request body:", req.body);
    
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId } = req.body;
//     // Fix: Extract order ID from nested object

//     const userId = req.session.user;

//     console.log("User ID from session:", userId);

//     if (!userId) {
//       console.log("User not logged in. Redirecting to login.");
//       return res.redirect('/login');
//     }
//     if (!razorpay_order_id) {
//       console.log("RazorPay order ID is missing.");
//       return res.status(400).json({ success: false, message: 'Missing order ID' });
//     }

//     const body = razorpay_order_id + '|' + razorpay_payment_id;
//     console.log('kk',body);
    
//     const expectedSignature = crypto.createHmac('sha256', 'DCEw5akaKfgceyWx4RONlTKu')
//       .update(body)
//       .digest('hex');

//     console.log("Expected Signature:", expectedSignature);
//     console.log("Received Signature:", razorpay_signature);

//     if (expectedSignature !== razorpay_signature) {
//       console.log("Invalid payment signature.");
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid payment signature',
//       });
//     }
//     const discountAmount = req.session.discountAmount || 0;
//     console.log("Discount amount:", discountAmount);
//     const existingOrder=await Order.findOne({'razorpay.orderId':razorpay_order_id});
//     if(!existingOrder){
//       return res.status(400).json({message:'Order is not found'});
//     }
//     existingOrder.status='Paid';
//     existingOrder.paymentId = razorpay_payment_id;
//     existingOrder.razorpay.signature = razorpay_signature;
//     existingOrder.save();

//     const cart = await Cart.findOne({ userId }).populate({
//       path: 'items.productId',
//       select: 'salesPrice title quantity stock',
//     });

//     console.log("Cart details:", cart);

//     if (!cart) {
//       console.log("Cart is empty.");
//       return res.status(400).json({ message: 'Cart is empty' });
//     }

//     const books = [];
//     let totalAmount = 0;

//     cart.items.forEach((item) => {
//       const productPrice = item.productId?.salesPrice || 0;
//       const quantity = item.quantity;
//       const amount = productPrice * quantity;

//       books.push({
//         productId: item.productId._id,
//         quantity: item.quantity,
//         price: productPrice,
//       });

//       totalAmount += amount;
//     });

//     console.log("Books in order:", books);
//     console.log("Total amount before discount:", totalAmount);
//     console.log("Discount amount:", discountAmount);

//     const shippingCost = 50;
//     const finalTotalAmount = Math.max(0, totalAmount - discountAmount);
//     const paymentAmount = finalTotalAmount + shippingCost;

//     console.log("Final total amount (after discount):", finalTotalAmount);
//     console.log("Total payment amount (including shipping):", paymentAmount);

//     const userAddress = await Address.findOne({ userId, 'address._id': addressId });
    
    
//     console.log("User address:", userAddress);

//     if (!userAddress) {
//       console.log("Invalid address.");
//       return res.status(400).json({ message: 'Invalid address' });
//     }

//     const selectedAddress = userAddress.address.find((addr) => addr._id.toString() === addressId);

//     console.log("Selected shipping address:", selectedAddress);

//     const generateOrderId = () => {
//       return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
//     };

//     const orderId = generateOrderId();
//     console.log("Generated Order ID:", orderId);

//     const newOrder = await Order.create({
//       orderId,
//       user: userId,
//       addressId: userAddress._id,
//       shippingAddress: {
//         name: selectedAddress.name,
//         address: selectedAddress.address,
//         city: selectedAddress.city,
//         state: selectedAddress.state,
//         pincode: selectedAddress.pincode,
//         phone: selectedAddress.phone,
//       },
//       books,
//       totalAmount: finalTotalAmount, 
//       price: paymentAmount,
//       shippingCost,
//       status: 'Paid',
//       paymentMethod: 'Online Payment',
//       paymentId: razorpay_payment_id,
//       razorpayOrderId: razorpay_order_id,
//     });

//     console.log("New order created:", newOrder);

//     for (const item of books) {
//       console.log(`Updating stock for product: ${item.productId}, reducing quantity by ${item.quantity}`);
//       await Book.findByIdAndUpdate(
//         item.productId,
//         { $inc: { stock: -item.quantity } },
//         { new: true }
//       );
//     }

//     console.log("Stock updated for ordered items.");

//     await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

//     console.log("Cart cleared after order placement.");

//     res.json({
//       success: true,
//       orderId: newOrder.orderId,
//       message: 'Payment successful and order placed',
//       order: {
//         ...newOrder.toObject(),
//         totalAmount: paymentAmount,
//       },
//     });

//   } catch (error) {
//     console.error('Error verifying payment:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error verifying payment',
//       error: error.message,
//     });
//   }
// };

const verifyRazorPay = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.session.user;

    // Validate user and order ID
    if (!userId) return res.redirect('/login');
    if (!razorpay_order_id) return res.status(400).json({ message: 'Missing order ID' });

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', 'DCEw5akaKfgceyWx4RONlTKu')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find existing order
    const existingOrder = await Order.findOne({ 
      'razorpay.orderId': razorpay_order_id,
      user: userId 
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status and payment details
    existingOrder.status = 'Paid';
    existingOrder.paymentId = razorpay_payment_id;
    existingOrder.razorpay.signature = razorpay_signature;
    await existingOrder.save();

    // Update product stock from the existing order
    for (const item of existingOrder.books) {
      await Book.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }

    // Delete cart after successful payment
    await Cart.findOneAndDelete({ userId });

    res.json({
      success: true,
      orderId: existingOrder.orderId,
      message: 'Payment successful',
      order: existingOrder
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

const loadOrderFailed=async(req,res)=>{
  try {
    res.render('order-failed')
  } catch (error) {
    console.error(error);
    
  }
}


module.exports = {
  loadHomePage,
  loadLogin,
  loadCheckOut,
  loadContact,
  loadSignUp,
  signup,
  verifyOtp,
  resendOtp,
  login,
  loadShop,
  getBooksById,
  pageNotFound,
  logout,
  loadBookDetails,
  loadFiction,
  loadVerifyOtp,
  getAllGenres,
  getAllGenresWithBooks,
  showGenre,
  showBookDetails,
  loadAccountBan,
  loadForgetPassword,
  loadResetPassword,
  forgetPassword,
  loadVerifyEmail,
  verifyPassword,
  resetPassword,
  loadOrder,
  placeOrder,
  viewOrder,
  resendotp,
  createRazorOrder,
  verifyRazorPay,
  loadOrderFailed
};
