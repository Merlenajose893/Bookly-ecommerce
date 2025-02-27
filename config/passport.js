const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {User} = require("../models/userSchema");
const env=require('dotenv').config();
const mongoose=require('mongoose');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback', // Ensure this matches your route in Google Console
     // Ensure correct scopes are specified
},
async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("Google Profile:", profile); // Logging profile info

        // Look for an existing user in the database with the Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            // If the user exists, return the user object
            console.log("Existing User:", user);

            return done(null, user);
        } else {
            // If the user does not exist, create a new user
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id
            });

            // Save the new user to the database
            await user.save();

            // Return the newly created user
            console.log("New User Created:", user);
            return done(null, user);
        }
    } catch (error) {
        console.error("Error during authentication:", error); // Detailed error logging
        return done(error, null);
    }
}));

// Serialize user to store in session
passport.serializeUser((user, done) => {
    done(null, user.id);  // Store user id in the session
});

// Deserialize user from session to fetch the user object
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);  // Return the user object to the session
        })
        .catch(err => {
            done(err, null);  // If an error occurs, return the error
        });
});

module.exports = passport;
