const express = require("express");
const secret = "dadada";
const router = express.Router();
const passport = require("passport");
//  유저 정보 수정하는 함수 가져오기
const { patch_user } = require("../controllers/user");
const { delete_user } = require("../controllers/user");
// const { patch_record } = require("../controllers/info");
const { get_equipment } = require("../controllers/info");
const { get_own } = require("../controllers/info");
const { get_record } = require("../controllers/info");
const { add_record } = require("../controllers/info");
const { add_own } = require("../controllers/info");
// const { delete_record } = require("../controllers/info");
const { delete_own } = require("../controllers/info");
const { get_rank } = require("../controllers/user");
const { get_attendance_quest } = require("../controllers/info");
const { get_attendance_day } = require("../controllers/info");
const { accept_attendance_quest } = require("../controllers/info");
const { finish_attendance_quest } = require("../controllers/info");
const { get_exercise_quest } = require("../controllers/info");
const { accept_exercise_quest } = require("../controllers/info");
const { finish_exercise_quest } = require("../controllers/info");
const { get_finished_quest } = require("../controllers/info");
const { add_body_info } = require("../controllers/info");
const { get_body_info } = require("../controllers/info");
const { add_division_info } = require("../controllers/info");
const { get_division_info } = require("../controllers/info");

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
// router.patch(
//     "/record",
//     passport.authenticate("jwt", { session: false, failWithError: true }),
//     patch_record
// );

//  DELETE /info/record
//  기록 정보 삭제하기
// router.delete(
//     "/record/:record_num",
//     passport.authenticate("jwt", { session: false, failWithError: true }),
//     delete_record
// );

// GET /info/rank
// 랭킹 정보 가져오기
router.get(
    "/rank",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_rank
);

// GET /info/attendance_quest
// 출석 퀘스트 정보 가져오기
router.get(
    "/attendance_quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_attendance_quest
);

// GET /info/attendance_day
// 출석일 가져오기
router.get(
    "/attendance_day",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_attendance_day
);

// GET /info/accept_attendance_quest
// 출석 퀘스트 수락하기
router.get(
    "/accept_attendance_quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    accept_attendance_quest
);

// GET /info/finish_attendance_quest
// 퀘스트 완료하기
router.get(
    "/finish_attendance_quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    finish_attendance_quest
);

// GET /info/exercise_quest
// 운동 퀘스트 정보 가져오기
router.get(
    "/exercise_quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_exercise_quest
);

// GET /info/accept_exercise_quest
// 운동 퀘스트 수락하기
router.get(
    "/accept_exercise_quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    accept_exercise_quest
);

// GET /info/finish_exercise_quest
// 운동 퀘스트 완료하기
router.get(
    "/finish_exercise_quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    finish_exercise_quest
);

// GET /info/finished_quest
// 완료된 퀘스트 정보 가져오기
router.get(
    "/finished_quest",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_finished_quest
);

// POST /info/body
// 신체 정보 추가하기 (Before/After 기능)
router.post(
    "/body",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    add_body_info
);

// GET /info/body
// 과거 신체 정보 가져오기 (Before/After 기능)
router.get(
    "/body",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_body_info
);


// POST /info/division
// 분할 정보 추가하기 (맞춤형 분할운동 기능)
router.post(
    "/division",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    add_division_info
);

// POST /info/division_exercise
// 분할운동 정보 가져오기 (맞춤형 분할운동 기능)
router.post(
    "/division_exercise",
    passport.authenticate("jwt", { session: false, failWithError: true }),
    get_division_info
);

module.exports = router;