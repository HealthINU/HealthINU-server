const passport = require("passport");
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const User = require("../models/user");
const secret = "dadada";

module.exports = () => {
  passport.use(
    "jwt",
    new JWTStrategy(
      {
        //  jwt 추출 방식 설정
        //  Bearer Token을 사용
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        //  secret key 설정
        secretOrKey: secret,
      },
      function (payload, done) {
        //  payload에서 user_id를 가져와서 해당 유저를 찾음
        User.findOne({
          where: { user_id: payload.user_id },
          //    attributes는 가져올 컬럼 설정
          //    민감한 정보는 가져오지 않음 (pw 등)
          attributes: [
            "user_id",
            "user_name",
            "user_email",
            "user_gender",
            "user_height",
            "user_weight",
          ],
        })
          .then((user) => {
            return done(null, user);
          })
          .catch((err) => {
            return done(err);
          });
      }
    )
  );
};
