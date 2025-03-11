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
    console.log('Received request body:', books);
    if (!books) {
      return res.redirect('/admin/books', { message: 'No books provided' });
    }

    // Access the genre ID
    const genreId = books.books.genre; // Assuming the genre ID is being sent from the client
    console.log('Genre ID:', genreId);

    // Find the genre by ID
    const genre = await Genre.findById(genreId);
    console.log('Found Genre:', genre);

    // Check if the genre exists
    if (!genre) {
      return res.status(400).json({ error: 'Invalid Genre ID' });
    }

    // Check if the book already exists
    const bookExists = await Book.findOne({ title: books.title });
    if (bookExists) {
      return res.status(400).json('Book already exists');
    }

    // Handle file uploads for images
    const images = [];
    if (req.files) {
      const imageFields = ['image1', 'image2', 'image3', 'image4'];
      for (const field of imageFields) {
        if (req.files[field]) {
          images.push(req.files[field][0].filename);
        }
      }
    }

    // Ensure at least 2 images exist
    if (images.length < 2) {
      return res.status(400).json({ error: 'At least 2 images are required for the book.' });
    }

    // Create a new book
    const newBook = new Book({
      title: books.title,
      author: books.author,
      publisher: books.publisher,
      description: books.description,
      regularPrice: books.regularPrice,
      genres: [genreId], // Store the genre ID as a reference
      salesPrice: books.salesPrice,
      createdOn: new Date(),
      quantity: books.quantity,
      isbn: books.isbn,
      formats: books.formats || '', // Split formats into an array if necessary
      images: images, // Attach the images
    });

    // Save the new book to the database
    await newBook.save();
    return res.redirect('/admin/books');
  } catch (error) {
    console.error('Error saving book:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const editProduct = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, description, regularPrice, salesPrice, quantity, genre, isbn, formats } =
      req.body;

    const book = await Book.findById(bookId).populate('genres');
    if (!book) {
      return res.status(404).json({ message: 'Product Not Found' });
    }

    // Update the fields if provided
    if (isbn) book.isbn = isbn;
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (regularPrice) book.regularPrice = regularPrice;
    if (salesPrice) book.salesPrice = salesPrice;
    if (quantity) book.quantity = quantity;
    if (formats) book.formats = formats;

    // Update genres if provided
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

    // Handle image updates without overwriting existing images
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
        book.images = [...book.images, ...newImagePaths]; // Append new images to the existing array
      }
    }

    // Save the updated book document
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

    // Toggle the `isDeleted` status
    book.isDeleted = !book.isDeleted;
    await book.save();

    res.redirect('/admin/books');
  } catch (error) {
    console.error('Error in toggleProductStatus:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Assuming you're using a MongoDB model called 'Book'
const getAllBooks = async (req, res) => {
  try {
    // console.log(req.query.search);
   
    const { search, genre } = req.query;
    console.log("Raw Query:", req.query);

    
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Number of items per page
    const skip = (page - 1) * limit;
    // const genre = req.query.genre || '';
    // const search = req.query.search || '';

    // Fetch all genres
    const genres = await Genre.find({});
    console.log(genres);
    

    // Create filter for searching by title
    // const filter={};
    // if (search) {
    //   filter.title = { $regex: search, $options: 'i' };
    // }
    // if(genre)
    // {
    //   filter.genres = genre;
    // }
    const filter = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (genre) filter.genres = genre;

    // Debug the filter
    console.log("Final Filter:", filter)

    // If a genre is selected, add it to the filter
   console.log('Filter Object',filter);
   

    // Fetch the books from the database
    const books = await Book.find(filter).skip(skip).limit(limit).populate('genres', 'name');
    const count = await Book.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);
    let message = '';

    // Pass the data to the EJS view
    res.render('books', {
      books,
      searchQuery:search,
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

    // Validate Book ID
    if (!mongoose.Types.ObjectId.isValid(bookIdToServer)) {
      console.error('Invalid Book ID:', bookIdToServer);
      return res.status(400).json({ status: false, error: 'Invalid Book ID' });
    }

    // Update book document to remove the image reference
    const book = await Book.findByIdAndUpdate(
      bookIdToServer,
      { $pull: { images: imageNameToServer } }, // Ensure you're updating the correct field (images instead of bookImage)
      { new: true },
    );

    if (!book) {
      console.error('Book not found');
      return res.status(404).json({ status: false, error: 'Book not found' });
    }

    console.log('Updated book:', book);

    // Delete the image file
    const imagePath = path.join(__dirname, '..', 'Public', 'uploads', imageNameToServer);
    console.log('Image Path:', imagePath);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameToServer} deleted successfully`);
      return res.json({ status: true, message: 'Image deleted successfully' });
    } else {
      console.warn(`Image ${imageNameToServer} not found`);
      return res.status(404).json({ status: false, error: `Image ${imageNameToServer} not found` });
    }
  } catch (error) {
    console.error('Error in deleteSingleImage:', error);
    return res
      .status(500)
      .json({ status: false, error: 'Error deleting image', message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId); // Find book by ID
    console.log('Book ID:', bookId);
    console.log('Images:', book.images); // Log the images field

    if (!book) {
      return res.status(400).json({ message: 'Book not found' });
    }

    // Soft delete the book by marking it as deleted
    book.isDeleted = true; // Set the book as deleted
    await book.save(); // Save the updated book

    res.redirect('/admin/books'); // Redirect after soft delete
  } catch (error) {
    console.error('Error in deleteProduct:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const undeleteProduct = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId); // Find book by ID
    console.log('Book ID:', bookId);
    console.log('Images:', book.images); // Log the images field

    if (!book) {
      return res.status(400).json({ message: 'Book not found' });
    }

    // Soft delete the book by marking it as deleted
    book.isDeleted = false; // Set the book as deleted
    await book.save(); // Save the updated book

    res.redirect('/admin/books'); // Redirect after soft delete
  } catch (error) {
    console.error('Error in deleteProduct:', error.message);
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
