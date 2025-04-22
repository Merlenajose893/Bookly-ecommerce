const mongoose = require('mongoose');
const { Offer } = require('../models/offerSchema');
const { Book } = require('../models/bookSchema');
const { Genre } = require('../models/GenresSchema');

const loadOfferPage = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let skip = (page - 1) * limit;

        let filter = {};

        if (req.query.search) {
            const searchQuery = req.query.search.trim();
            filter.$or = [
                { offerType: { $regex: searchQuery, $options: 'i' } },
                { discountType: { $regex: searchQuery, $options: 'i' } },
                { referralCode: { $regex: searchQuery, $options: 'i' } }
            ];
        }
        console.log(req.query.search);
        

        const totalOffers = await Offer.countDocuments(filter);
        const totalPages = Math.ceil(totalOffers / limit);

        const offers = await Offer.find(filter).sort({createdAt:-1})
            .populate('product category')
            .skip(skip)
            .limit(limit);

        const books = await Book.find({ isDeleted: false });
        const genres = await Genre.find({ isListed: false });

        res.render('offer', { offers, page, totalPages, books, genres,searchQuery:req.query.search||'' });
    } catch (error) {
        console.error('Error Loading Offer:', error);
        res.status(500).send("Internal Server Error");
    }
};

const createOffer = async (req, res) => {
    try {
        const { offerType, product, category, referralCode, discountType, discountValue, startDate, endDate, isActive } = req.body;

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
            offerData.referralCode = referralCode;
        }

        let newOffer = new Offer(offerData);
        await newOffer.save();
        return res.status(200).json({success:true,message:'Offer Created Successfully'})
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({success:false,message:'Error creating offer'});
    }
};

const editOffer = async (req, res) => {
    try {
        console.log('hellosdfghjk');
        
        const offerId = req.params.offerId;
        const { offerType, product, category, referralCode, discountType, discountValue, startDate, endDate } = req.body;

        if (!offerType || !discountType || !discountValue || !startDate || !endDate) {
            return res.status(400).send('Please fill all fields');
        }

        const today = new Date().toISOString().split("T")[0];
        if (new Date(startDate) < new Date(today)) {
            return res.status(400).json({ message: "Start Date cannot be in the past." });
        }
        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ message: "End Date must be after the Start Date." });
        }

        let updatedData = { offerType, discountType, discountValue, startDate, endDate };
        if (offerType === 'Product') updatedData.product = product;
        if (offerType === 'Category') updatedData.category = category;
        if (offerType === 'Referral') updatedData.referralCode = referralCode;

        const updatedOffer = await Offer.findByIdAndUpdate(offerId, updatedData, { new: true });

        if (!updatedOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.status(200).json({
            success: true,
            message: "Offer updated successfully",
           
          
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.error('Error', error);
    }
};

const toggleOfferStatus = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        offer.isActive = !offer.isActive;
        await offer.save();
        return res.status(200).json({success:true,message:'Offer Status Changed'});
    } catch (error) {
        console.error('Error', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { loadOfferPage, createOffer, editOffer, toggleOfferStatus };
