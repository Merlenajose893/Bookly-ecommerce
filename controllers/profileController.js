const mongoose = require('mongoose');
const { User } = require('../models/userSchema');
const Address = require('../models/addressSchema');
const Order=require('../models/orderSchema');
const {Book}=require('../models/bookSchema');
const Wallet=require('../models/wallet')
const Transaction=require('../models/transaction')
const bcrypt=require('bcrypt');
const PDFDocument=require('pdfkit');
const fs = require('fs');
const path=require('path');
const {razorpay}=require('../utils/razorpay');
const loaddashboard = async (req, res) => {
  try {
    const userId = req.session.user; // Match the key from login function
    if (!userId) {
      console.log('No userId found in session');
      return res.status(400).json({ message: 'User not logged in' });
    }

    console.log('Attempting to find user with ID:', userId);

    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
     console.log('User referral code:', user.referralCode);

    res.render('profiledashboard', { user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const editProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(400).json({ message: 'No User is found' }); // Add return to stop further execution
    }
    console.log(userId);

    const { name, phone } = req.body;
    console.log(req.body);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Add return to stop further execution
    }
    console.log(user);

    user.name = name;
    user.phone = phone;
    console.log(user.name);
    console.log(user.phone);

    await user.save();
    return res.redirect('/profiledashboard'); // Add return here to stop further execution
  } catch (error) {
    console.error('Error updating user', error);
    return res.status(500).json({ message: 'Server error' }); // Add return to stop further execution
  }
};


const loadWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.session.user }) // Find the wallet for the logged-in user
      .populate('user', 'name') // Populate the 'name' field from the user model
      .exec();

    if (!wallet) {
      return res.status(404).send("Wallet not found");
    }

    // Pagination Variables
    const currentPage = parseInt(req.query.page) || 1; // Get page number from query params, default to 1
    const itemsPerPage = 5; // Transactions per page
    const totalItems = await Transaction.countDocuments({ wallet: wallet._id }); // Total transactions
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const transactions = await Transaction.find({ wallet: wallet._id })
      .skip((currentPage - 1) * itemsPerPage) // Skip previous pages
      .limit(itemsPerPage) // Limit results per page
      .sort({ createdAt: -1 }); // Sort by latest transactions

    res.render('wallet', { 
      wallet, 
      transactions, 
      currentPage, 
      itemsPerPage, 
      totalItems ,
      totalPages
    }); 

  } catch (error) {
    console.error("Error loading wallet:", error);
    res.status(500).send("Error loading wallet");
  }
};

const getTransactions=async (req,res) => {
  try {
    const userId=req.session.user;
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
    res.render('wallet',{transactions});
  } catch (error) {
    console.error('Error',error);
    res.status(500).send("Error loading transactions");
    
  }
  
}
const addMoney=async (req,res) => {
  try {
    const userId=req.session.user
    const amount=req.body.amount;
    console.log('fghj',amount);
    
    let wallet = await Wallet.findOne({ user: userId });
    console.log('Wall',wallet);
    
    
    if(!wallet)
    {
     return res.status(400).json({message:'NO wallet is found'});
    }
    wallet.balance+=amount;
    const transaction = new Transaction({
      user: userId,
      amount,
      transactionType:'deposit',
      wallet:wallet._id,
      description: `Added $${amount} to the wallet`
    });
    await transaction.save();
    wallet.transactions.push(transaction._id)
    await wallet.save();
    res.json({message:'Successfully'})
  } catch (error) {
    console.error('Error adding the money',error);
    res.status(500).send('Internal Server Error');
    
  }
  
}

