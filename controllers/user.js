const User = require("../models/user");
const Own = require("../models/own");
const Equipment = require("../models/equipment");
const {Sequelize} = require("sequelize");

// 유저 정보 수정하는 함수
exports.patch_user = (req, res) => {
  //  body에서 key만 리스트로 추출
  const updates = Object.keys(req.body);

  //  이름, 성별, 키, 몸무게만 수정 가능
  const allowedUpdates = [
    "user_name",
    "user_gender",
    "user_height",
    "user_weight",
  ];

  //  updates 중 allowedUpdates에 포함된 것만 to_updates에 저장
  const to_updates = updates.filter((update) =>
    allowedUpdates.includes(update)
  );

  //  to_updates가 비어있으면 에러 메시지 전송
  // if (to_updates.length === 0) {
  //   return res.status(400).send({ error: "Invalid updates!" });
  // }

  //  수정할 정보를 담을 객체
  let to_update_info = {};

  //  to_updates에 있는 키로 req.body에서 값을 가져와 to_update_info에 저장
  to_updates.forEach((update) => (to_update_info[update] = req.body[update]));

  //  유저 정보 수정 ( user_id가 동일한 유저만 )
  User.update(to_update_info, {
    where: {
      user_id: req.user.user_id,
    },
  })
    .then((user) => {
      //  수정 성공 메시지 전송
      res.status(200).send({ message: "User info updated!" });
    })
    .catch((err) => {
      //  수정 실패 메시지 전송
      res.status(400).send({ error: "Invalid updates!" });
    });
};

// 유저 정보 삭제하기
exports.delete_user = (req, res) => {
  // 요청에서 유저 번호(user_num) 추출
  const user_num = req.params.user_num;

  User.destroy({
    where: {
      user_num: user_num,
    },
  })
      .then((deleteCount) => {
        // 삭제 성공 메시지 전송
        if(deleteCount > 0) {
          res.status(200).send({ message: "Success" });
        } else {
          res.status(404).send({ message: "Not found" });
        }
      })
      .catch((err) => {
        // 삭제 실패 메시지 전송
        res.status(400).send({ message: "Server error" });
      });
};

// 유저 정보 레벨(+경험치)순으로 정렬해서 가져오기
exports.get_rank = (req, res) => {
  User.findAll({
      attributes: ["user_name", "user_gender", "user_level", "user_exp"],
      order: [
          ['user_level', 'DESC'], // 레벨에 따라 내림차순 정렬
          ['user_exp', 'DESC'], // 경험치에 따라 내림차순 정렬
          [Sequelize.literal(`\`User\`.\`user_name\` = '${req.user.user_name}'`), 'DESC'], // 동점자가 있을때는 해당 사용자가 맨 위로 정렬
      ],
  })
      .then((user) => {
        //  가져오기 성공 메시지 전송
        if (user.length > 0) {
          res.status(200).send({ data: user, message: "Success" });
        } else {
          res.status(200).send({ data: [], message: "No data found" });
        }
      })
      .catch((err) => {
        //  가져오기 실패 메시지 전송
        console.log(err)
        res.status(400).send({ message: "Server error" });
      });
};