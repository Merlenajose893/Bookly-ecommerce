const {Book}=require('../models/bookSchema');
const {Genre}=require('../models/GenresSchema');
const {User}=require('../models/userSchema');
const mongoose=require('mongoose');
const uploads=require('../middlewares/upload');
const fs=require('fs');
const fsPromises=require('fs').promises;
const path=require('path');
const sharp = require('sharp');



// const addProducts = async (req, res) => {
//   try {
//     // Pagination logic (if needed, add here)
    
//     // Adding product logic
//     console.log(req.files);
    
//     const { title, author, description, regularPrice, salesPrice, quantity, genre, isbn, format } = req.body;

//     // Handle file uploads
//     const uploadDir = path.join(__dirname, '../public/uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
    
//     const imageFields = ['image1', 'image2', 'image3', 'image4'];
//     const processedImages = [];
    
//     for (const field of imageFields) {
//       if (req.files[field]?.length > 0) {
//         const originalPath = req.files[field][0].path;
//         const outputFileName = `cropped-${Date.now()}-${req.files[field][0].originalname}`;

//         const outputPath = path.join(uploadDir, outputFileName);
//         await sharp(originalPath)
//           .resize({ width: 800, fit: sharp.fit.cover })
//           .toFormat('jpeg')
//           .jpeg({ quality: 80 })
//           .toFile(outputPath);

//         processedImages.push(`/uploads/${outputFileName}`);
        
//         // Delete the original uploaded image after processing
//         await fsPromises.unlink(originalPath);
//       }
//     }

//     // Validate and process genres
//     const genreNames = Array.isArray(genre) ? genre : genre.split(',').map((g) => g.trim());
//     const genreDocs = await Genre.find({ name: { $in: genreNames } });
//     if (genreDocs.length !== genreNames.length) {
//       throw new Error('Some genres are invalid or not found.');
//     }

//     // Save book
//     const newBook = new Book({
//       title,
//       author,
//       description,
//       regularPrice,
//       salesPrice,
//       quantity,
//       isbn,
//       format,
//       genres: genreDocs.map((g) => g._id),
//       images: processedImages,  // Use processedImages here
//     });

//     await newBook.save();
//     res.redirect('/admin/books');
//   } catch (error) {
//     console.error('Error adding product:', error);
//     res.status(500).json({ message: 'An error occurred.', error });
//   }
// };

const addProducts = async (req, res) => {
  try {
    const books = req.body;
    console.log('Received request body:', books);

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
      return res.status(400).json("Book already exists");
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
      return res.status(400).json({ error: "At least 2 images are required for the book." });
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
    const { title, author, description, regularPrice, salesPrice, quantity, genre, isbn, formats } = req.body;

    const book = await Book.findById(bookId).populate('genres');
    if (!book) {
      return res.status(404).json({ message: 'Product Not Found' });
    }

    if (isbn) book.isbn = isbn;
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (regularPrice) book.regularPrice = regularPrice;
    if (salesPrice) book.salesPrice = salesPrice;
    if (quantity) book.quantity = quantity;
    if (formats) book.formats = formats; // Added this line

    if (genre) {
      let genreIds = genre;
      if (typeof genre === 'string') {
        genreIds = genre.split(',').map((g) => g.trim());
      }

      const genreDocs = await Genre.find({ _id: { $in: genreIds } });
      if (genreDocs.length !== genreIds.length) {
        const unmatchedGenres = genreIds.filter(id => !genreDocs.some(doc => doc._id.toString() === id));
        return res.status(400).json({ message: 'Invalid Genre', unmatchedGenres });
      }

      book.genres = genreDocs.map((g) => g._id);
    }

    if (req.files) {
      const imageFields = ['image1', 'image2', 'image3', 'image4'];
      const imagePaths = [];

      for (const field of imageFields) {
        if (req.files[field]) {
          const imagePath = req.files[field][0].path.replace(/\\/g, '/');
          imagePaths.push(imagePath);
        }
      }

      if (imagePaths.length > 0) {
        book.images = imagePaths;
      }
    }

    const updatedBook = await book.save();
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
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Number of items per page
    const skip = (page - 1) * limit;
    const genre = req.query.genre || '';
    const search = req.query.search || '';

    // Fetch all genres
    const genres = await Genre.find({});

    // Create filter for searching by title
    const filter = {
      title: { $regex: search, $options: 'i' }, // Case insensitive search for title
    };

    // If a genre is selected, add it to the filter
    if (genre) {
      filter.genres = genre; // The genre field stores an array of ObjectIds in the Book model
    }

    // Fetch the books from the database
    const books = await Book.find(filter).skip(skip).limit(limit).populate('genres','name');
    const count = await Book.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);

    // Pass the data to the EJS view
    res.render('books', {
      books,
      search,
      page,
      totalPages,
      genre,
      genres,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const deleteSingleImage=async(req,res)=>
{
  try {
    const {imageNameToServer,bookIdToServer}=req.body;
    const book=await Book.findByIdAndUpdate(bookIdToServer,{$pull:{bookImage:imageNameToServer}});
    const imagePath=path.join("public","uploads","re-image",imageNameToServer);
    if(fs.existsSync(imagePath)){
      await fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameToServer} deleted successfully`);
      
    }
    else{
      console.log(`Image ${imageNameToServer} not found`);
      
    }
    res.send({status:true});
  } catch (error) {
    res.redirect('/pageerror');
  }
}

const deleteProduct = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId); // Find book by ID
    console.log("Book ID:", bookId);
    console.log("Images:", book.images); // Log the images field

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
    console.log("Book ID:", bookId);
    console.log("Images:", book.images); // Log the images field

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


module.exports = { addProducts,editProduct,getAllBooks,toggleProductStatus,deleteProduct,undeleteProduct};
  
  







  
  


