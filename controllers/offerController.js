const mongoose=require('mongoose');
const {Offer}=require('../models/offerSchema');
const {Book}=require('../models/bookSchema')
const {Genre}=require('../models/GenresSchema');


// const Offer = require('../models/offerModel'); // Ensure you import your Offer model

const loadOfferPage = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;  // Get the page number from query, default to 1
        let limit = 10;  // Number of offers per page
        let skip = (page - 1) * limit;  

        const totalOffers = await Offer.countDocuments(); // Get total number of offers
        const totalPages = Math.ceil(totalOffers / limit); // Calculate total pages

        const offers = await Offer.find().populate('product category').skip(skip).limit(limit);
        const books=await Book.find({isDeleted:false})
        const genres=await Genre.find({isListed:false});
        console.log('Offers',offers);
        // Fetch paginated offers

        res.render('offer', { offers, page, totalPages,books ,genres}); // Pass pagination data to EJS
    } catch (error) {
        console.error('Error Loading Offer:', error);
        res.status(500).send("Internal Server Error");
    }
};
const createOffer = async (req, res) => {
    try {
        const { offerType, product, category, referralCode, discountType, discountValue, startDate, endDate, isActive } = req.body;
        console.log(req.body);

        let offerData = {
            offerType,
            product: offerType === 'Product' ? product : null,
            category: offerType === 'Category' ? category : null,
            discountType,
            discountValue,
            startDate,
            endDate,
            isActive: isActive === 'true'
        };

        if (offerType === 'Referral' && referralCode) {
            offerData.referralCode = referralCode; // Add referralCode only if it's defined
        }

        let newOffer = new Offer(offerData);
        await newOffer.save();
        res.redirect('/admin/offer');

    } catch (error) {
        console.error('Error', error);
        res.status(500).send('Internal Server Error');
    }
};

const editOffer=async (req,res) => {
    try {
        const offerId=req.params.offerId;
        console.log(offerId);
        
        const{offerType,product,category,referralCode,discountType,discountValue,startDate,endDate}=req.body;
        console.log('Req',req.body);
        if(!offerType||!discountType||!discountValue||!startDate||!endDate)
{
    res.status(400).send('Please fill all fields');
}        
const today = new Date().toISOString().split("T")[0];
if (new Date(startDate) < new Date(today)) {
    return res.status(400).json({ message: "Start Date cannot be in the past." });
}
if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ message: "End Date must be after the Start Date." });
}

let updatedData={offerType,discountType,discountValue,startDate,endDate}
if(offerType==='Product'){
    updatedData.product=product
}
if(offerType==='Category'){
    updatedData.category=category
}
if(offerType==='Referral'){
    updatedData.referralCode=referralCode
}
const updatedOffer=await Offer.findByIdAndUpdate(offerId,updatedData,{new:true})
console.log("Updating Offer:", {
    offerId,
    updatedData
});

// await updatedOffer.save();
if(!updatedOffer){
    return res.status(404).json({message:'Offer not found'})
}
console.log("Updated Offer:", updatedOffer);

// retres.redirect('/admin/offer')
res.status(200).json({
    success:true,
    message: "Offer updated successfully",
    updatedOffer,
    redirectUrl: "/admin/offer", // Include redirect URL in JSON response
});

    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.error('Eerr',error);
        
    }
    
}

const toggleOfferStatus=async (req,res) => {
    try {
        const offerId=req.params.offerId;
        const offer=await Offer.findById(offerId);
        console.log('Offer',offer);
        
        if(!offer){
            return res.status(404).json({message:'Offer not found'})
        }
        offer.isActive=!offer.isActive;
        await offer.save();
      return  res.redirect('/admin/offer')
        
    } catch (error) {
        console.error('Error',error);
        res.status(500).send('Internal Server Error');
        
    }
    
}

module.exports={loadOfferPage,createOffer,editOffer,toggleOfferStatus}