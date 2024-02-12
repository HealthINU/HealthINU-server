const express = require("express");
const secret = "dadada";
const router = express.Router();
const passport = require("passport");
//  유저 정보 수정하는 함수 가져오기
const { patch_user } = require("../controllers/user");
const { get_equipment } = require("../controllers/info");
const { get_own } = require("../controllers/info");
const { get_record } = require("../controllers/info");

//  GET /info/user
//  유저 정보 가져오기
router.get(
  "/user",
  passport.authenticate("jwt", { session: false, failWithError: true }),
  (req, res) => {
    return res.send(req.user);
  }
);

//  PATCH /info/user
//  유저 정보 수정하기
//  이름, 성별, 키, 몸무게만 수정 가능
router.patch(
  "/user",
  passport.authenticate("jwt", { session: false, failWithError: true }),
  patch_user
);

//  GET /info/equip
//  운동기구 정보 가져오기
router.get(
  "/equip",
  passport.authenticate("jwt", { session: false, failWithError: true }),
  get_equipment
);

//  GET /info/equip
//  운동기구 정보 가져오기
router.get(
    "/equip",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_equipment
);

//  GET /info/own
//  소유 정보 가져오기
router.get(
    "/own",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_own
);

//  GET /info/record
//  기록 정보 가져오기
router.get(
    "/record",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_record
);

module.exports = router;