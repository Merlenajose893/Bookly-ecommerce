const { Genre } = require('../models/GenresSchema');
const { Book } = require('../models/bookSchema');
const mongoose = require('mongoose');

// Genre Info with Pagination
const genreInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page
    const limit = 4; // Number of items per page
    const skip = (page - 1) * limit; // Items to skip

    // Fetch genres with pagination
    const genres = await Genre.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);

    // Total categories and pages
    const totalCategories = await Genre.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    // Generate array for pagination
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

    // Render the template
    res.render('genres', {
      genres: genres,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      itemsPerPage: limit,
      pageNumbers: pageNumbers, // Pass page numbers
    });
  } catch (error) {
    console.error(error);
    res.redirect('/pageerror');
  }
};

// Add Genre Function
const addGenre = async (req, res) => {
  let { name, description } = req.body;

  try {
    // Trim and convert name to lowercase to ensure case-insensitivity
    name = name.trim().toLowerCase();

    // Check if genre already exists (case-insensitive)
    const existingGenre = await Genre.findOne({ name });

    if (existingGenre) {
      return res.status(400).json({ error: 'Genre already exists' });
    }

    // If not, create a new genre
    const newGenre = new Genre({ name, description });
    await newGenre.save();

    return res.redirect('/admin/genres');
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Genre already exists' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};





// Add Category Offer Function
const addCategoryOffer = async (req, res) => {
  try {
    const percentage = parseInt(req.body.percentage);
    const categoryId = req.body.categoryId;
    const category = await Genre.findById(categoryId);

    if (!category) {
      return res.status(404).json({ status: false, message: 'Genre not found' });
    }

    const books = await Book.find({ category: category._id });

    const hasBookOffer = books.some((book) => book.bookOffer > percentage);
    if (hasBookOffer) {
      return res.json({ status: false, message: 'Books in this genre already have offers' });
    }

    // Update the category offer
    await Genre.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

    // Reset book offers and sale prices
    for (const book of books) {
      book.bookOffer = 0;
      book.salePrice = book.regularPrice;
      await book.save();
    }

    res.json({ status: true });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

// Remove Category Info (Offer Removal)
const removeCategoryInfo = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const category = await Genre.findById(categoryId);

    if (!category) {
      return res.status(404).json({ status: false, message: 'Genre not found' });
    }

    const percentage = category.categoryOffer;
    const books = await Book.find({ category: category._id });

    if (books.length > 0) {
      for (const book of books) {
        book.salePrice += Math.floor(book.regularPrice * (percentage / 100));
        book.bookOffer = 0;
        await book.save();
      }
    }

    category.categoryOffer = 0;
    await category.save();

    res.json({ status: true });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

// List Category Function (Hide Category)
const listCategory = async (req, res) => {
  try {
    const id = req.query.id;
    await Genre.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect('/admin/genre');
  } catch (error) {
    res.redirect('/pageerror');
  }
};

// Unlist Category Function (Show Category)
const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;
    await Genre.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect('/admin/genre');
  } catch (error) {
    res.redirect('/pageerror');
  }
};

// Edit Category Function (Fetch Category for Editing)
const getEditCategory = async (req, res) => {
  try {
    const id = req.query.id; // Use params instead of query
    const genre = await Genre.findOne({ _id: id });

    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    res.render('updateGenres', { genre: genre });
  } catch (error) {
    console.error('Error fetching genre for update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Category ID:', id); // Log the ID to ensure it's being passed correctly

    // Validate ID format (using mongoose)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const { name, description } = req.body;
    console.log('Request Body:', req.body); // Log the request body to ensure form data is received

    // Check if genre name already exists (except for the current one)
    const existingGenre = await Genre.findOne({ name, _id: { $ne: id } });
    if (existingGenre) {
      return res.status(400).json({ error: 'Genre already exists' });
    }

    // Check if the genre exists by ID before updating
    const genre = await Genre.findById(id);
    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    // Update the genre
    const updatedGenre = await Genre.findByIdAndUpdate(
      id,
      {
        name,
        description,
        
      },
      { new: true },
    );

    if (updatedGenre) {
      res.redirect('/admin/genres');
    } else {
      res.status(404).json({ error: 'Genre not found' });
    }
  } catch (error) {
    console.error('Error in editCategory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Error Page (For 404 or Internal Errors)
const pageerror = async (req, res) => {
  try {
    res.render('pageerror', { title: 'Page Not Found' });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};
const toggleCategoryDeletion = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Category ID to toggle deletion:', id);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    // Check if the category exists
    const category = await Genre.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Toggle the deletion status
    category.isDeleted = !category.isDeleted;
    category.deletedAt = category.isDeleted ? new Date() : null; // Set `deletedAt` when deleting
    await category.save();
    console.log(`Category ${category.isDeleted ? 'soft deleted' : 'restored'} successfully`, category);
    res.redirect('/admin/genres');
  } catch (error) {
    console.error('Error in toggleCategoryDeletion:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const toggleGenreStatus = async (req, res) => {
  try {
    const genreId = req.params.id; // Get genre ID from route params
    const isActivate = req.body.action === 'activate'; // Determine action

    // Update the genre status in the database
    Genre.findByIdAndUpdate(genreId, { isDeleted: !isActivate }, { new: true }).then(() => {
      res.redirect('/admin/genres'); // Redirect to the genres list
    });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).send('An error occurred while updating the genre status.');
  }
};

module.exports = {
  genreInfo,
  addGenre,
  addCategoryOffer,
  removeCategoryInfo,
  listCategory,
  unlistCategory,
  pageerror,
  getEditCategory,
  editCategory,
 toggleCategoryDeletion,
}