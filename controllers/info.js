const Equipment = require("../models/equipment");
const Own = require("../models/own");
const Record = require("../models/record");

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

// 기록 정보 가져오기
exports.get_record = (req, res) => {
    console.log(Record);
    Record.findAll({
        where: {
            user_num: req.user.user_num,
        },
        attributes: ["record_num", "record_date", "equipment_num", "record_count", "record_weight"],
    })
        .then((record) => {
            //  가져오기 성공 메시지 전송
            if (record.length > 0) {
                res.status(200).send({data: record, message: "Success"});
            } else {
                res.status(404).send({ message: "Not found" });
            }
        })
        .catch((err) => {
            //  가져오기 실패 메시지 전송
            //console.log(err);
            res.status(400).send({ message: "Server error" });
        });
};