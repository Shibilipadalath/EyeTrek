const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const mongoose = require('mongoose');
const User = require('../../models/userModel'); // Adjust the path as needed

require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback: true,
},
async function(req, accessToken, refreshToken, profile, done) {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      if (user.isBlocked) {
        return done(null, null);
      }
      req.session.user_email = user.email;
      return done(null, user);
    } else {
      user = new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        profilePhoto: profile.photos[0].value,
      });
      await user.save();
      req.session.user_email = profile.emails[0].value;
      return done(null, user);
    }
  } catch (error) {
    return done(error, false);
  }
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

const GetGooglelogin = async (req, res) => {
  res.send('<box-icon type="logo" name="google"></box-icon>');
};

const googleAuth = passport.authenticate('google', { scope: ['email', 'profile'] });

const googleAuthCallback = passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/auth/google/failure'
});

const failure = async (req, res) => {
  try {
    return res.render("/login", { message: "The email is temporarily blocked", errMessage: "" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  googleAuth,
  GetGooglelogin,
  isLoggedIn,
  googleAuthCallback,
  failure
};
