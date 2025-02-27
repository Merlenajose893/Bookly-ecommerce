const { Cart } = require('../models/cartSchema');
const { Book } = require('../models/bookSchema');
const { User } = require('../models/userSchema');
const Coupon=require('../models/couponSchema');
const { mongoose } = require('mongoose');

const loadCart = async (req, res) => {
  try {
    let message = '';
    const userId = req.session.user; // Ensure session contains the user
    if (!userId) {
      return res.redirect('/login');
    }

    console.log('User ID from session:', userId);

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    console.log('Cart:', cart);
    const coupons=await Coupon.find({isList:true}).sort({createdAt:-1});

    // Ensure cart object is always passed to the template
    const cartData = {
      items: cart ? cart.items : [],
      subtotal: 0,
      delivery: 50, // You can calculate delivery differently based on conditions
      total: 50,
      itemCount:cart ? cart.items.length : 0,
      coupons,
      appliedCoupon:null,
      discountAmount:0
    };

    if (cart && cart.items && cart.items.length > 0) {
      // Calculate the subtotal and total
      cartData.subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
      cartData.total =cart.total+50;
    }

    // Log the final data to be passed to the template
    console.log('Final Cart Data:', cartData);

    // Render the cart page with the data
    res.render('cart', { cart: cartData, message ,coupons});
  } catch (error) {
    console.error('Error loading Cart page:', error);
    res.status(500).send('Internal Server Error');
  }
};
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      req.session.message = 'You need to log in first.';
      console.log("❌ User not logged in. Redirecting to login.");
      return res.redirect('/login');
    }

    const { productId, quantity } = req.body;
    const requestedQty = parseInt(quantity, 10) || 1;

    console.log(`🔍 Request received for productId: ${productId}, Quantity: ${requestedQty}`);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      req.session.message = 'Invalid product ID. Please try again.';
      console.log("❌ Invalid product ID.");
      return res.redirect('/cart');
    }

    // Find product
    const product = await Book.findById(productId).populate('offerId');
    if (!product) {
      req.session.message = 'Product not found. Please try again later.';
      console.log("❌ Product not found.");
      return res.redirect('/cart');
    }

    console.log(`📦 Product Found - Name: ${product.title}, Stock: ${product.quantity}`);

    if (!product.images || product.images.length === 0) {
      req.session.message = 'Product images not available. Please try again later.';
      console.log("❌ Product images missing.");
      return res.redirect('/cart');
    }

    const stockLeft = product.quantity;
    const maxPerPerson = 5;

    if (requestedQty > stockLeft) {
      req.session.message = `Only ${stockLeft} items left in stock. Please adjust your order.`;
      console.log(`❌ Not enough stock. Requested: ${requestedQty}, Available: ${stockLeft}`);
      return res.redirect('/cart');
    }

    if (requestedQty > maxPerPerson) {
      req.session.message = `You can only buy up to ${maxPerPerson} of this product.`;
      console.log(`❌ Limit exceeded. Requested: ${requestedQty}, Max Allowed: ${maxPerPerson}`);
      return res.redirect('/cart');
    }

    let itemPrice = product.salesPrice || product.regularPrice;
    // let finalPrice=product.salesPrice||product.regularPrice;
    let discountValue=0;
   
    if (product.offerId) {
      const offer = product.offerId;
      console.log("✅ Offer Found:", offer);
      if (offer.isActive && offer.discountType && offer.discountValue) {
        if (offer.discountType === "percentage") {
          discountValue = (itemPrice * offer.discountValue) / 100;
        } else if (offer.discountType === "fixed") {
          discountValue = offer.discountValue;
        }
        itemPrice = Math.max(0, itemPrice - discountValue); // Ensure price doesn't go negative
        console.log(`🎉 Offer Applied - Discount: ${discountValue}, Final Price: ${itemPrice}`);
      }
    }
    
    console.log(`💰 Pricing - Regular: ${product.regularPrice}, Sales: ${product.salesPrice}, Final: ${itemPrice}`);

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      console.log("🛒 No existing cart found, creating a new one.");
      cart = new Cart({ userId, items: [], subTotal: 0 });
    }

    const existingItem = cart.items.find((item) => item.productId.toString() === productId);
    
    if (existingItem) {
      const newTotalQty = existingItem.quantity + requestedQty;
      if (newTotalQty > maxPerPerson) {
        req.session.message = `Max ${maxPerPerson} per person allowed.`;
        console.log("❌ Max per person limit reached.");
        return res.redirect('/cart');
      }
      if (newTotalQty > stockLeft) {
        req.session.message = `Not enough stock. Only ${stockLeft} left.`;
        console.log("❌ Not enough stock for updated cart.");
        return res.redirect('/cart');
      }

      existingItem.quantity = newTotalQty;
      existingItem.totalPrice = newTotalQty * itemPrice;
      console.log(`🔄 Updated Cart Item - Product: ${product.title}, New Qty: ${newTotalQty}`);
    } else {
      cart.items.push({
        productId: product._id,
        quantity: requestedQty,
        price: itemPrice,
        totalPrice: requestedQty * itemPrice,
      });
      console.log(`🆕 Added new item to cart - Product: ${product.title}, Qty: ${requestedQty}`);
    }

    // Update cart subtotal
    cart.subTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
    console.log(`💲 New Cart Subtotal: ${cart.subTotal}`);

    // Save cart FIRST before updating stock
    await cart.save();
    console.log("✅ Cart saved successfully.");

    // **🔹 Stock Deduction Debugging**
    console.log(`📉 Deducting stock... Product: ${product.name}, Before: ${product.quantity}, Deducting: ${requestedQty}`);

    const updatedProduct = await Book.findByIdAndUpdate(
      productId,
      { $inc: { quantity: -requestedQty } },
      { new: true }
    );

    if (!updatedProduct) {
      console.log("❌ Stock update failed.");
      req.session.message = 'Failed to update stock. Please try again.';
      return res.redirect('/cart');
    }

    console.log(`✅ Stock updated successfully. Product: ${product.name}, New Stock: ${updatedProduct.quantity}`);

    req.session.message = 'Product successfully added to your cart!';
    return res.redirect('/cart');

  } catch (error) {
    console.error('🚨 Error adding to cart:', error);
    req.session.message = 'Something went wrong. Please try again later.';
    return res.redirect('/cart');
  }
};





