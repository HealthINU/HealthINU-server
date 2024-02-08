const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const secret = "dadada";
const { join, login, logout } = require("../controllers/auth");

const router = express.Router();

//  앱의 url로 redirect
//  token과 login 여부 전달
setUserToken = (url, res, user) => {
  const token = jwt.sign({ user_id: user.user_id }, secret); // jwt 토큰 생성
  res.redirect(`${url}?token=${token}`); // 토큰을 포함한 URL로 리다이렉트
};

//  GET /auth/verify
router.get(
  "/verify",
  passport.authenticate("jwt", { session: false, failWithError: true }),
  (req, res) => {
    return res.status(200).json({ message: "Verified" });
  },
  (err, req, res, next) => {
    return res.status(401).json({ message: "Unauthorized" });
  }
);

// POST /auth/join
router.post("/join", join);

// POST /auth/login
router.post(
  "/login",
  (req, res, next) => {
    console.log(req.body);
    next();
  },
  login
);

// // GET /auth/logout
// router.get("/logout", logout);

//  GET /auth/google
router.get("/google", function (req, res) {
  passport.authenticate("google", {
    scope: ["email", "profile"],
    //  state에 req.query.url 저장
    //  state는 /google/callback에서 req.query.state로 액세스 가능
    state: req.query.url,
  })(req, res);
});

//  GET /auth/google/callback
router.get("/google/callback", function (req, res, next) {
  passport.authenticate("google", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }

    //  /google 에서 state에 저장한 url 값 불러오기
    const url = req.query.state;

    req.login(user, { session: false }, function (err) {
      if (err) {
        return next(err);
      }
      //  url로 redirect
      setUserToken(url, res, req.user);
    });
  })(req, res, next);
});

module.exports = router;
