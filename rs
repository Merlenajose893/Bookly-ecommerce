[1mdiff --git a/Public/reports/salesReport.pdf b/Public/reports/salesReport.pdf[m
[1mindex aa8bb8d..ab4ebaf 100644[m
[1m--- a/Public/reports/salesReport.pdf[m
[1m+++ b/Public/reports/salesReport.pdf[m
[36m@@ -1,40 +1,16 @@[m
                         Sales Report[m
 [m
[31m-28 February 2025[m
[32m+[m[32m4 March 2025[m
 [m
 Order ID                Customer  Amount ( ¹)  Discount ( ¹) Payment Method[m
 [m
[31m-ORD-1740208766650-4721  sneha     ¹2840.00     ¹0.00    Online Payment[m
[31m-ORD-1740222169058-2236  sneha     ¹1340.00[m
[31m-ORD-1740222960472-4701  sneha     ¹615.00      ¹0.00    Online Payment[m
[31m-ORD-1740223383224-5128  sneha     ¹615.00[m
[31m-ORD-1740223900624-8503  sneha     ¹1340.00     ¹0.00    Online Payment[m
[31m-ORD-1740223966149-6914  sneha     ¹636.00[m
[31m-ORD-1740224543438-8285  sneha     ¹725.00      ¹0.00    Online Payment[m
[31m-ORD-1740295409432-1462  sneha     ¹1115.00[m
[31m-ORD-1740298010729-9018  sneha     ¹1840.00     ¹0.00    Online Payment[m
[31m-ORD-1740326571504-9303  sneha     ¹636.00[m
[31m-ORD-1740386554292-8900  sneha     ¹1200.00     ¹0.00    COD[m
[31m-ORD-1740391971342-3356  sneha     ¹615.00[m
[31m-ORD-1740456310749-6469  sneha     ¹615.00      ¹0.00    Online Payment[m
[31m-ORD-1740457058165-1718  sneha     ¹2000.00[m
[31m-                                               ¹0.00    Online Payment[m
[31m-[m
[31m-                                               ¹0.00    Online Payment[m
[31m-[m
[31m-                                               ¹89.00   COD[m
[31m-[m
[31m-                                               ¹0.00    Online Payment[m
[31m-[m
[31m-                                               ¹0.00    Online Payment[m
[31m-[m
[31m-                                               ¹0.00    Online Payment[m
[31m-[m
[32m+[m[32mORD-1741062587729-4911  sneha     ¹572.00      ¹0.00    Online Payment[m
[32m+[m[32mORD-1741063546371-3319  sneha     ¹572.00[m
                                                ¹0.00    Online Payment[m
 [m
                                                Summary[m
 [m
[31m-                                  Total Sales:         ¹16132.00[m
[31m-                                  Total Discount:           ¹89.00[m
[32m+[m[32m                                  Total Sales:          ¹1144.00[m
[32m+[m[32m                                  Total Discount:            ¹0.00[m
 Page 1 of 1[m
 [m
[1mdiff --git a/controllers/adminController.js b/controllers/adminController.js[m
[1mindex 518153d..09c812e 100644[m
[1m--- a/controllers/adminController.js[m
[1m+++ b/controllers/adminController.js[m
[36m@@ -339,25 +339,46 @@[m [mconst totalPages = Math.ceil(totalItems / limit);[m
         case 'weekly':[m
           start = new Date(today);[m
           start.setDate(today.getDate() - 7);[m
[31m-          end = today;[m
[32m+[m[32m          start.setHours(0, 0, 0, 0); // Start at beginning of the day 7 days ago[m
[32m+[m[32m          end = new Date(today);[m
[32m+[m[32m          end.setHours(23, 59, 59, 999); // End at end of today[m
           break;[m
         case 'monthly':[m
           start = new Date(today.getFullYear(), today.getMonth(), 1);[m
[31m-          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);[m
[32m+[m[32m          start.setHours(0, 0, 0, 0);[m
[32m+[m[32m          end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month[m
[32m+[m[32m          end.setHours(23, 59, 59, 999); // Include entire last day[m
           break;[m
         case 'yearly':[m
[31m-          start = new Date(today.getFullYear(), 0, 1);[m
[31m-          end = new Date(today.getFullYear(), 11, 31);[m
[31m-          break;[m
[31m-        case 'custom':[m
[31m-          start = new Date(startDate);[m
[31m-          end = new Date(endDate);[m
[31m-          if (isNaN(start.getTime()) || isNaN(end.getTime())) {[m
[31m-            return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });[m
[31m-          }[m
[32m+[m[32m          start = new Date(today.getFullYear(), 0, 1); // January 1st[m
[32m+[m[32m          start.setHours(0, 0, 0, 0);[m
[32m+[m[32m          end = new Date(today.getFullYear(), 11, 31); // December 31st[m
[32m+[m[32m          end.setHours(23, 59, 59, 999); // Include entire last day[m
           break;[m
[31m-        default:[m
[31m-          return res.status(400).json({ error: 'Invalid filter. Please choose a valid filter.' });[m
[32m+[m[32m      // In salesReport controller[m
[32m+[m[32mcase 'custom':[m
[32m+[m[32m  // Validate presence of dates[m
[32m+[m[32m  if (!startDate || !endDate) {[m
[32m+[m[32m    return res.status(400).json({[m[41m [m
[32m+[m[32m      error: 'Start date and end date are required for custom range'[m[41m [m
[32m+[m[32m    });[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // Parse dates with format validation[m
[32m+[m[32m  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;[m
[32m+[m[32m  if (!isoDateRegex.test(startDate) || !isoDateRegex.test(endDate)) {[m
[32m+[m[32m    return res.status(400).json({[m[41m [m
[32m+[m[32m      error: 'Invalid date format. Use YYYY-MM-DD'[m[41m [m
[32m+[m[32m    });[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  start = new Date(startDate);[m
[32m+[m[32m  end = new Date(endDate);[m
[32m+[m[41m  [m
[32m+[m[32m  // Add time to end date to include entire day[m
[32m+[m[32m  end.setHours(23, 59, 59, 999);[m
[32m+[m[32m  break;[m
[32m+[m[32m          // return res.status(400).json({ error: 'Invalid filter' });[m
       }[m
   [m
       console.log("Final Start Date:", start);[m
[1mdiff --git a/controllers/profileController.js b/controllers/profileController.js[m
[1mindex da91768..d5e79b8 100644[m
[1m--- a/controllers/profileController.js[m
[1m+++ b/controllers/profileController.js[m
[36m@@ -364,30 +364,30 @@[m [mconsole.log('Updated',updatedUser);[m
     res.status(500).json({ message: 'Internal server error' });[m
   }[m
 };[m
[31m-const getOrderDetails=async (req,res) => {[m
[31m-  try {[m
[31m-    const orderId=req.params.orderId;[m
[31m-    console.log('Order:',orderId);[m
[31m-const order=await Order.findById(orderId).populate('books.productId').populate('user','name email')[m
[31m-.populate({[m
[31m-  path:'addressId',[m
[31m-  select:'address'[m
[31m-})    ;[m
[31m-console.log('Order:',order);[m
[31m-[m
[31m-if (!order) {[m
[31m-  return res.status(404).json({ message: 'Order not found' });[m
[31m-}[m
[31m-res.render('profileorder',{order});[m
[31m-  } catch (error) {[m
[31m-    console.error('Error Getting Details',error);[m
[31m-    res.status(500).json({[m
[31m-      message: 'Internal server error',[m
[31m-    });[m
[31m-    [m
[31m-  }[m
[32m+[m[32m// const getOrderDetails=async (req,res) => {[m
[32m+[m[32m//   try {[m
[32m+[m[32m//     const orderId=req.params.orderId;[m
[32m+[m[32m//     console.log('Order:',orderId);[m
[32m+[m[32m// const order=await Order.findById(orderId).populate('books.productId').populate('user','name email')[m
[32m+[m[32m// .populate({[m
[32m+[m[32m//   path:'addressId',[m
[32m+[m[32m//   select:'address'[m
[32m+[m[32m// })    ;[m
[32m+[m[32m// console.log('Order:',order);[m
[32m+[m
[32m+[m[32m// if (!order) {[m
[32m+[m[32m//   return res.status(404).json({ message: 'Order not found' });[m
[32m+[m[32m// }[m
[32m+[m[32m// res.render('profileorder',{order});[m
[32m+[m[32m//   } catch (error) {[m
[32m+[m[32m//     console.error('Error Getting Details',error);[m
[32m+[m[32m//     res.status(500).json({[m
[32m+[m[32m//       message: 'Internal server error',[m
[32m+[m[32m//     });[m
[32m+[m[41m    [m
[32m+[m[32m//   }[m
   [m
[31m-}[m
[32m+[m[32m// }[m
 const loadOrder = async (req, res) => {[m
   try {[m
     const userId = req.session.user;[m
[36m@@ -668,12 +668,13 @@[m [mconst generateInvoice = async (req, res) => {[m
     [m
     // Calculate values[m
     const discountAmount = order.discountAmount || 0;[m
[31m-    const finalTotal = totalAmount - discountAmount;[m
[32m+[m[32m    const finalTotal = totalAmount - discountAmount+50;[m
     [m
     // Add summary items[m
     doc.fontSize(10);[m
     addSummaryLine('Subtotal:', `₹${totalAmount.toFixed(2)}`);[m
     addSummaryLine('Discount:', `₹${discountAmount.toFixed(2)}`);[m
[32m+[m[32m    addSummaryLine('ShippingCost:', `₹50`);[m
     [m
     // Draw line before total[m
     doc.strokeColor('#aaaaaa')[m
[36m@@ -926,36 +927,46 @@[m [mconst returnOrder = async (req, res) => {[m
   }[m
 };[m
 [m
[31m-[m
[31m-const retryPayment=async (req,res) => {[m
[32m+[m[32mconst getOrderDetails=async (req,res) => {[m
   try {[m
[31m-    const orderId=req.params.orderId;[m
[31m-    const order=await Order.findById(orderId);[m
[31m-    if(!order){[m
[32m+[m[32m    const {orderId}=req.body;[m
[32m+[m[32m    console.log('Order',orderId);[m
[32m+[m[41m    [m
[32m+[m[32m    const order=await Order.findOne({orderId});[m
[32m+[m[32m    console.log('ghjk',order);[m
[32m+[m[41m    [m
[32m+[m[32m    if (!order) {[m
       return res.status(404).send("Order not found");[m
     }[m
[31m-    const paymentOrder=await razorpay.orders.create({[m
[31m-      amount:order.totalAmount*100,[m
[31m-      currency:"INR",[m
[31m-      receipt: `retry_${orderId}`,[m
[31m-      payment_capture: 1,[m
[31m-    });[m
[31m-await Order.findByIdAndUpdate(orderId,{[m
[31m-  paymentId:paymentOrder.id,[m
[31m-  status:"Payment Pending",[m
[31m-});[m
[31m-// res.json({success:true,paymentOrder,order})[m
[31m-res.redirect(`/checkout/${paymentOrder.id}`);[m
[32m+[m[32m    if(!order.razorpay||!order.razorpay.orderId){[m
[32m+[m[32m        return res.status(404).send('No razor order');[m
[32m+[m[32m    }[m
[32m+[m[32m    res.json({[m
[32m+[m[32m      success: true,[m
[32m+[m[32m      razorpayOrderId: order.razorpay.orderId,[m
[32m+[m[32m      amount: order.totalAmount * 100, // Convert to paisa for Razorpay[m
[32m+[m[32m      shippingAddress: order.shippingAddress,[m
[32m+[m[32m  });[m
   } catch (error) {[m
[31m-    console.error("Error retrying payment:", error);[m
[31m-    res.status(500).json({ error: "Error processing payment retry" });[m
[32m+[m[32m    console.error("Error fetching order details:", error);[m
[32m+[m[32m    res.status(500).json({ success: false, message: "Server error" });[m
   }[m
   [m
 }[m
 [m
 [m
[32m+[m[32m// app.post('/retry-payment', retryPayment);[m
[32m+[m
[32m+[m
[32m+[m
[32m+[m
[32m+[m
[32m+[m
[32m+[m
[32m+[m[32m// module.exports = { verifyRazorPay };[m
[32m+[m
 [m
[31m-module.exports = {[m
[32m+[m[32mmodule.exports = {[m[41m          [m
   loaddashboard,[m
   generateInvoice,[m
   [m
[36m@@ -974,5 +985,7 @@[m [mmodule.exports = {[m
   getTransactions,[m
   addMoney,[m
   returnOrder,[m
[31m-  retryPayment[m
[32m+[m[32m  getOrderDetails[m
[32m+[m[32m  // retryPayment[m[41m  [m
[32m+[m[32m  // verifyRazorPay[m
 };[m
[1mdiff --git a/controllers/userController.js b/controllers/userController.js[m
[1mindex bf59913..a23ed0c 100644[m
[1m--- a/controllers/userController.js[m
[1m+++ b/controllers/userController.js[m
[36m@@ -15,6 +15,7 @@[m [mconst { log } = require('util');[m
 const orderSchema = require('../models/orderSchema.js');[m
 const {razorpay}=require('../utils/razorpay.js');[m
 const Order = require('../models/orderSchema.js');[m
[32m+[m[32mconst Coupon=require('../models/couponSchema')[m
 [m
 const loadHomePage = async (req, res) => {[m
   try {[m
[36m@@ -228,8 +229,10 @@[m [mconst viewOrder = async (req, res) => {[m
     const order = await orderSchema[m
       .findOne({ _id: orderId, user: userId })[m
       .populate('user')[m
[31m-      .populate('books.productId');[m
[32m+[m[32m      .populate('books.productId')[m
     console.log('Order', order);[m
[32m+[m[32m    // console.log('Coupon',order);[m
[32m+[m[41m    [m
     console.log('OrderId', orderId);[m
 [m
     if (!order) {[m
[36m@@ -1350,37 +1353,66 @@[m [mconst createRazorOrder = async (req, res) => {[m
     const { addressId } = req.body;[m
     console.log('Received addressId:', addressId);[m
 [m
[31m-    if (!addressId) {[m
[31m-      console.log('No address provided.');[m
[31m-      return res.status(400).json({ message: 'Address id is required' });[m
[32m+[m[32m    // Fetch user address[m
[32m+[m[32m    const userAddress = await Address.findOne({ 'address._id': addressId, userId: userId });[m
[32m+[m
[32m+[m[32m    if (!userAddress) {[m
[32m+[m[32m      return res.status(400).json({ message: 'Invalid address ID' });[m
     }[m
 [m
[31m-    const cart = await Cart.findOne({ userId: userId }).populate({[m
[31m-      path: 'items.productId',[m
[31m-      select: 'salesPrice title quantity stock',[m
[31m-    });[m
[32m+[m[32m    const selectedAddress = userAddress.address.find((addr) => addr._id.toString() === addressId);[m
[32m+[m[32m    console.log('Selected address:', selectedAddress);[m
 [m
[31m-    if (!cart) {[m
[32m+[m[32m    // Fetch cart details[m
[32m+[m[32m    const cart = await Cart.findOne({ userId: userId })[m
[32m+[m[32m  .populate('items.productId', 'salesPrice title quantity stock')[m
[32m+[m[32m  .populate('couponId', 'name minimumPrice offerPrice');[m
[32m+[m
[32m+[m[32mconsole.log(cart.couponId);[m
[32m+[m
[32m+[m[32m    if (!cart || cart.items.length === 0) {[m
       console.log('Cart is empty');[m
       return res.status(400).json({ message: 'Cart is empty' });[m
     }[m
 [m
     console.log('Cart details:', cart);[m
 [m
[32m+[m[32m    // Calculate total amount[m
     let totalAmount = 0;[m
     cart.items.forEach((item) => {[m
       const productPrice = item.productId?.salesPrice || 0;[m
       const quantity = item.quantity || 1;[m
       totalAmount += productPrice * quantity;[m
     });[m
[31m-    const discount = cart.discountAmount || 0;[m
[32m+[m[32m    let discount = 0;[m
[32m+[m[32m    let couponCode = '';[m
[32m+[m[32m    if (cart.couponId) {[m
[32m+[m[32m      const coupon=cart.couponId;[m
[32m+[m[32m      couponCode=coupon.name[m
[32m+[m[32m      if (totalAmount >= coupon.minimumPrice) {[m
[32m+[m[32m        discount = coupon.offerPrice;[m
[32m+[m[32m        console.log(`Applied Coupon: ${couponCode}, Discount: ${discount}`);[m
[32m+[m[32m      }[m
[32m+[m[32m      else {[m
[32m+[m[32m        console.log(`Coupon not applicable, minimum price required: ${coupon.minimumPrice}`);[m
[32m+[m[32m      }[m
[32m+[m[32m    }[m
[32m+[m[32m    else {[m
[32m+[m[32m      console.log('No coupon applied');[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    // const discount = cart.discountAmount || 0;[m
     const shippingCost = 50;[m
[31m-    const finalAmount = totalAmount-discount + shippingCost;[m
[32m+[m[32m    const finalAmount = totalAmount - discount + shippingCost;[m
[32m+[m[41m    [m
 [m
     console.log(`Total Amount: ${totalAmount}, Shipping Cost: ${shippingCost}, Final Amount: ${finalAmount}`);[m
[32m+[m[32m    console.log('Discount',discount);[m
[32m+[m[41m    [m
 [m
[32m+[m[32m    // Razorpay Order options[m
     const options = {[m
[31m-      amount: finalAmount * 100,[m
[32m+[m[32m      amount: finalAmount * 100, // Convert to paise[m
       currency: 'INR',[m
       receipt: `order_rcptid_${Date.now()}`,[m
       payment_capture: 1,[m
[36m@@ -1388,16 +1420,68 @@[m [mconst createRazorOrder = async (req, res) => {[m
 [m
     console.log('Creating Razorpay order with options:', options);[m
 [m
[32m+[m[32m    // Create Razorpay order[m
     const order = await razorpay.orders.create(options);[m
     console.log('Razorpay Order Created:', order);[m
[32m+[m[32m    if (!order || !order.id) {[m
[32m+[m[32m      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });[m
[32m+[m[32m    }[m
[32m+[m
 [m
[32m+[m[32m    // Generate custom order ID[m
[32m+[m[32m    const generateOrderId = () => {[m
[32m+[m[32m      return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;[m
[32m+[m[32m    };[m
[32m+[m[32m    console.log("Generated Razorpay Order ID:", order.id);[m
[32m+[m[32m    // Save order to database[m
[32m+[m[32m    const newOrder = new Order({[m
[32m+[m[32m      orderId: generateOrderId(),[m
[32m+[m[32m      user: userId,[m
[32m+[m[32m      addressId: selectedAddress._id,[m
[32m+[m[32m      shippingAddress: {[m
[32m+[m[32m        name: selectedAddress.name,[m
[32m+[m[32m        address: selectedAddress.address,[m
[32m+[m[32m        city: selectedAddress.city,[m
[32m+[m[32m        state: selectedAddress.state,[m
[32m+[m[32m        pincode: selectedAddress.pincode,[m
[32m+[m[32m        phone: selectedAddress.phone,[m
[32m+[m[32m      },[m
[32m+[m[32m      totalAmount: finalAmount,[m
[32m+[m[32m      discountAmount:discount,[m
[32m+[m[32m      books: cart.items.map(item => ({[m
[32m+[m[32m        productId: item.productId._id,[m
[32m+[m[32m        quantity: item.quantity,[m
[32m+[m[32m        price: item.productId.salesPrice,[m
[32m+[m[32m      })),[m
[32m+[m[32m      shippingCost,[m
[32m+[m[32m      status: 'Payment Pending',  // Initial status[m
[32m+[m[32m      paymentMethod: 'Online Payment',[m
[32m+[m[32m      // razorpayOrderId: razorpayOrder.id, // Store Razorpay order ID[m
[32m+[m[32m      razorpay: {[m
[32m+[m[32m        orderId: order.id // ✅ Ensure this is assigned[m
[32m+[m[32m      },[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    await newOrder.save(); // Save order[m
[32m+[m
[32m+[m[32m    // console.log('Order saved successfully in database');[m
[32m+[m[32m    console.log('Order saved successfully in database:', newOrder);[m
[32m+[m
[32m+[m
[32m+[m[32m    // Delete cart after successful order save[m
[32m+[m[32m    // await Cart.findByIdAndDelete(cart._id);[m
[32m+[m[32m    console.log('Cart deleted successfully');[m
[32m+[m
[32m+[m[32m    // Return response[m
     return res.json({[m
       success: true,[m
[31m-      order: order,[m
[32m+[m[32m      order: newOrder,[m
       key: 'rzp_test_pxX6lfY1EAcvNw',[m
[31m-      amount: finalAmount,[m
[32m+[m[32m      amount: order.amount,[m
       addressId: addressId,[m
[32m+[m[32m      order_id: order.id[m
     });[m
[32m+[m
   } catch (error) {[m
     console.error('Error creating Razorpay order:', error);[m
     return res.status(500).json({[m
[36m@@ -1408,93 +1492,214 @@[m [mconst createRazorOrder = async (req, res) => {[m
   }[m
 };[m
 [m
[32m+[m
   [m
[31m-const verifyRazorPay = async (req, res) => {[m
[31m-  try {[m
[31m-    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId, discountAmount = 0 } = req.body; // Ensure discountAmount is included[m
[32m+[m[32m// const verifyRazorPay = async (req, res) => {[m
[32m+[m[32m//   try {[m
[32m+[m[32m//     console.log("Request body:", req.body);[m
[32m+[m[41m    [m
[32m+[m[32m//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId } = req.body;[m
[32m+[m[32m//     // Fix: Extract order ID from nested object[m
 [m
[31m-    console.log(req.body);[m
[31m-    const userId = req.session.user;[m
[31m-    if (!userId) {[m
[31m-      return res.redirect('/login');[m
[31m-    }[m
[32m+[m[32m//     const userId = req.session.user;[m
 [m
[31m-    const body = razorpay_order_id + '|' + razorpay_payment_id;[m
[31m-    const expectedSignature = crypto.createHmac('sha256', 'DCEw5akaKfgceyWx4RONlTKu')[m
[31m-      .update(body)[m
[31m-      .digest('hex');[m
[32m+[m[32m//     console.log("User ID from session:", userId);[m
 [m
[31m-    if (expectedSigna