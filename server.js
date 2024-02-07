const express = require("express");
const app = express();

//  환경이 development인지 production인지 확인
const ENV = process.env.NODE_ENV || "development";
//  config/config.json에서 환경에 따른 설정값 가져오기
const config = require("./config/config.json")[ENV];
//  현재 실행되고 있는 서버 URL 가져오기
const URL = config.URL;

const passport = require("passport");
const jwt = require("jsonwebtoken");
const JwtStrategy = require("passport-jwt").Strategy;
const secret = "dadada";
// const passport = require("passport");
// const session = require("express-session");
// const session = require('express-session');
const mainRouter = require("./routes/main");
const imageProcessingRouter = require("./routes/imageProcessing");
const authRouer = require("./routes/auth");
const passportConfig = require("./passport");
const { sequelize } = require("./models");

passportConfig();
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

const bodyExtractor = (req) => {
  const { token } = req.body;
  return token;
};

const opts = {
  secretOrKey: secret,
  jwtFromRequest: bodyExtractor,
};

// module.exports = new JwtStrategy(opts, (user, done) => {
//   done(null, user);
// });

// ---
passport.use("jwt", jwt);

// passport.use(jwt);

// app.use((req, res, next) => {
//   if (!req.body.token) {
//     next();
//     return;
//   }

//   return passport.authenticate("jwt")(req, res, next);
// });

app.use(passport.initialize());

app.use("/", mainRouter); // 메인화면 라우터
app.use("/imageProcessing", imageProcessingRouter); // 이미지처리 라우터
app.use("/auth", authRouer); // 인증 라우터

// app.use(session({
//   secret: 'mysecret',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: false }
// }))

// app.use(passport.session());
// app.use((req, res, next) => {
//   if (!req.cookies.token) {
//       next();
//       return;
// }
// return passport.authenticate('jwt')(req, res, next);
// });

// passport 아직 미완성, 테스트용
/*
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/login.html"));
});

function isLoggedIn(req, res, next){
  req.user ? next() : res.sendStatus(401);
}

app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get('/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/auth/google/protected',
        failureRedirect: '/auth/google/failure'
}));

app.get('/auth/google/protected', isLoggedIn, (req, res) => {
  let name = req.user.displayName;
  res.send(`Hello ${name}`);
});

app.get('/auth/google/failure', isLoggedIn, (req, res) => {
  res.send("Something went wrong!");
});

app.get('/auth/google/logout', (req, res) => {
  req.session.destroy ();
  res.send("See you again!");
});
*/

app.use(function (req, res, next) {
  // 해당 라우터를 찾을 수 없을 경우
  res.status(404).send("Sorry cant find that!");
});

app.listen(8080, function () {
  console.log("Server is running...");
});
