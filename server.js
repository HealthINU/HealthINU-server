const express = require("express");
const app = express();

//  환경이 development인지 production인지 확인
const ENV = process.env.NODE_ENV || "development";
//  config/config.json에서 환경에 따른 설정값 가져오기
const config = require("./config/config.json")[ENV];
//  현재 실행되고 있는 서버 URL 가져오기
const URL = config.URL;

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const jwt = require("jsonwebtoken");
const JwtStrategy = require("passport-jwt").Strategy;
const secret = "dadada";
// const passport = require("passport");
// const session = require("express-session");
// const session = require('express-session');
const loginRouter = require("./routes/login");
const mainRouter = require("./routes/main");
const imageProcessingRouter = require("./routes/imageProcessing");
// require("./auth");

//  앱의 url로 redirect
//  token과 login 여부 전달
setUserToken = (url, res, user) => {
  const token = jwt.sign(user, secret); // jwt 토큰 생성
  const isLogin = true;
  res.redirect(`${url}?token=${token}&login=${isLogin}`); // 토큰을 포함한 URL로 리다이렉트
};

const bodyExtractor = (req) => {
  const { token } = req.body;
  return token;
};

const opts = {
  secretOrKey: secret,
  jwtFromRequest: bodyExtractor,
};

module.exports = new JwtStrategy(opts, (user, done) => {
  done(null, user);
});

// ---
passport.use("jwt", jwt);

// passport.use(jwt);

app.use("/", loginRouter);

app.get("/auth/google", function (req, res) {
  passport.authenticate("google", {
    scope: ["email", "profile"],
    //  state에 쿼리에 저장된 url 저장
    //  추후 req.query.state로 액세스 가능
    state: req.query.url,
  })(req, res);
});

app.get("/auth/google/callback", function (req, res, next) {
  passport.authenticate("google", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }

    //  /auth/google 에서 state에 저장한 url 값 불러오기
    const url = req.query.state;

    req.login(user, { session: false }, function (err) {
      if (err) {
        return next(err);
      }
      setUserToken(url, res, req.user);
    });
  })(req, res, next);
});

app.use((req, res, next) => {
  if (!req.body.token) {
    next();
    return;
  }

  return passport.authenticate("jwt")(req, res, next);
});
app.use("/", mainRouter); // 메인화면 라우터
app.use("/imageProcessing", imageProcessingRouter); // 이미지처리 라우터
// app.use(session({
//   secret: 'mysecret',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: false }
// }))
app.use(passport.initialize());
// app.use(passport.session());
// app.use((req, res, next) => {
//   if (!req.cookies.token) {
//       next();
//       return;
// }
// return passport.authenticate('jwt')(req, res, next);
// });

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "602403043475-71i4ij4srpk8dffp77e8keaqmth61kk1.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: `${URL}/auth/google/callback`,
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      // User.findOrCreate({ googleId: profile.id }, function (err, user) {
      //   return done(err, user);
      // });
      console.log("GoogleStrategy", accessToken, refreshToken, profile);
      var user = { id: "hello", email: "hello@naver.com" };

      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

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