const updateCart = async (req, res) => {
  try {
    console.log('🔹 Incoming update cart request:', req.body);

    const userId = req.session?.user;
    if (!userId) {
      console.log('🔸 User not logged in. Redirecting to login.');
      return res.redirect('/login');
    }

    let { productId, quantity } = req.body;
    console.log('🔹 Received update request for:', { productId, quantity });

    if (!productId || quantity == null || quantity <= 0) {
      console.log('🔸 Invalid request data:', { productId, quantity });
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Please provide a valid product ID and quantity.',
      });
    }

    const cart = await Cart.findOne({ userId });
    console.log('🔹 Fetched user cart:', cart);

    if (!cart) {
      console.log('🔸 No cart found for the user.');
      return res.render('cart', { message: 'No Cart found' });
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    console.log('🔹 Item index in cart:', itemIndex);

    if (itemIndex === -1) {
      console.log('🔸 Product not found in cart.');
      return res.status(404).json({ success: false, message: 'Product not found in cart.' });
    }

    const product = await Book.findById(productId);
    console.log('🔹 Product details:', product);

    if (!product) {
      console.log('🔸 Product not found in database.');
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let availableStock = product.quantity;
    console.log('🔹 Available stock:', availableStock);

    if (availableStock === 0) {
      console.log('🔸 Product is out of stock. Cannot update.');
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock. Cannot update quantity.',
      });
    }

    if (quantity > availableStock) {
      console.log(`🔸 Requested quantity (${quantity}) exceeds stock. Updating to ${availableStock}.`);
      quantity = availableStock;
    }

    console.log(`🔹 Updating cart item - Product ID: ${productId}, New Quantity: ${quantity}`);

    // Find the difference in quantity (delta)
    const prevQuantity = cart.items[itemIndex].quantity;
    const quantityDelta = quantity - prevQuantity; // How much to deduct from stock
    console.log(`🔹 Quantity Change (Delta): ${quantityDelta}`);

    // Update the cart
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = product.salesPrice * quantity;

    cart.subTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    console.log('🔹 Recalculated cart subtotal:', cart.subTotal);

    const delivery = cart.delivery || 0;
    console.log('🔹 Delivery charge:', delivery);

    cart.total = cart.subTotal + delivery;
    console.log('🔹 Final cart total:', cart.total);

    if (isNaN(cart.total) || isNaN(cart.subTotal)) {
      console.log('🔸 Error: Invalid subtotal or total calculation.');
      return res.status(400).json({
        success: false,
        message: 'Invalid subtotal or total calculation.',
      });
    }

    // Deduct stock only if quantity increases
    if (quantityDelta > 0) {
      // If the user increases quantity, reduce stock
      product.quantity -= quantityDelta;
      console.log(`🔹 Stock reduced by ${quantityDelta}. New stock: ${product.quantity}`);
    } else if (quantityDelta < 0) {
      // If the user decreases quantity, restore stock
      product.quantity -= quantityDelta; // Since quantityDelta is negative, this adds back
      console.log(`🔹 Stock restored by ${-quantityDelta}. New stock: ${product.quantity}`);
    } else if (quantity === 0) {
      // If the item is removed (quantity = 0), restore full previous quantity
      product.quantity += prevQuantity;
      console.log(`🔹 Item removed. Restored full stock of ${prevQuantity}. New stock: ${product.quantity}`);
    
      // Remove the item from the cart array
      cart.items.splice(itemIndex, 1);
    }
    
    await product.save();
    console.log(`🔹 Final product stock: ${product.quantity}`);
    
    // Save the updated cart
    await cart.save();
    console.log('✅ Cart updated successfully:', cart);

    return res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: {
        subTotal: cart.subTotal,
        total: cart.total,
        items: cart.items,
      },
    });
  } catch (error) {
    console.error('❌ Error updating cart:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};



const deleteCart = async (req, res) => {
  try {
    console.log('Session user:', req.session.user);
    console.log('Request body:', req.body);

    const userId = req.session.user;
    const { productId } = req.body;

    // Validate user session
    if (!userId) {
      console.log('No user in session');
   return    res.redirect('/login')
    }

    // Validate product ID
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      console.log('dfghjk:', productId);
      return res.status(400).json({
        success: false,
        message: 'Inddfghjkl.',
      });
    }

    // Find and log the cart
    const cart = await Cart.findOne({ userId });
    console.log('Found cart:', cart);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
    }
    const itemIndex=cart.items.findIndex((item)=>item.productId.toString()===productId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      })
    }
