const mongoose=require('mongoose');
const Wishlist=require('../models/wishListSchema');
const {Book}=require('../models/bookSchema')
const {Cart}=require('../models/cartSchema')


const loadWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login');
        }

        const wishlist = await Wishlist.findOne({ userId }).populate('bookId');
        const wishlistItems = wishlist ? wishlist.bookId : [];
        const wishlistCount = wishlistItems.length;

        console.log('Wishlist:', wishlist); // Debugging

        // Ensure `wishlist` is always defined
        res.render('wishlist', { wishlist: wishlistItems ,wishlistCount});

    } catch (error) {
        console.error('Loading wishlist error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




const addWishlist=async (req,res) => {
    try {
        const userId=req.session.user;
        console.log(userId);
        
        if(!userId){
          return  res.redirect('/login')
        }
        const bookId=req.body.bookId;
        console.log('Book',bookId);
        if(!bookId)
        {
            return res.status(400).json({message:'Book Id is not found'});
        }
        // const bookExists=await Book.findOne({bookId});
        // console.log(bookExists);
        
        // if(!bookExists)
        // {
        //    return res.status(400).json({message:'No book is found'})
        // }
        let wishlist=await Wishlist.findOne({userId});
        console.log(wishlist);
        
        if(!wishlist)
        {
            wishlist=new Wishlist({userId,bookId:[bookId]});
        }
        else{
            if(wishlist.bookId.includes(bookId))
            {
               return res.status(400).send({message:'Book already in wishlist'})
            }
            wishlist.bookId.push(bookId);
        }
        await wishlist.save();
// return res.render('wishlist');
return res.json({success:true,redirect:'/wishlist'})
    } catch (error) {
        console.error('Error adding wishlist',error);
        
    }
}
const addWishlistToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login');
        }

        const bookId = req.body.bookId;
        if (!bookId) {
            return res.status(400).json('No book is found');
        }

        const book = await Book.findById(bookId);
        let wishlist = await Wishlist.findOne({ userId });
        
        if (!wishlist || !wishlist.bookId.includes(bookId)) {
            return res.status(400).json({ message: 'Book not found in wishlist' });
        }

        // Remove book from wishlist
        wishlist.bookId = wishlist.bookId.filter(id => id.toString() !== bookId);
        await wishlist.save();

        // Find or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({
                userId,
                items: [{
                    productId: book._id,
                    quantity: 1,
                    price: book.salesPrice,
                    totalPrice: book.salesPrice
                }],
                subTotal: book.salesPrice
            });
            await cart.save();
        } else {
            // Check if the book is already in the cart
            let existingItem = cart.items.find(item => item.productId.toString() === bookId);
            if (existingItem) {
                existingItem.quantity += 1;
                existingItem.totalPrice = existingItem.quantity * book.salesPrice;
            } else {
                cart.items.push({
                    productId: book._id,
                    quantity: 1,
                    price: book.salesPrice,
                    totalPrice: book.salesPrice
                });
            }

            cart.subTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
            await cart.save();
        }

        return res.status(200).json({ success: true, message: 'Book moved to cart' });

    } catch (error) {
        console.error("Error moving book to cart:", error);
        res.status(500).json({ message: "Server error" });
    }
}

const removeBookFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const bookId = req.body.bookId; // Expecting ObjectId

        console.log("Removing book from wishlist:", bookId);

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist || !wishlist.bookId.some(id => id.equals(bookId))) {
            return res.status(400).json({ success: false, message: "Book not found in wishlist" });
        }

        // ✅ Properly remove ObjectId from array
        wishlist.bookId = wishlist.bookId.filter(id => !id.equals(bookId));
        await wishlist.save();

        return res.status(200).json({ success: true, message: "Book removed from wishlist" });
    } catch (error) {
        console.error("Error Removing book from wishlist:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports={loadWishlist,addWishlist,addWishlistToCart,removeBookFromWishlist}