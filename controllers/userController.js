const { User } = require('../models/userSchema');
const { Book } = require('../models/bookSchema');
const { Genre } = require('../models/GenresSchema');
const { Cart } = require('../models/cartSchema');
const { Offer } = require('../models/offerSchema');
const Address = require('../models/addressSchema');
const OTP = require('../models/otpSchema');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const { log } = require('util');
const orderSchema = require('../models/orderSchema.js');
const { razorpay } = require('../utils/razorpay.js');
const Order = require('../models/orderSchema.js');
const Coupon = require('../models/couponSchema');

const loadHomePage = async (req, res) => {
  try {
    let message = req.session.message || null;
    req.session.message = null;

    const userId = req.session.user;

    const userLogged = await User.findById(userId);

    const searchQuery = req.query.search || '';
    let searchCondition = { isDeleted: false };

    if (searchQuery) {
      searchCondition.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { publisher: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const genres = await Genre.find();

    const books = await Book.find();
    const bookResults = await Book.find(searchCondition).populate('genres');

    if (bookResults.length === 1) {
      return res.redirect(`/book/${bookResults[0]._id}`);
    }

    return res.render('home', {
      genres,
      books,
      session: req.session,
      message,
      isAuthenticated: !!userId,
      userLogged,
      book: bookResults,
      searchQuery,
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.redirect('/pageerror');
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

    const findUser = await User.findOne({ isAdmin: false, email: email });

    if (!findUser) {
      return res.render('login', { message: 'User not found' });
    }

    if (findUser.isBlocked) {
      req.session.destroy((err) => {
        if (err) {
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

      req.session.user = findUser._id;
      req.session.isAuthenticated = true;

      return res.redirect('/');
    }
  } catch (error) {
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

    const orderId = req.params.orderId;
    const order = await orderSchema
      .findOne({ _id: orderId, user: userId })
      .populate('user')
      .populate('books.productId');

    if (!order) {
      return redirect('/login')
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
    req.session.userData = { name, email, password };

    if (!name || !email || !password || !cpassword) {
      return res.render('signup', { message: 'All fields are required.' });
    }

    if (password !== cpassword) {
      return res.render('signup', { message: "Passwords don't match each other" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render('signup', { message: 'Email is already taken' });
    }

    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1);

    const otpRecord = new OTP({
      email,
      otp,
      expiresAt,
    });

    await otpRecord.save();

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json({ success: false, message: 'Email sending failed' });
    }

    res.render('verify', { message: '' });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData || {};

    if (!email) {
      return res.status(400).json({ success: false, message: 'Invalid Email' });
    }

    const otp = generateOtp();

    await OTP.findOneAndDelete({ email });

    const storedOtp = await OTP.create({
      email,
      otp,
      createdAt: new Date(),
    });

    const otpExpirationTime = Date.now() + 60000;

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to send OTP. Try again later.' });
    }

    req.session.userOtp = otp;
    req.session.otpExpiration = otpExpirationTime;

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. It will expire in 1 minute.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const loadCheckOut = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.redirect('/login');
    }

    const addressDoc = await Address.findOne({ userId: userId });

    const userAddress = addressDoc ? addressDoc.address : [];

    const cart = await Cart.findOne({ userId }).populate('items.productId').populate('couponId');

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.render('checkout', {
        message: 'Your cart is empty',
        userAddress,
        items: [],
        subtotal: 0,
        total: 50,
        cartId: cart?._id,
      });
    }

    let originalSubtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    let discountAmount = cart.discountAmount || 0;

    let subtotal = originalSubtotal - discountAmount;

    let shippingPrice = 50;

    let total = subtotal + shippingPrice;

    const cartData = {
      items: cart.items,
      subtotal,
      discountAmount,
      delivery: shippingPrice,
      total,
    };

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
    res.status(500).send('Internal Server Error');
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { addressId, paymentMethod } = req.body;

    if (!userId) {
      return res.redirect('/login');
    }

    if (!addressId) {
      return res.json({
        success: false,
        message: 'Please select an address',
      });
    }

    if (paymentMethod === 'razorpay') {
      return createRazorOrder(req, res);
    }

    const cart = await Cart.findOne({ userId: userId }).populate({
      path: 'items.productId',
      select: 'salesPrice title quantity stock',
    });

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: false,
        message: 'Your cart is empty',
      });
    }

    let books = [];
    let totalAmount = 0;
    let discountAmount = cart.discountAmount || 0;

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
    });

    let subtotal = Math.max(0, totalAmount - discountAmount);

    const shippingCost = 50;

    const finalTotalAmount = subtotal + shippingCost;
    if (paymentMethod === 'cod' && finalTotalAmount > 1000) {
      return res.json({
        success: false,
        message: 'COD payment is not available for orders above 1000',
      });
    }

    const userAddress = await Address.findOne({
      userId: userId,
      'address._id': addressId,
    });

    if (!userAddress) {
      return res.json({
        success: false,
        message: 'Invalid address',
      });
    }

    const selectedAddress = userAddress.address.find((addr) => addr._id.toString() === addressId);

    const generateOrderId = () => {
      return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    };

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
      totalAmount: subtotal,
      price: finalTotalAmount,
      discountAmount: discountAmount,
      shippingCost: shippingCost,
      status: 'Pending',
      paymentMethod: paymentMethod,
    });

    for (const item of books) {
      const product = await Book.findById(item.productId);
      if (product) {
        const updatedStock = Math.max(0, product.stock - item.quantity);
        await Book.findByIdAndUpdate(item.productId, {
          $set: { stock: updatedStock },
        });
      }
    }

    await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [], discountAmount: 0 } });

    res.json({
      success: true,
      orderId: newOrder._id,
      message: 'Order placed Successfully',
      order: {
        ...newOrder.toObject(),
        totalAmount: finalTotalAmount,
        discountAmount: discountAmount,
      },
    });
  } catch (error) {
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
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const userData = req.session.userData;
    const userEmail = userData?.email;

    const otpData = await OTP.findOne({ email: userEmail });

    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: 'OTP_EXPIRED',
        message: 'OTP expired. Please request a new one.',
      });
    }

    const currentTime = new Date();
    const otpCreatedAt = new Date(otpData.createdAt);
    const expirationTime = 60 * 1000;

    if (currentTime - otpCreatedAt > expirationTime) {
      await OTP.findOneAndDelete({ email: userEmail });
      return res.status(400).json({
        success: false,
        error: 'OTP_EXPIRED',
        message: 'OTP expired. Please request a new one.',
      });
    }

    const actualOtp = otpData.otp;

    if (!otp || otp !== actualOtp) {
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

    req.session.userOtp = null;
    req.session.userData = null;
    req.session.otpTimestamp = null;

    await OTP.findOneAndDelete({ email: userEmail });

    res.status(200).json({ success: true, message: 'OTP Verified', redirectUrl: '/' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const loadOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).send('Order ID is required.');
    }

    const order = await orderSchema.findById(orderId).populate('user').populate('books.productId');

    if (!order) {
      return res.status(400).json({ message: 'No order found' });
    }

    res.render('thankyoupage', { order });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
};