const removeItem=cart.items[itemIndex];
const restoredQuantity=removeItem.quantity;
const product=await Book.findById(productId);
if(product){
  product.quantity+=restoredQuantity;
  await product.save();
  console.log(`🔹 Restored ${restoredQuantity} units to stock. New stock: ${product.quantity}`);

}
    // Use the $pull operator to remove the item from the cart
    const updatedCart = await Cart.findOneAndUpdate(
      { userId, 'items.productId': new mongoose.Types.ObjectId(productId) }, // Use 'new' here
      { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } }, // Use 'new' here as well
      { new: true },
    );

    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart.',
        
      });
    }

    // Recalculate the subtotal after deletion
    updatedCart.subTotal = updatedCart.items.reduce((total, item) => {
      // Ensure the totalPrice of each item is a number and add it to the total
      return total + (item.totalPrice || 0); // Handle cases where totalPrice might be undefined or invalid
    }, 0);

    // Ensure the subTotal is a number
    updatedCart.subTotal = Number(updatedCart.subTotal);

    // Save the updated cart after subtotal recalculation
    await updatedCart.save();

    console.log('Updated cart:', updatedCart);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully.',
      updatedCart,
      cart
    });
  } catch (error) {
    console.error('Detailed error in deleteCart:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting item from cart',
      error: error.message,
    });
  }
};


const applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  console.log('Coupon:', couponCode);

  const userId = req.session.user;
  console.log('User:', userId);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not logged in' });
  }

  if (!couponCode || typeof couponCode !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid coupon code format' });
  }

  try {
    // Find the coupon
    const coupon = await Coupon.findOne({ name: couponCode, isList: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Find the cart and validate products
    const cart = await Cart.findOne({ userId }).populate('couponId');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty or not found' });
    }

    // Calculate subtotal (sum of all item prices)
    const subtotal = cart.items.reduce((acc, item) => {
      if (!item.totalPrice || typeof item.totalPrice !== 'number') {
        throw new Error('Invalid item price structure');
      }
      return acc + item.totalPrice;
    }, 0);
    console.log('Subtotal before coupon:', subtotal);

    if (subtotal < coupon.minimumPrice) {
      return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minimumPrice} required` });
    }

    if (coupon.offerPrice > subtotal) {
      return res.status(400).json({ success: false, message: 'Discount cannot exceed cart total' });
    }

    // Ensure shipping price is included
    const shippingPrice = 50 // Default to 0 if not defined
    console.log('Shipping Price:', shippingPrice);

    // Apply coupon and calculate new totals
    cart.couponId = coupon._id;
    cart.discountAmount = coupon.offerPrice;
    cart.subTotal = subtotal - coupon.offerPrice; // Subtotal after discount
    cart.total = cart.subTotal + shippingPrice;  // Final total with shipping

    console.log('Final Total:', cart.total);

    await cart.save();

    // Respond with updated cart details
    res.json({
      success: true,
      message: "Coupon applied successfully",
      discountAmount: coupon.offerPrice,
      subtotal: cart.subTotal,
      total: cart.total
    });

  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) return res.redirect('/login');

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(400).json({ success: false, message: 'Cart not found' });

    // Calculate original values
    const originalSubtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    const shipping = 50; // Match your shipping calculation logic

    // Reset values
    cart.couponId = null;
    cart.discountAmount = 0;
    cart.subTotal = originalSubtotal;
    cart.total = originalSubtotal + shipping; // Explicit total calculation

    await cart.save();

    res.json({
      success: true,
      message: "Coupon removed successfully",
      total: cart.total, // Should now be original subtotal + shipping
      subtotal: originalSubtotal
    });

  } catch (error) {
    console.error("Error removing coupon:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



module.exports = { loadCart, addToCart, updateCart, deleteCart 
,applyCoupon,removeCoupon};
