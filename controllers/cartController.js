const { Cart } = require('../models/cartSchema');
const { Book } = require('../models/bookSchema');
const { User } = require('../models/userSchema');
const Coupon=require('../models/couponSchema');
const { mongoose } = require('mongoose');

const loadCart = async (req, res) => {
  try {
    let message = '';
    const userId = req.session.user;
    if (!userId) {
      return res.redirect('/login');
    }

    console.log('User ID from session:', userId);

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    console.log('Cart:', cart);
    const coupons = await Coupon.find({ isList: true }).sort({ createdAt: -1 });

    const cartData = {
      items: cart ? cart.items : [],
      subtotal: 0,
      delivery: 50,
      total: 50,
      itemCount: cart ? cart.items.length : 0,
      coupons,
      appliedCoupon: null,
      discountAmount: 0
    };

    if (cart && cart.items && cart.items.length > 0) {
      cartData.subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
      cartData.total = cart.total + 50;
    }

    console.log('Final Cart Data:', cartData);

    res.render('cart', { cart: cartData, message, coupons });
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
      return res.redirect('/login');
    }

    const { productId, quantity } = req.body;
    const requestedQty = parseInt(quantity, 10) || 1;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      req.session.message = 'Invalid product ID. Please try again.';
      return res.redirect('/cart');
    }

    const product = await Book.findById(productId).populate('offerId');
    if (!product) {
      req.session.message = 'Product not found. Please try again later.';
      return res.redirect('/cart');
    }

    if (!product.images || product.images.length === 0) {
      req.session.message = 'Product images not available. Please try again later.';
      return res.redirect('/cart');
    }

    const stockLeft = product.quantity;
    const maxPerPerson = 5;

    if (requestedQty > stockLeft) {
      req.session.message = `Only ${stockLeft} items left in stock. Please adjust your order.`;
      return res.redirect('/cart');
    }

    if (requestedQty > maxPerPerson) {
      req.session.message = `You can only buy up to ${maxPerPerson} of this product.`;
      return res.redirect('/cart');
    }

    let itemPrice = product.salesPrice || product.regularPrice;
    let discountValue = 0;

    if (product.offerId) {
      const offer = product.offerId;
      if (offer.isActive && offer.discountType && offer.discountValue) {
        if (offer.discountType === "percentage") {
          discountValue = (itemPrice * offer.discountValue) / 100;
        } else if (offer.discountType === "fixed") {
          discountValue = offer.discountValue;
        }
        itemPrice = Math.max(0, itemPrice - discountValue);
      }
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [], subTotal: 0 });
    }

    const existingItem = cart.items.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      const newTotalQty = existingItem.quantity + requestedQty;
      if (newTotalQty > maxPerPerson) {
        req.session.message = `Max ${maxPerPerson} per person allowed.`;
        return res.redirect('/cart');
      }
      if (newTotalQty > stockLeft) {
        req.session.message = `Not enough stock. Only ${stockLeft} left.`;
        return res.redirect('/cart');
      }

      existingItem.quantity = newTotalQty;
      existingItem.totalPrice = newTotalQty * itemPrice;
    } else {
      cart.items.push({
        productId: product._id,
        quantity: requestedQty,
        price: itemPrice,
        totalPrice: requestedQty * itemPrice,
      });
    }

    cart.subTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

    await cart.save();

    const updatedProduct = await Book.findByIdAndUpdate(
      productId,
      { $inc: { quantity: -requestedQty } },
      { new: true }
    );

    if (!updatedProduct) {
      req.session.message = 'Failed to update stock. Please try again.';
      return res.redirect('/cart');
    }

    req.session.message = 'Product successfully added to your cart!';
    return res.redirect('/cart');

  } catch (error) {
    console.error('Error adding to cart:', error);
    req.session.message = 'Something went wrong. Please try again later.';
    return res.redirect('/cart');
  }
};






