const { Book } = require('../models/bookSchema');
const { Genre } = require('../models/GenresSchema');
const { User } = require('../models/userSchema');
const mongoose = require('mongoose');
const uploads = require('../middlewares/upload');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const addProducts = async (req, res) => {
  try {
    const books = req.body;
   
    console.log(req.body);
    

    const genreId = books?.books?.genre
    if(!genreId)
    {
      return res.status(400).json({message:'GenreID is required'})
    }
    let genre = await Genre.findById(genreId);
    if (!genre) return res.status(400).json({ error: "Invalid Genre ID" });

    const bookExists = await Book.findOne({ title: books.title });
    if (bookExists) return res.status(400).json("Book already exists");
    let salesPrice=Number(books.salesPrice)
    let regularPrice=Number(books.regularPrice)
    if(salesPrice>regularPrice)
    {
      return res.status(400).json({message:'Sales Price cannot be greater than Regular Price'})
    }

    const images = req.files
      ? ["image1", "image2", "image3", "image4"].reduce((acc, field) => {
          if (req.files[field]) acc.push(req.files[field][0].filename);
          return acc;
        }, [])
      : [];

    if (images.length < 2) return res.status(400).json({ error: "At least 2 images are required for the book." });

    const newBook = new Book({
      title: books.title,
      author: books.author,
      publisher: books.publisher,
      description: books.description,
      regularPrice: books.regularPrice,
      genres: [genreId],
      salesPrice: books.salesPrice,
      createdOn: new Date(),
      quantity: books.quantity,
      isbn: books.isbn,
      formats: books.formats || "",
      images,
    });

    await newBook.save();
    return res.status(200).json({success:true,message:'Book Added Succesfully'})
  } catch (error) {
    console.error("Error saving book:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const editProduct = async (req, res) => {
  try {
    const { bookId } = req.params;
    let { title, author, description, regularPrice, salesPrice, quantity, genre, isbn, formats } =
      req.body;

    const book = await Book.findById(bookId).populate('genres');
    if (!book) {
      return res.status(404).json({ message: 'Product Not Found' });
    }

    salesPrice=Number(salesPrice)
    regularPrice=Number(regularPrice)
    if (regularPrice < salesPrice) {
      return res.status(400).json({ message: 'Sales Price cannot be greater than Regular Price' });
    }
    if (isbn) book.isbn = isbn;
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (regularPrice) book.regularPrice = regularPrice;
    if (salesPrice) book.salesPrice = salesPrice;
    if (quantity) book.quantity = quantity;
    if (formats) book.formats = formats;

  
    if (genre) {
      let genreIds = genre;
      if (typeof genre === 'string') {
        genreIds = genre.split(',').map((g) => g.trim());
      }

      const genreDocs = await Genre.find({ _id: { $in: genreIds } });
      if (genreDocs.length !== genreIds.length) {
        const unmatchedGenres = genreIds.filter(
          (id) => !genreDocs.some((doc) => doc._id.toString() === id),
        );
        return res.status(400).json({ message: 'Invalid Genre', unmatchedGenres });
      }

      book.genres = genreDocs.map((g) => g._id);
    }

  
    if (req.files) {
      const imageFields = ['image1', 'image2', 'image3', 'image4'];
      const newImagePaths = [];

      for (const field of imageFields) {
        if (req.files[field]) {
          const imagePath = req.files[field][0].path.replace(/\\/g, '/');
          newImagePaths.push(imagePath);
        }
      }

      if (newImagePaths.length > 0) {
        book.images = [...book.images, ...newImagePaths]; 
      }
    }


    const updatedBook = await book.save();
    console.log(updatedBook);
    
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Error in editProduct:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const toggleProductStatus = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(400).json({ message: 'Book not found' });
    }


    book.isDeleted = !book.isDeleted;
    await book.save();

  } catch (error) {
    console.error('Error in toggleProductStatus:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllBooks = async (req, res) => {
  try {
    const { search, genre } = req.query;
    console.log("Raw Query:", req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const genres = await Genre.find({});
    console.log(genres);

    const filter = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (genre) filter.genres = genre;

    console.log("Final Filter:", filter);

    const books = await Book.find(filter).skip(skip).limit(limit).populate('genres', 'name').sort({createdAt:-1});
    const count = await Book.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);
    let message = '';

    res.render('books', {
      books,
      searchQuery: search,
      page,
      totalPages,
      genre,
      genres,
      message,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, bookIdToServer } = req.body;
    console.log('Received data:', req.body);

    if (!mongoose.Types.ObjectId.isValid(bookIdToServer)) {
      console.error('Invalid Book ID:', bookIdToServer);
      return res.status(400).json({ status: false, error: 'Invalid Book ID' });
    }

    const book = await Book.findByIdAndUpdate(
      bookIdToServer,
      { $pull: { images: imageNameToServer } },
      { new: true },
    );

    if (!book) {
      console.error('Book not found');
      return res.status(404).json({ status: false, error: 'Book not found' });
    }

    console.log('Updated book:', book);

    const imagePath = path.join(__dirname, '..', 'Public', 'uploads', imageNameToServer);
    console.log('Image Path:', imagePath);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameToServer} deleted successfully`);
      return res.status(200).json({ status: true, message: 'Image deleted successfully' });
    } else {
      console.warn(`Image ${imageNameToServer} not found`);
      return res.status(404).json({ status: false, error: `Image ${imageNameToServer} not found` });
    }
  } catch (error) {
    console.error('Error in deleteSingleImage:', error);
    return res.status(500).json({ status: false, error: 'Error deleting image', message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId);
    console.log('Book ID:', bookId);
    console.log('Images:', book.images);

    if (!book) {
      return res.status(400).json({ message: 'Book not found' });
    }

    book.isDeleted = true;
    await book.save();
    res.json({ success: true, bookId });
  } catch (error) {
    console.error('Error in deleteProduct:', error.message);
    res.status(500).json({ success:true,message: 'Internal server error' });
  }
};

const undeleteProduct = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId);
    console.log('Book ID:', bookId);
    console.log('Images:', book.images);

    if (!book) {
      return res.status(400).json({ message: 'Book not found' });
    }

    book.isDeleted = false;
    await book.save();
    res.json({ success: true, bookId }); 
  } catch (error) {
    console.error('Error in undeleteProduct:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = {
  addProducts,
  editProduct,
  getAllBooks,
  toggleProductStatus,
  deleteProduct,
  undeleteProduct,
  deleteSingleImage,
};
