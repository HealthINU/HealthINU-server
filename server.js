const express = require("express");
const app = express();
// const passport = require("passport");
// const session = require("express-session");
const mainRouter = require('./routes/main');
const imageProcessingRouter = require('./routes/imageProcessing');
// require("./auth");

app.use('/', mainRouter); // 메인화면 라우터
app.use('/imageProcessing', imageProcessingRouter); // 이미지처리 라우터

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

app.use(function(req, res, next) {
  // 해당 라우터를 찾을 수 없을 경우
  res.status(404).send('Sorry cant find that!');
});

app.listen(8080, function () {
  console.log("Server is running...");
});