const express = require('express');
const router = express.Router();

// const passport = require('passport');
const path = require("path");
// const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

// setUserToken = (res, user) => {
//     const token = jwt.sign(user, secret);
//     res.cookie('token', token); // 클라이언트에 쿠키로 전달
// }

// passport.use(new GoogleStrategy({
//     clientID:     "602403043475-71i4ij4srpk8dffp77e8keaqmth61kk1.apps.googleusercontent.com",
//     clientSecret: "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",
//     callbackURL: "http://www.healthinu.kro.kr:8080/auth/google/callback",
//     passReqToCallback   : true
//   },
//   function(request, accessToken, refreshToken, profile, done) {
//     // User.findOrCreate({ googleId: profile.id }, function (err, user) {
//     //   return done(err, user);
//     // });
//     console.log('GoogleStrategy', accessToken, refreshToken, profile);
//     done(null, profile);
//   }
//   ));
  
//   passport.serializeUser((user, done)=>{
//     done(null, user);
//   });
  
//   passport.deserializeUser((user, done)=>{
//     done(null, user);
//   });
  

router.get("/", function (req, res) {
    res.sendFile(path.resolve(__dirname, '../login.html')); 
});


// router.get('/auth/google', passport.authenticate('google', { scope:
//     [ 'email', 'profile' ] }
// ));

// router.get( '/auth/google/callback',
//     passport.authenticate('google', {
//         successRedirect: '/main',
//         failureRedirect: '/'
// }), (req, res, next) => {
//     setUserToken(res, req.user);
// });

module.exports = router;