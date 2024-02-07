const passport = require("passport");
// const local = require("./localStrategy");
const google = require("./googleStrategy");
const User = require("../models/user");

module.exports = () => {
  passport.serializeUser((user, done) => {
    console.log("serialize");
    done(null, user.user_id);
  });

  passport.deserializeUser((user_id, done) => {
    console.log("deserialize");
    User.findOne({
      where: { user_id },
    })
      .then((user) => {
        console.log("user", user);
        done(null, user);
      })
      .catch((err) => done(err));
  });

  // local();
  google();
};
