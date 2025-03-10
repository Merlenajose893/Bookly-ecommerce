const express = require('express');
const app = express();
const nocache=require('nocache');
const path = require('path');
const flash = require('connect-flash');
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

app.use(nocache());
// Middleware setup
app.use(session({
  secret: 'mySecret',  // Change this to a more secure, random secret in production
  resave: false, 
  saveUninitialized: false,
  cookie: {
      secure: false,  // For non-HTTPS in development
      httpOnly: true, // Helps secure the cookie from client-side JavaScript access
      maxAge: 24 * 60 * 60 * 1000  // Cookie expiration (1 day)
  }
}));
console.log(session);
// app.use(checkBlockedUser)
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});


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
