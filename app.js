const express = require('express');
const app = express();
const nocache=require('nocache');
const path = require('path');
const multer=require('multer');
const upload=require('./middlewares/upload');
const session=require('express-session');
const userRouters = require('./routes/userRoutes');
const adminRouters=require('./routes/adminRoutes');
require('dotenv').config(); // Correct way to load environment variables
const db = require('./config/db');
const passport=require('./config/passport');
const {checkBlockedUser}=require('./middlewares/check');
// Connect to the database
db();

// Middleware setup
app.use(session({
  secret: 'mySecret', // Replace with a secure, random secret key
  resave: false, 
  saveUninitialized: false, // Avoid saving empty sessions
   // Persistent session store
   cookie: { secure: false } 
}));
// app.use(checkBlockedUser)
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());


// Set up view engine and views directories
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views/users'), // User views directory
  path.join(__dirname, 'views/admin')  // Admin views directory
]);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Set up routes
app.use("/", userRouters);
app.use('/admin',adminRouters);

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port ' + process.env.PORT);
});
console.log('Database connected successfully');
console.log('Server started on port', process.env.PORT);



module.exports = app;