const loadShop = async (req, res) => {
  try {
    console.log('Received request for shop with query:', req.query);

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;
    const currentDate = new Date();
    let filter = { isDeleted: false };

    if (req.query.search) {
      const searchQuery = req.query.search.trim();
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    let selectedGenres = [];
    if (req.query.genres) {
      selectedGenres = Array.isArray(req.query.genres)
        ? req.query.genres
        : req.query.genres.split(',');
    }

    if (selectedGenres.length > 0) {
      const genreDocs = await Genre.find({ name: { $in: selectedGenres } }).select('_id');
      const genreIds = genreDocs.map((genre) => genre._id);

      if (genreIds.length > 0) {
        filter.genres = { $in: genreIds };
      }
    }

    const sortOptions = {
      popularity: { salesCount: -1 },
      'price-low': { salesPrice: 1 },
      'price-high': { salesPrice: -1 },
      rating: { averageRating: -1 },
      new: { createdAt: -1 },
      'name-asc': { title: 1 },
      'name-desc': { title: -1 },
    };

    const sortOption = sortOptions[req.query.sort] || { createdAt: -1 };

    const totalItems = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    let books = await Book.find(filter)
      .populate('genres')
      .populate('offerId')
      .sort(sortOption)
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    books = await Promise.all(
      books.map(async (book) => {
        let finalPrice = book.salesPrice || book.regularPrice;
        let appliedOffer = null;

        if (book.offerId && book.offerId.isActive && book.offerId.endDate >= currentDate) {
          appliedOffer = book.offerId;
        } else {
          const categoryOffer = await Offer.findOne({
            category: { $in: book.genres },
            isActive: true,
            endDate: { $gte: currentDate },
          })
            .sort({ discountValue: -1 })
            .limit(1);

          if (categoryOffer) {
            appliedOffer = categoryOffer;
            // console.log(`Applied category offer: ${appliedOffer.discountType} - ${appliedOffer.discountValue}`);
          }
        }

        // Apply discount if offer exists
        if (appliedOffer) {
          if (appliedOffer.discountType === 'percentage') {
            finalPrice = finalPrice - (finalPrice * appliedOffer.discountValue) / 100;
          } else {
            finalPrice = finalPrice - appliedOffer.discountValue;
          }
          finalPrice = Math.max(finalPrice, 0);
          // console.log('Fin',finalPrice);
        }

        // console.log(`Final price after discount: ${finalPrice}`);
        book.salesPrice = finalPrice;
        // console.log('Sales',book.salesPrice);

        // Create new object to avoid modifying original document
        return {
          ...book.toObject(),
          finalPrice: finalPrice.toFixed(2),
          appliedOffer,
        };
      }),
    );

    // Fetch all genres and active offers
    const [genres, offers] = await Promise.all([
      Genre.find({ isDeleted: false }),
      Offer.find({ isActive: true, endDate: { $gte: currentDate } }),
    ]);

    // console.log("Genres fetched:", genres.length);
    // console.log("Active offers fetched:", offers.length);

    res.render('shop', {
      books,
      genres,
      offers,
      currentPage: page,
      totalPages,
      searchQuery: req.query.search || '',
      selectedGenres,
      sort: req.query.sort || 'new',
      message: 'Shop rendered successfully',
    });
  } catch (error) {
    console.error('Error during shop load:', error);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
};

const getBooksById = async (req, res) => {
  try {
    const bookId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: 'Invalid Book ID format' });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.render('details', { book });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error destroying session', error: err });
      }

      res.redirect('/login');
    });
  });
};

