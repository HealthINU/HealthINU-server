const passport = require("passport");
//  구글 Strategy 가져오기
const google = require("./googleStrategy");
//  User 모델 가져오기
const User = require("../models/user");
//  jwt Strategy 가져오기
const jwtStrategy = require("./jwtStrategy");
// const local = require("./localStrategy");

module.exports = () => {
  //  아직 local를 쓰지 않으므로 serialize, deserialize는 크게 의미 없음
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
  //  불러온 Strategy들 실행
  google();
  jwtStrategy();
};
