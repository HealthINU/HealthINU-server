const express = require("express");
const secret = "dadada";
const router = express.Router();
const passport = require("passport");
//  유저 정보 수정하는 함수 가져오기
const { patch_user } = require("../controllers/user");
const { delete_user } = require("../controllers/user");
const { patch_record } = require("../controllers/info");
const { get_equipment } = require("../controllers/info");
const { get_own } = require("../controllers/info");
const { get_record } = require("../controllers/info");
const { add_record } = require("../controllers/info");
const { add_own } = require("../controllers/info");
const { delete_record } = require("../controllers/info");
const { delete_own } = require("../controllers/info");
const { get_rank } = require("../controllers/user");
//const { check_attendance_quest } = require("../controllers/info");
const { attendance_quest } = require("../controllers/info");

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

//  DELETE /info/user
//  소유 정보 삭제하기
router.delete(
    "/user/:user_num",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    delete_user
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

//  POST /info/own
//  소유 정보 추가하기
router.post(
    "/own",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    add_own
);

//  DELETE /info/own
//  소유 정보 삭제하기
router.delete(
    "/own/:equipment_num",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    delete_own
);

//  GET /info/record
//  기록 정보 가져오기
router.get(
    "/record",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_record
);

//  POST /info/record
//  기록 정보 추가하기
router.post(
    "/record",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    add_record
);

//  PATCH /info/record
//  기록 정보 수정하기
//  날짜, 횟수, 무게만 수정 가능
router.patch(
    "/record",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    patch_record
);

//  DELETE /info/record
//  기록 정보 삭제하기
router.delete(
    "/record/:record_num",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    delete_record
);

// GET /info/rank
// 랭킹 정보 가져오기
router.get(
    "/rank",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_rank
);

// GET /info/quest
// 퀘스트 정보 가져오기
router.get(
    "/quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    //check_attendance_quest,
    attendance_quest
);

module.exports = router;