const Equipment = require("../models/equipment");
const Own = require("../models/own");

// 운동 정보 가져오기
exports.get_equipment = (req, res) => {
  Equipment.findAll({})
    .then((equipment) => {
      //  가져오기 성공 메시지 전송
      res.status(200).send({ data: equipment, message: "Success" });
    })
    .catch((err) => {
      //  가져오기 실패 메시지 전송
      res.status(400).send({ message: "Server error" });
    });
};

// 소유 정보 가져오기
exports.get_own = (req, res) => {
    console.log(req.user.user_num);
    Own.findAll({
        where: {
            user_num: req.user.user_num,
        },
        attributes: ["own_image"],
        include: [{
            model: Equipment, // equipment_db 모델을 조인
        }]
    })
        .then((own) => {
            //  가져오기 성공 메시지 전송
            if (own.length > 0) {
                res.status(200).send({data: own, message: "Success"});
            } else {
                res.status(404).send({ message: "Not found" });
            }
        })
        .catch((err) => {
            //  가져오기 실패 메시지 전송
            res.status(400).send({ message: "Server error" });
        });
};
