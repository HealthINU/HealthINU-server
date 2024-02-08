const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const secret = "dadada";

exports.join = async (req, res, next) => {
  const { user_name, user_id, user_pw, user_email } = req.body;
  try {
    const exUser = await User.findOne({ where: { user_id } });
    if (exUser) {
      return res.status(403).json({
        message: "Already exist",
      });
    }
    const hash = await bcrypt.hash(user_pw, 8);
    await User.create({
      user_name,
      user_id,
      user_pw: hash,
      user_email,
    });
    const token = jwt.sign({ user_id: user_id }, secret);
    return res.status(200).json({
      token,
      message: "Join success",
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.status(400).json({
        message: "Login fail",
      });
    }
    const token = jwt.sign({ user_id: user.user_id }, secret);
    return res.status(200).json({
      token,
      message: "Login success",
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
};
