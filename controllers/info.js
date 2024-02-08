const Equipment = require("../models/equipment");

// 운동 정보 가져오기
exports.get_equipment = (req, res) => {
  Equipment.findAll({})
    .then((equipment) => {
      //  수정 성공 메시지 전송
      res.status(200).send({ data: equipment, message: "Success" });
    })
    .catch((err) => {
      //  수정 실패 메시지 전송
      res.status(400).send({ message: "Server error" });
    });
};
