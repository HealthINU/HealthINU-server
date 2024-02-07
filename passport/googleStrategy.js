const passport = require("passport");
// const KakaoStrategy = require("passport-kakao").Strategy;
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("../models/user");

//  환경이 development인지 production인지 확인
const ENV = process.env.NODE_ENV || "development";
//  config/config.json에서 환경에 따른 설정값 가져오기
const config = require("../config/config.json")[ENV];
//  현재 실행되고 있는 서버 URL 가져오기
const URL = config.URL;

module.exports = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID:
          "602403043475-71i4ij4srpk8dffp77e8keaqmth61kk1.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: `${URL}/auth/google/callback`,
        passReqToCallback: true,
      },
      async (request, accessToken, refreshToken, profile, done) => {
        const user_info = {
          id: profile.email.split("@")[0],
          email: profile.email,
        };

        console.log("user_info", user_info);

        try {
          const exUser = await User.findOne({
            where: { user_id: user_info.id },
          });
          if (exUser) {
            done(null, exUser);
          } else {
            const newUser = await User.create({
              user_name: user_info.id,
              user_id: user_info.id,
              user_pw: user_info.id,
              user_email: user_info.email,
              user_height: 181,
              user_weight: 73,
            });
            done(null, newUser);
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
