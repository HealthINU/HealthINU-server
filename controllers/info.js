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

// 소유 정보 추가하기
exports.add_own = (req, res) => {
    // 요청에서 정보 추출
    const ownInfo = req.body;

    // 새로운 기록 생성
    Own.create(ownInfo)
        .then((own) => {
            // 추가 성공 메시지 전송
            res.status(200).send({ message: "Success" });
        })
        .catch((err) => {
            // 추가 실패 메시지 전송
            res.status(400).send({ message: "Server error" });
        });
};

// 소유 정보 삭제하기
exports.delete_own = (req, res) => {
    // 요청에서 삭제할 운동기구 번호(equipment_num) 추출
    const equipment_num = req.params.equipment_num;

    Own.destroy({
        where: {
            user_num: req.user.user_num,
            equipment_num: equipment_num
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
            console.log(err);
            res.status(400).send({ message: "Server error" });
        });
};

// 기록 정보 가져오기
exports.get_record = (req, res) => {
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

// 기록 정보 추가하기
exports.add_record = (req, res) => {
    // 요청에서 정보 추출
    const recordInfo = req.body;

    // 새로운 기록 생성
    Record.create(recordInfo)
        .then((record) => {
            // 추가 성공 메시지 전송
            res.status(200).send({ message: "Success" });
        })
        .catch((err) => {
            // 추가 실패 메시지 전송
            res.status(400).send({ message: "Server error" });
        });
};

// 기록 정보 수정하기
exports.patch_record = (req, res) => {
    //  body에서 key만 리스트로 추출
    const updates = Object.keys(req.body);
    // 기본키인 record_num 추출 (수정기준)
    const record_num = req.body.record_num;

    //  날짜, 횟수, 무게만 수정 가능
    const allowedUpdates = [
        "record_date",
        "record_count",
        "record_weight",
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

    //  기록 정보 수정 ( 요청한 record_num )
    Record.update(to_update_info, {
        where: {
            record_num: record_num,
        },
    })
        .then((record) => {
            //  수정 성공 메시지 전송
            res.status(200).send({ message: "Success" });
        })
        .catch((err) => {
            //  수정 실패 메시지 전송
            res.status(400).send({ error: "Server error" });
        });
};

// 기록 정보 삭제하기
exports.delete_record = (req, res) => {
    // 요청에서 기록 번호(record_num) 추출
    const record_num = req.params.record_num;

    Record.destroy({
        where: {
            record_num: record_num,
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