const loadBookDetails = async (req, res) => {
  try {
    const user = req.user;
    if (user && user.isBlocked) {
      return res
        .status(403)
        .send(
          '<h1 style="background-color:red; color:white;">Access Denied: Your account is blocked.</h1>',
        );
    }

    const { id: bookId } = req.params;

    if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid book ID format' });
    }

    const book = await Book.findById(bookId).populate('genres', 'name').populate('offerId');

    if (!book || book.isDeleted) {
      return res.render('productban');
    }

    const currentDate = new Date();

    const productOffer = await Offer.findOne({
      product: bookId,
      isActive: true,
      endDate: { $gte: currentDate },
    });

    let categoryOffer = null;
    if (!productOffer) {
      categoryOffer = await Offer.findOne({
        category: { $in: book.genres },
        isActive: true,
        endDate: { $gte: currentDate },
      });
    }

    const genres = await Genre.find({ isListed: true });

    let finalPrice = book.regularPrice;
    let appliedOffer = productOffer || categoryOffer || null;

    if (appliedOffer) {
      if (appliedOffer.discountType === 'Percentage') {
        finalPrice -= (book.regularPrice * appliedOffer.discountValue) / 100;
      } else {
        finalPrice -= appliedOffer.discountValue;
      }
    }

    finalPrice = Math.max(finalPrice, 0);
    book.salesPrice = finalPrice;

    const relatedBooks = await Book.find({
      genres: { $in: book.genres },
      _id: { $ne: bookId },
      isDeleted: false,
    }).limit(4);

    const offers = [];
    if (productOffer?.isActive) offers.push(productOffer);
    if (categoryOffer?.isActive) offers.push(categoryOffer);

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

const getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.find({ isListed: false, isDeleted: false });
    if (!genres.length) {
      return res.render('home', { genres: [] });
    }
    res.render('home', { genres });
  } catch (error) {
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

    let selectedGenres = [];
    if (req.query.genres) {
      selectedGenres = Array.isArray(req.query.genres)
        ? req.query.genres
        : req.query.genres.split(',');
    }

    if (selectedGenres.length > 0) {
      const genreDocs = await Genre.find({ name: { $in: selectedGenres } }).select('_id');
      const genreIds = genreDocs.map((g) => g._id);
      filter.genres = { $in: genreIds };
    }

    const sortOptions = {
      popularity: { salesCount: -1 },
      'price-low': { salesPrice: 1 },
      'price-high': { salesPrice: -1 },
      rating: { averageRating: -1 },
      new: { createdAt: -1 },
      'name-asc': { title: 1 },
      'name-desc': { title: -1 },
    };
    const sortOption = sortOptions[req.query.sort] || { createdAt: -1 };

    const totalBooks = await Book.countDocuments(filter);
    let books = await Book.find(filter)
      .populate('genres')
      .populate('offerId')
      .sort(sortOption)
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const currentDate = new Date();
    books = await Promise.all(
      books.map(async (book) => {
        let finalPrice = book.salesPrice || book.regularPrice;
        let appliedOffer = null;

        if (book.offerId && book.offerId.isActive && book.offerId.endDate >= currentDate) {
          appliedOffer = book.offerId;
        } else {
          const categoryOffer = await Offer.findOne({
            category: { $in: book.genres },
            isActive: true,
            endDate: { $gte: currentDate },
          })
            .sort({ discountValue: -1 })
            .limit(1);

          if (categoryOffer) appliedOffer = categoryOffer;
        }

        if (appliedOffer) {
          finalPrice =
            appliedOffer.discountType === 'percentage'
              ? finalPrice - (finalPrice * appliedOffer.discountValue) / 100
              : finalPrice - appliedOffer.discountValue;
          finalPrice = Math.max(finalPrice, 0);
        }

        return {
          ...book.toObject(),
          finalPrice: finalPrice.toFixed(2),
          appliedOffer,
        };
      }),
    );

    const genres = await Genre.find({ isDeleted: false });

    res.render('genre', {
      genre,
      books,
      currentPage,
      totalPages: Math.ceil(totalBooks / itemsPerPage),
      genres,
      selectedGenres,
    });
  } catch (error) {
    res.status(500).send('Server Error');
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

    const user = await User.findOne({ email });

    if (!user) {
      res.render('forget-password', { message: 'User not found' });
    }

    const otp = generateOtp();
    const otpExpiry = Date.now() + 60 * 1000;

    const isEmailSent = await sendVerificationEmail(email, otp);
    if (!isEmailSent) {
      res.render('forget-password', { message: 'Failed to Sent the verification email' });
      return;
    }

    await OTP.findOneAndUpdate({ email }, { email, otp, otpExpiry }, { upsert: true });

    res.redirect('/verifyemail');
  } catch (error) {
    console.error(error);
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
    const { email } = req.session;

    const user = await User.findOne({ email });

    if (!user) {
      res.render('verifyemail', { message: 'User not found' });
      return;
    }
    const actualOtp = await OTP.findOne({ email });

    if (actualOtp.otp !== otp) {
      res.render('verifyemail', { message: 'Invalid Otp' });
      return;
    }
    if (user.otpExpiry < Date.now()) {
      res.render('verifyemail', { message: 'Otp expired' });
      return;
    }

    return res.render('reset-password', { email: email });
  } catch (error) {}
};

