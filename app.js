const express = require('express');
const app = express();
const path = require('path');
const userRouters = require('./routes/userRoutes');
require('dotenv').config(); // Correct way to load environment variables
const db = require('./config/db');

// Connect to the database
db();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up view engine and views directories
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views/users'), // User views directory
  path.join(__dirname, 'views/admin')  // Admin views directory
]);

// Serve static files
app.use(express.static(path.join(__dirname, 'Public')));

// Set up routes
app.use("/", userRouters);

// Start the server
app.listen(process.env.PORT, () => {
  console.log('Server is running on port ' + process.env.PORT);
});
console.log('Database connected successfully');
console.log('Server started on port', process.env.PORT);



module.exports = app;
