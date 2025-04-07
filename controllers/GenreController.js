const { Genre } = require('../models/GenresSchema');
const { Book } = require('../models/bookSchema');
const mongoose = require('mongoose');

const genreInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search ? req.query.search.trim() : '';
    const filter = searchQuery ? { name: { $regex: new RegExp(searchQuery, 'i') } } : {};

    const genres = await Genre.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const totalCategories = await Genre.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / limit);
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

    res.render('genres', {
      genres,
      searchQuery,
      currentPage: page,
      totalPages,
      totalCategories,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      itemsPerPage: limit,
      pageNumbers,
    });
  } catch (error) {
    res.redirect('/pageerror');
  }
};

const addGenre = async (req, res) => {
  let { name, description } = req.body;

  try {
    name = name.trim().toLowerCase();

    const existingGenre = await Genre.findOne({ name });

    if (existingGenre) {
      return res.status(400).json({ error: 'Genre already exists' });
    }

    const newGenre = new Genre({ name, description });
    await newGenre.save();

    return res.redirect('/admin/genres');
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Genre already exists' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


const listCategory = async (req, res) => {
  try {
    const id = req.query.id;
    await Genre.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect('/admin/genre');
  } catch (error) {
    res.redirect('/pageerror');
  }
};

const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;
    await Genre.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect('/admin/genre');
  } catch (error) {
    res.redirect('/pageerror');
  }
};

const getEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const genre = await Genre.findOne({ _id: id });

    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    res.render('updateGenres', { genre: genre });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const { name, description } = req.body;

    const existingGenre = await Genre.findOne({ name, _id: { $ne: id } });
    if (existingGenre) {
      return res.status(400).json({ error: 'Genre already exists' });
    }

    const genre = await Genre.findById(id);
    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    const updatedGenre = await Genre.findByIdAndUpdate(id, { name, description }, { new: true });

    if (updatedGenre) {
      res.redirect('/admin/genres');
    } else {
      res.status(404).json({ error: 'Genre not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const category = await Genre.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    category.isDeleted = !category.isDeleted;
    category.deletedAt = category.isDeleted ? new Date() : null;
    await category.save();

    res.redirect('/admin/genres');
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = {
  genreInfo,
  addGenre,
 
  listCategory,
  unlistCategory,
  pageerror,
  getEditCategory,
  editCategory,
  toggleCategoryDeletion,
};