const loadChangePassword = async (req, res) => {
  try {
    res.render('changepassword');
  } catch (error) {
    console.error(error);
  }
};
const loadUpdateProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(400).json({ message: 'Not User found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    res.render('updateprofile', { user });
  } catch (error) {
    console.error(error);
  }
};
const loadAddress = async (req, res) => {
  try {
    
    const userId = req.session.user;
    if (!userId) {
      // return res.status(400).json({ message: 'No User found' });
     return res.redirect('/login');
    }

    const userData = await User.findOne({ _id: userId });
    if (!userData) {
      return res.render('address',{message:'User Address not found'});
    }

    const userAddress = await Address.find({ userId: userData._id });
    console.log('Data:', userAddress);

    const addresses = userAddress.length > 0 ? userAddress[0].address : []; // Access the 'address' array from the first user address object
    console.log('address:', addresses);

    res.render('address', { userAddress: addresses || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log('User',userId);
    
    if (!userId) {
      // return res.status(400).json({ message: 'No user found' });
    return   res.redirect('/login')
    }

    const userData = await User.findOne({ _id: userId });
    if (!userData) {
      return res.status(400).json({ message: 'No user data is found' });
    }

    console.log(userData);

    // Extracting form data from req.body
    const {
      name,
      pincode,
      phone,
      altPhone,
      state,
      country,
      addressType,
      
      city,
      locality,
    } = req.body;

    // Cast `isDefault` to Boolean
    // Converts "on" to true, and undefined/other values to false


    const userAddress = await Address.findOne({ userId: userData._id });

    const newAddress = {
      name,
      city,
      country,
      state,
      locality,
      phone,
      altPhone,
      addressType,
      pincode,
      
    };

    if (!userAddress) {
      const newAddressDoc = new Address({
        userId: userData._id,
        address: [newAddress],
      });
      await newAddressDoc.save();
    } else {
      userAddress.address.push(newAddress);
      await userAddress.save();
    }

    // If the user is adding an address for the checkout, redirect them to checkout
    if (req.query.fromCheckout) {
      // Pass address to the checkout page
      return res.redirect('/checkout');
    }

    // If not from checkout, just redirect to address list
    res.redirect('/address');
    // res.json({ success: true, message: "Address added successfully!" });
  } catch (error) {
    console.error('Internal Server Error', error);
    res.status(500).json({ success:false,message: 'Internal Server Error' });
  }
};


const editAddress = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    const userId = req.session.user;
    console.log(userId);

    const addressId = req.params.addressId;
    console.log(addressId);

    const findAddress = await Address.findOne({
      'address._id': addressId,
    });

    if (!findAddress) {
      return res.status(400).json({ message: 'Address is not found' });
    }

    await Address.updateOne(
      { 'address._id': addressId },
      {
        $set: {
          'address.$': {
            _id: addressId,
            name: data.name,
            addressType:data.addressType,
            pincode:data.pincode,
            city: data.city,
            country: data.country,
            state: data.state,
            locality: data.locality,
            phone: data.phone,
            altPhone: data.altPhone,
          },
        },
      },
    );

    // Redirect after successful update
    res.redirect('/address');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log('User',userId);
     // Ensure user is authenticated
    const { addressId } = req.params;
    console.log('Address',addressId);
     // Get addressId from request params

    // Validate addressId format
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Invalid Address ID format' });
    }

    const objectId = new mongoose.Types.ObjectId(addressId); // Convert to ObjectId

    // Check if the address exists for the user
    const findAddress = await Address.findOne({
      userId,
      'address._id': objectId, // Find address with the given address ID
    });

    if (!findAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Remove the address with the given ID from the address array
    const updatedUser = await Address.findOneAndUpdate(
      { userId, 'address._id': objectId }, // Ensure you're deleting the right address
      { $pull: { address: { _id: objectId } } }, // Pull out the address
      { new: true }, // Return the updated document
    );
console.log('Updated',updatedUser);

    if (!updatedUser) {
      return res.status(404).json({success:false, message: 'Failed to delete address' });
    }

    res.redirect('/address');
    // res.json({success:true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// const getOrderDetails=async (req,res) => {
//   try {
//     const orderId=req.params.orderId;
//     console.log('Order:',orderId);
// const order=await Order.findById(orderId).populate('books.productId').populate('user','name email')
// .populate({
//   path:'addressId',
//   select:'address'
// })    ;
// console.log('Order:',order);

// if (!order) {
//   return res.status(404).json({ message: 'Order not found' });
// }
// res.render('profileorder',{order});
//   } catch (error) {
//     console.error('Error Getting Details',error);
//     res.status(500).json({
//       message: 'Internal server error',
//     });
    
//   }
  
// }
const loadOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const orderId=req.params.orderId;
    if (!userId) {
      return res.redirect('/login');
    }

    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = 5; // Number of orders per page
    const skip = (page - 1) * limit;

    // Fetch user's orders with pagination
    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const order = await Order.find({ user: userId })
      .populate('books.productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Fetched Orders:", order); // Debugging output

    res.render('profileorders', {
      order,
      currentPage: page,
      totalPages,
      orderId:order._id
    });

  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).send("Internal Server Error");
  }
};
const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
      .populate('books.productId')
      .populate('user', 'name email')
      .lean();
      
    if (!order) {
      return res.status(400).json({ message: 'Order not found' });
    }
    
    // Create PDF document with explicit font
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      layout: 'portrait',
      font: 'Helvetica'
    });
    
    const invoicePath = path.join(__dirname, `../Public/invoices/invoice-${orderId}.pdf`);
    const stream = fs.createWriteStream(invoicePath);
    
    doc.pipe(stream);
    
    // Add letterhead and styling
    doc.font('Helvetica-Bold')
       .fontSize(25)
       .text('BOOKLY', { align: 'center' })
       .moveDown(0.5);
    
    doc.font('Helvetica')
       .fontSize(10)
       .text('123 Book Street, Reading City, Bookland - 560001', { align: 'center' })
       .text('Phone: +91 9876543210 | Email: contact@bookstore.com', { align: 'center' })
       .moveDown(1);
    
    // Add a horizontal line
    doc.strokeColor('#aaaaaa')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke()
       .moveDown();
    
    // Invoice header
    doc.font('Helvetica-Bold')
       .fontSize(20)
       .text('INVOICE', { align: 'center' })
       .moveDown();
    
    // Order details section
    const customerInfoX = 50;
    const orderInfoX = 300;
    const customerInfoY = doc.y;
    
    // Customer information (left column)
    doc.font('Helvetica-Bold').fontSize(12).text('Bill To:', customerInfoX, customerInfoY);
    doc.font('Helvetica').fontSize(10).text(`${order.user.name}`, customerInfoX, doc.y + 5);
    doc.text(`Email: ${order.user.email}`);
    
    if (order.shippingAddress) {
      doc.text(`Address: ${order.shippingAddress.address}`);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
      doc.text(`Phone: ${order.shippingAddress.phone}`);
    } else {
      doc.text('Shipping Address: Not Available');
    }
    
    // Reset Y position to align order details in right column
    doc.y = customerInfoY;
    
    // Order information (right column)
    doc.font('Helvetica-Bold').fontSize(12).text('Order Details:', orderInfoX, customerInfoY);
    doc.font('Helvetica').fontSize(10).text(`Invoice #: INV-${order.orderId}`, orderInfoX, doc.y + 5);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
    doc.text(`Order Status: ${order.status}`);
    doc.text(`Payment Method: ${order.paymentMethod || 'Not specified'}`);
    
    doc.moveDown(2);
    
    // TABLE LAYOUT
    // Define table column positions more precisely
    const tableWidth = doc.page.width - 100; // Account for margins
    
    // Fixed width for each column
    const colWidths = {
      index: 30,
      isbn: 120,
      title: 200,
      qty: 50,
      price: 80
    };
    
    // Calculate exact positions
    const colX = {
      index: 50,
      isbn: 50 + colWidths.index,
      title: 50 + colWidths.index + colWidths.isbn,
      qty: 50 + colWidths.index + colWidths.isbn + colWidths.title,
      price: 50 + colWidths.index + colWidths.isbn + colWidths.title + colWidths.qty
    };
    
    // Table header
    const tableTop = doc.y;
    
    // Draw table header background
    doc.fillColor('#eeeeee')
       .rect(50, tableTop - 5, tableWidth, 20)
       .fill();
    
    // Table headers
    doc.fillColor('#000000')
       .font('Helvetica-Bold')
       .fontSize(10);
    
    doc.text('#', colX.index, tableTop, { width: colWidths.index, align: 'center' });
    doc.text('ISBN', colX.isbn, tableTop, { width: colWidths.isbn, align: 'left' });
    doc.text('Title', colX.title, tableTop, { width: colWidths.title, align: 'left' });
    doc.text('Qty', colX.qty, tableTop, { width: colWidths.qty, align: 'center' });
    doc.text('Price', colX.price, tableTop, { width: colWidths.price, align: 'right' });
    
    doc.moveDown();
    
    // Draw a line below headers
    const lineY = doc.y;
    doc.strokeColor('#aaaaaa')
       .lineWidth(0.5)
       .moveTo(50, lineY)
       .lineTo(doc.page.width - 50, lineY)
       .stroke();
    
    doc.moveDown(0.5);
    
    // Table rows
    let totalAmount = 0;
    doc.font('Helvetica').fontSize(10);
    
    order.books.forEach((item, index) => {
      const book = item.productId;
      const quantity = item.quantity;
      const itemPrice = book.salesPrice;
      const rowY = doc.y;
      
      // Index column
      doc.text((index + 1).toString(), colX.index, rowY, { 
        width: colWidths.index, 
        align: 'center' 
      });
      
      // ISBN column
      doc.text(book.isbn || '9789510492604', colX.isbn, rowY, { 
        width: colWidths.isbn 
      });
      
      // Title column with max width to prevent overflow
      doc.text(book.title, colX.title, rowY, { 
        width: colWidths.title - 10 
      });
      
      // Save position after potentially wrapped title text
      const afterTitleY = doc.y;
      
      // Quantity column - centered
      doc.text(quantity.toString(), colX.qty, rowY, { 
        width: colWidths.qty, 
        align: 'center' 
      });
      
      // Price column - right aligned with proper currency formatting
      // Use a direct string with no word wrapping to prevent vertical stacking
      doc.text(`₹${itemPrice.toFixed(2)}`, colX.price, rowY, { 
        width: colWidths.price,
        align: 'right',
        characterSpacing: 0,
        wordSpacing: 0
      });
      
      // Calculate item total
      totalAmount += itemPrice * quantity;
      
      // Reset Y position to after any wrapped text
      doc.y = Math.max(doc.y, afterTitleY);
      
      // Draw line after each item
      doc.moveDown(0.5);
      doc.strokeColor('#dddddd')
         .lineWidth(0.5)
         .moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke();
      
      doc.moveDown(0.5);
    });
    
    // SUMMARY SECTION
    doc.moveDown();
    
    // Calculate summary section positions
    const summaryWidth = 200;
    const summaryStartX = doc.page.width - 50 - summaryWidth;
    const valueWidth = 80;
    const labelWidth = summaryWidth - valueWidth;
    
    // Draw a line above summary
    doc.strokeColor('#aaaaaa')
       .lineWidth(0.5)
       .moveTo(summaryStartX, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(0.5);
    
    // Helper function to add summary line
    const addSummaryLine = (label, value, isBold = false) => {
      if (isBold) {
        doc.font('Helvetica-Bold');
      } else {
        doc.font('Helvetica');
      }
      
      const y = doc.y;
      
      // Label on left side of summary
      doc.text(label, summaryStartX, y, { 
        width: labelWidth, 
        align: 'left' 
      });
      
      // Value on right side - IMPORTANT: Using a direct approach to prevent wrapping
      doc.text(value, summaryStartX + labelWidth, y, { 
        width: valueWidth,
        align: 'left',
        characterSpacing: 0,
        wordSpacing: 0,
        lineBreak: false
      });
      
      doc.moveDown(0.5);
    };
    
    // Calculate values
    const discountAmount = order.discountAmount || 0;
    const finalTotal = totalAmount - discountAmount+50;
    
    // Add summary items
    doc.fontSize(10);
    addSummaryLine('Subtotal:', `₹${totalAmount.toFixed(2)}`);
    addSummaryLine('Discount:', `₹${discountAmount.toFixed(2)}`);
    addSummaryLine('ShippingCost:', `₹50`);
    
    // Draw line before total
    doc.strokeColor('#aaaaaa')
       .lineWidth(1)
       .moveTo(summaryStartX, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(0.5);
    
    // Total line with bold formatting
    doc.fontSize(12);
    addSummaryLine('TOTAL:', `₹${finalTotal.toFixed(2)}`, true);
    
    // Footer
    doc.moveDown(4);
    doc.font('Helvetica').fontSize(10).text('Thank you for your business!', { align: 'center' });
    
    const footerY = doc.page.height - 50;
    doc.strokeColor('#aaaaaa')
       .lineWidth(0.5)
       .moveTo(50, footerY)
       .lineTo(doc.page.width - 50, footerY)
       .stroke();
    
    doc.fontSize(8)
       .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 10, { align: 'center' });
    
    doc.end();
    
    stream.on('finish', () => {
      res.download(invoicePath, `invoice-${orderId}.pdf`);
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user; 
    // Assuming the user ID is stored in the session
    const orderId = req.params.orderId;
    console.log('OrderId',orderId);
     // Assuming the order ID is passed as a URL parameter

    // Find the order by ID
    const order = await Order.findById(orderId);

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the order belongs to the logged-in user
    if (order.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: This order does not belong to you' });
    }

    // Check if the order is in a cancellable state (e.g., 'Pending')
    if (order.status !== 'Pending'  && order.status !== 'Paid') {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled because it is not in Pending status' });
    }
    
    const refundAmount=order.totalAmount;
    console.log(refundAmount);
    
    console.log('sdfghgfdsdfg');
    
    console.log(order.paymentId);
  
   
    
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      // Create a new wallet with the refund amount
      const newWallet = new Wallet({
        user: userId,
        balance: refundAmount
      });
      await newWallet.save();
      
      // Create a new transaction for the refund
      const transaction = new Transaction({
        userId: userId, // Add the userId reference
        amount: refundAmount,
        wallet: newWallet._id,
        transactionType: 'refund', // Type of transaction
        description: 'Refund processed for the user with no existing wallet',
      });
      await transaction.save();
    
    
    }
    
    // If wallet exists, update its balance
    wallet.balance += refundAmount;
    await wallet.save();
    
    // Create a new transaction for the refund
    const transaction = new Transaction({
      userId: userId, // Add the userId reference
      amount: refundAmount,
      wallet: wallet._id,
      transactionType: 'refund', // Type of transaction
      description: 'Refund processed for existing wallet',
    });
    await transaction.save();
    
    
    
for(const item of order.books)
{
  const book=item.productId;
  const quantitytoAdd=item.quantity;
  console.log('ghjk',quantitytoAdd);
  
  await Book.findByIdAndUpdate(
    book._id,
    { $inc: { quantity: quantitytoAdd } }  // Increment stock by the quantity in the order
  );
}

    // Update the order status to 'Cancelled'
    order.status = 'Cancelled';
    await order.save();

    // Send a success response
    res.redirect('/profileorder');
  } catch (error) {
    console.error('Error cancelling the order:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
const changePassword=async (req,res) => {
  try {
    const userId=req.session.user;
    const{currentPassword,newPassword,confirmPassword}=req.body;
    console.log('currentPassword',currentPassword);
    console.log('newPassword',newPassword);
    console.log('confirmPassword',confirmPassword);
    if(!currentPassword||!newPassword||!confirmPassword)
    {
      return res.status(400).json({message:'All fields are required'});
    }
    if(newPassword!==confirmPassword)
    {
      return res.status(400).json({message:'Passwords dont match'});
    }
    const user=await User.findById(userId);
    if(!user){
      return res.status(400).json({message:'User not found'});

    }
    console.log('User',user);
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
    }
    const isPasswordValid=await bcrypt.compare(currentPassword,user.password)
    if(!isPasswordValid)
    {
      return res.status(400).json({message:'Invalid current password'});
    }
    console.log('op',isPasswordValid);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    console.log('hjk',user.password);
    
    await user.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Error changing password',error);
    res.status(500).send('Internal Server Error');
    
  }
  
}
const returnOrder = async (req, res) => {
  try {
    const { orderId, reason, productId } = req.body;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).send("Invalid product ID format");
    }

    const orderToUpdate = await Order.findOne({ orderId })
      .populate('books.productId');

    if (!orderToUpdate) {
      return res.status(404).send("Order not found.");
    }

    // Convert to ObjectId for comparison
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Find product in order using ObjectId comparison
    const productInOrder = orderToUpdate.books.find(item => 
      item.productId._id.equals(productObjectId)
    );

    if (!productInOrder) {
      return res.status(400).send("Product not found in order.");
    }

    // Check order status
    if (orderToUpdate.status !== "Delivered") {
      return res.status(400).send("Only delivered orders can be returned.");
    }

    // Check existing returns
    const alreadyReturned = orderToUpdate.returnedProducts.some(item => 
      item.productId.equals(productObjectId)
    );

    if (alreadyReturned) {
      return res.status(400).send("Product already returned.");
    }

    // Update order
    orderToUpdate.returnedProducts.push({
      productId: productObjectId,
      quantity: productInOrder.quantity,
      reason,
      returnDate: new Date()
    });
    orderToUpdate.status = "Returning";
    orderToUpdate.statusHistory.push({
      status: "Returning",
      timestamp: new Date()
    });

    await orderToUpdate.save();
    res.redirect("/profileorder");

  } catch (error) {
    console.error("Error processing return:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getOrderDetails=async (req,res) => {
  try {
    const {orderId}=req.body;
    console.log('Order',orderId);
    
    const order=await Order.findOne({orderId});
    console.log('ghjk',order);
    
    if (!order) {
      return res.status(404).send("Order not found");
    }
    if(!order.razorpay||!order.razorpay.orderId){
        return res.status(404).send('No razor order');
    }
    res.json({
      success: true,
      razorpayOrderId: order.razorpay.orderId,
      amount: order.totalAmount * 100, // Convert to paisa for Razorpay
      shippingAddress: order.shippingAddress,
  });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
  
}


// app.post('/retry-payment', retryPayment);







// module.exports = { verifyRazorPay };


module.exports = {          
  loaddashboard,
  generateInvoice,
  
  loadWallet,
  loadChangePassword,
  loadUpdateProfile,
  editProfile,
  loadAddress,
  editAddress,
  addAddress,
  deleteAddress,
  getOrderDetails,
  loadOrder,
  cancelOrder,
  changePassword,
  getTransactions,
  addMoney,
  returnOrder,
  getOrderDetails
  // retryPayment  
  // verifyRazorPay
};