const updateCart = async (req, res) => {
  try {
    console.log("Incoming update cart request:", req.body);

    const userId = req.session?.user;
    if (!userId) {
      return res.redirect('/login')
    }

    let { productId, quantity } = req.body;
    quantity = parseInt(quantity, 10);

    if (!productId || isNaN(quantity) ) {
      return res.status(400).json({ success: false, message: "Invalid product ID or quantity." });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.render("cart", { message: "No Cart found" });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not found in cart." });
    }

    const product = await Book.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    let availableStock = product.quantity;
    if (availableStock === 0) {
      return res.status(400).json({ success: false, message: "Product is out of stock." });
    }
console.log(availableStock,'kkk');

    if (quantity > availableStock) {
      // quantity = availableStock;
      return res.status(400).json({ 
        success: false, 
        message: `Only ${availableStock} items are in stock. You cannot add more.`,availableStock
      });
    }

    const prevQuantity = cart.items[itemIndex].quantity;
    const quantityDelta = quantity - prevQuantity;

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = product.salesPrice * quantity;

    cart.subTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    cart.total = cart.subTotal + (cart.delivery || 0);

    if (isNaN(cart.total) || isNaN(cart.subTotal)) {
      return res.status(400).json({ success: false, message: "Invalid subtotal or total calculation." });
    }

    if (quantityDelta > 0) {
      product.quantity -= quantityDelta;
    } else if (quantityDelta < 0) {
      product.quantity -= quantityDelta;
    } else if (quantity === 0) {
      product.quantity += prevQuantity;
      cart.items.splice(itemIndex, 1);
    }

    await product.save();
    await cart.save();

    return res.json({
      success: true,
      message: "Cart updated successfully",
      cart: { subTotal: cart.subTotal, total: cart.total, items: cart.items },
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};




const deleteCart = async (req, res) => {
  try {
    console.log("Session user:", req.session.user);
    console.log("Request body:", req.body);

    const userId = req.session.user;
    const { productId } = req.body;

    if (!userId) {
      console.log("No user in session");
      return res.redirect("/login");
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      console.log("Invalid productId:", productId);
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const cart = await Cart.findOne({ userId });
    console.log("Found cart:", cart);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    const removedItem = cart.items[itemIndex];
    const restoredQuantity = removedItem.quantity;
    const product = await Book.findById(productId);

    if (product) {
      product.quantity += restoredQuantity;
      await product.save();
      console.log(`Restored ${restoredQuantity} units to stock. New stock: ${product.quantity}`);
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items.productId": new mongoose.Types.ObjectId(productId) },
      { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart.",
      });
    }

    updatedCart.subTotal = updatedCart.items.reduce((total, item) => total + (item.totalPrice || 0), 0);
    updatedCart.subTotal = Number(updatedCart.subTotal);

    await updatedCart.save();

    console.log("Updated cart:", updatedCart);

    res.status(200).json({
      success: true,
      message: "Item deleted successfully.",
      updatedCart,
      cart,
    });
  } catch (error) {
    console.error("Error in deleteCart:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting item from cart",
      error: error.message,
    });
  }
};



const applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  console.log("Coupon:", couponCode);

  const userId = req.session.user;
  console.log("User:", userId);

  if (!userId) {
    return res.redirect('/login')
  }

  if (!couponCode || typeof couponCode !== "string") {
    return res.status(400).json({ success: false, message: "Invalid coupon code format" });
  }

  try {
    const today=new Date();
    const coupon = await Coupon.findOne({ name: couponCode, isList: true ,expiredOn:{$gte:today}});
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const cart = await Cart.findOne({ userId }).populate("couponId");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: "Cart is empty or not found" });
    }
cart.discountAmount
// const discountAmount = coupon.discountAmount;
console.log(cart.discountAmount);

    const subtotal = cart.items.reduce((acc, item) => {
      if (!item.totalPrice || typeof item.totalPrice !== "number") {
        throw new Error("Invalid item price structure");
      }
      return acc + item.totalPrice;
    }, 0);
    console.log("Subtotal before coupon:", subtotal);

    if (subtotal < coupon.minimumPrice) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minimumPrice} required`,
      });
    }

    if (coupon.offerPrice > subtotal) {
      return res.status(400).json({ success: false, message: "Discount cannot exceed cart total" });
    }

    const shippingPrice = 50;
    console.log("Shipping Price:", shippingPrice);

    cart.couponId = coupon._id;
    cart.discountAmount = coupon.offerPrice;
    cart.subTotal = subtotal - coupon.offerPrice;
    cart.total = cart.subTotal + shippingPrice;

    console.log("Final Total:", cart.total);

    await cart.save();

    res.json({
      success: true,
      message: "Coupon applied successfully",
      discountAmount: coupon.offerPrice,
      subtotal: cart.subTotal,
      total: cart.total,
      coupon:cart.discountAmount
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) return res.redirect("/login");

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(400).json({ success: false, message: "Cart not found" });
if(!cart.couponId)
{
  return res.status(400).json({success:false,message:'You havent applied the coupon'})
}
    const originalSubtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    const shipping = 50;

    cart.couponId = null;
    cart.discountAmount = 0;
    cart.subTotal = originalSubtotal;
    cart.total = originalSubtotal + shipping;

    await cart.save();

    res.json({
      success: true,
      message: "Coupon removed successfully",
      total: cart.total,
      subtotal: originalSubtotal,
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




module.exports = { loadCart, addToCart, updateCart, deleteCart 
,applyCoupon,removeCoupon};
