const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const secret = "dadada";
// // const { join, login, logout } = require('../controllers/auth');

const router = express.Router();

//  앱의 url로 redirect
//  token과 login 여부 전달
setUserToken = (url, res, user) => {
  const token = jwt.sign(user.user_id, secret); // jwt 토큰 생성
  const isLogin = true;
  res.redirect(`${url}?token=${token}&login=${isLogin}`); // 토큰을 포함한 URL로 리다이렉트
};

// // POST /auth/join
// router.post("/join", join);

// // POST /auth/login
// router.post("/login", login);

// // GET /auth/logout
// router.get("/logout", logout);

// // GET /auth/kakao
// router.get("/kakao", passport.authenticate("kakao"));

// // GET /auth/kakao/callback
// router.get(
//   "/kakao/callback",
//   passport.authenticate("kakao", {
//     failureRedirect: "/?loginError=카카오로그인 실패",
//   }),
//   (req, res) => {
//     res.redirect("/"); // 성공 시에는 /로 이동
//   }
// );

router.get("/google", function (req, res) {
  passport.authenticate("google", {
    scope: ["email", "profile"],
    //  state에 쿼리에 저장된 url 저장
    //  추후 req.query.state로 액세스 가능
    state: req.query.url,
  })(req, res);
});

router.get("/google/callback", function (req, res, next) {
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

module.exports = router;
