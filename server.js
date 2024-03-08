const express = require("express");
const app = express();

const passport = require("passport");
//  ./passport/index.js 가져오기
const passportConfig = require("./passport");
const cors = require("cors");
app.use(cors());

const jwt = require("jsonwebtoken");
const secret = "dadada";

//  각종 라우터 가져오기
const mainRouter = require("./routes/main");
const imageProcessingRouter = require("./routes/imageProcessing");
const authRouer = require("./routes/auth");
const infoRouter = require("./routes/info");
const imageRouter = require("./routes/imageProcessing");

//  db.sequelize 가져오기
const { sequelize } = require("./models");
const { info } = require("console");

//  jwt 토큰 생성 테스트
console.log(`jwt : ${jwt.sign({ user_id: "godong" }, secret)}`);

//  ./passport/index.js 실행
passportConfig();

//  db 연결
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

//  각종 미들웨어 설정
app.use(express.json());
app.use(passport.initialize());

//  라우터 설정
app.use("/", mainRouter); // 메인화면 라우터
app.use("/imageProcessing", imageProcessingRouter); // 이미지처리 라우터
app.use("/auth", authRouer); // 인증 라우터
app.use("/info", infoRouter); // 정보 요청 라우터
app.use("/image", imageRouter); // 이미지 라우터

//  404 에러 처리
app.use(function (req, res, next) {
  // 해당 라우터를 찾을 수 없을 경우
  res.status(404).send("Sorry cant find that!");
});

//  그 외 에러 처리
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    messenge: err.message,
  });
});

app.listen(8080, function () {
  console.log("Server is running...");
});

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

function isLoggedIn(req, res, next){
  req.user ? next() : res.sendStatus(401);
}

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
