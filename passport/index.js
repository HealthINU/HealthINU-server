const passport = require("passport");

//  모델들 가져오기
const User = require("../models/user");
const Equipment = require("../models/equipment");

//  전략들 가져오기
const jwtStrategy = require("./jwtStrategy");
const local = require("./localStrategy");
const google = require("./googleStrategy");

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

  //  불러온 Strategy들 실행
  google();
  jwtStrategy();
  local();
};