const resetPassword = async (req, res) => {
  try {
    const email = req.session.email;

    if (!email) {
      return res.status(400).json({ message: 'User is not authorized' });
    }

    const { newPassword } = req.body;

    const newhashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { password: newhashedPassword },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'User not found or password update failed' });
    }

    return res.redirect('/login');
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const createRazorOrder = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.redirect('/login');
    }

    const { addressId } = req.body;

    const userAddress = await Address.findOne({ 'address._id': addressId, userId: userId });

    if (!userAddress) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const selectedAddress = userAddress.address.find((addr) => addr._id.toString() === addressId);

    const cart = await Cart.findOne({ userId: userId })
      .populate('items.productId', 'salesPrice title quantity stock')
      .populate('couponId', 'name minimumPrice offerPrice');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    cart.items.forEach((item) => {
      const productPrice = item.productId?.salesPrice || 0;
      const quantity = item.quantity || 1;
      totalAmount += productPrice * quantity;
    });
    let discount = 0;
    let couponCode = '';
    if (cart.couponId) {
      const coupon = cart.couponId;
      couponCode = coupon.name;
      if (totalAmount >= coupon.minimumPrice) {
        discount = coupon.offerPrice;
      }
    }

    const shippingCost = 50;
    const finalAmount = totalAmount - discount + shippingCost;

    const options = {
      amount: finalAmount * 100,
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    if (!order || !order.id) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }

    const generateOrderId = () => {
      return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    };

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
      discountAmount: discount,
      books: cart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.salesPrice,
      })),
      shippingCost,
      status: 'Payment Pending',
      paymentMethod: 'Online Payment',
      razorpay: {
        orderId: order.id,
      },
    });

    await newOrder.save();

    await Cart.findByIdAndDelete(cart._id);

    return res.json({
      success: true,
      order: newOrder,
      key: 'rzp_test_pxX6lfY1EAcvNw',
      amount: order.amount,
      addressId: addressId,
      order_id: order.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message,
    });
  }
};

const verifyRazorPay = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.session.user;

    if (!userId) return res.redirect('/login');
    if (!razorpay_order_id) return res.status(400).json({ message: 'Missing order ID' });

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', 'DCEw5akaKfgceyWx4RONlTKu')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const existingOrder = await Order.findOne({
      'razorpay.orderId': razorpay_order_id,
      user: userId,
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    existingOrder.status = 'Paid';
    existingOrder.paymentId = razorpay_payment_id;
    existingOrder.razorpay.signature = razorpay_signature;
    await existingOrder.save();

    for (const item of existingOrder.books) {
      await Book.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { new: true },
      );
    }

    await Cart.findOneAndDelete({ userId });

    res.json({
      success: true,
      orderId: existingOrder.orderId,
      message: 'Payment successful',
      order: existingOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message,
    });
  }
};

const loadOrderFailed = async (req, res) => {
  try {
    res.render('order-failed');
  } catch (error) {
    console.error(error);
  }
};

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

  loadVerifyOtp,
  getAllGenres,

  showGenre,

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
  loadOrderFailed,
};
