const Equipment = require("../models/equipment");
const Own = require("../models/own");
const Record = require("../models/record");
const Quest = require("../models/quest");
const Quest_record = require("../models/quest_record");
const Body = require("../models/body");
const Division = require("../models/division");
const {Op} = require("sequelize");
const moment = require('moment');
const {Sequelize} = require("sequelize");
const multer = require("multer");


// 운동 정보 가져오기
exports.get_equipment = (req, res) => {
    Equipment.findAll({})
        .then((equipment) => {
            //  가져오기 성공 메시지 전송
            res.status(200).send({data: equipment, message: "Success"});
        })
        .catch((err) => {
            //  가져오기 실패 메시지 전송
            res.status(400).send({message: "Server error"});
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
                res.status(200).send({data: [], message: "No data found"});
            }
        })
        .catch((err) => {
            //  가져오기 실패 메시지 전송
            res.status(400).send({message: "Server error"});
        });
};

// 소유 정보 추가하기
exports.add_own = async (req, res) => {
    // 요청에서 정보 추출
    const ownInfo = req.body;
    // 유저 정보는 토큰에서 추출
    ownInfo.user_num = req.user.user_num;
    console.log(ownInfo);
    // 소유 DB에 저장하기
    const new_own = await Own.create(ownInfo);
    if (new_own) {
        // 추가 성공 메시지 전송
        res.status(200).send({message: "Success"});
    } else {
        // 추가 실패 메시지 전송
        res.status(400).send({message: "Server error"});
    }
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
            if (deleteCount > 0) {
                res.status(200).send({message: "Success"});
            } else {
                res.status(404).send({message: "Not found"});
            }
        })
        .catch((err) => {
            // 삭제 실패 메시지 전송
            console.log(err);
            res.status(400).send({message: "Server error"});
        });
};

// 기록 정보 가져오기
exports.get_record = (req, res) => {
    Record.findAll({
        where: {
            user_num: req.user.user_num,
        },
        attributes: ["record_num", "record_date", "equipment_num", "record_count", "record_weight"],
        include: [{
            model: Equipment, // equipment_db와 조인
            attributes: ["equipment_name", "equipment_category"]
        }]
    })
        .then((record) => {
            // 가져온 기록에 marked와 dotColor 속성 추가
            const updatedRecords = record.map(record => {
                // 각 기록에 marked, dotColor 추가
                return {
                    ...record.get({ plain: true }), // 일반 객체로 변환
                    marked: true,
                    dotColor: "red",
                };
            });
            //  가져오기 성공 메시지 전송
            if (record.length > 0) {
                res.status(200).send({data: updatedRecords, message: "Success"});
            } else {
                res.status(200).send({data: [], message: "No data found"});
            }
        })
        .catch((err) => {
            //  가져오기 실패 메시지 전송
            //console.log(err);
            res.status(400).send({message: "Server error"});
        });
};

// 기록 정보 추가하기
exports.add_record = async (req, res) => {
    // 요청에서 정보 추출
    const recordInfo = req.body;
    // 운동기록에 따른 경험치
    const exp = recordInfo.record_weight * recordInfo.record_count;
    // record_db에 기록 추가
    try {
        recordInfo.user_num = req.user.user_num;
        await Record.create(recordInfo);
        // 경험치 반영
        req.user = await req.user.update({user_exp: req.user.user_exp + exp});
        // 경험치에 따른 레벨 시스템
        await req.user.update({user_level: 1 + ~~(req.user.user_exp / 100000)});
        // 성공 메시지 전송
        res.status(200).send({message: "Success"});
    } catch (err) {
        // 실패 메시지 전송
        res.status(400).send({message: "Server error"});
    }
};

// 기록 정보 수정하기
exports.patch_record = async (req, res) => {
    //  body에서 key만 리스트로 추출
    const updates = Object.keys(req.body);
    // 기본키인 record_num 추출 (수정기준)
    const record_num = req.body.record_num;
    // 기본키인 record_num을 이용해서 해당 record가 있는지 확인하고 user_num을 추출
    const record = await Record.findOne({
        where: {
            record_num: record_num,
        },
        attributes: ["user_num"],
    })
    if (record) {
        // record.user_num과 req.user.user_num이 일치하는지 확인(검증)
        if (record.user_num !== req.user.user_num) {
            // 만약 토큰정보와 추가할 유저 정보가 일치하지 않으면 에러 메시지 전송(부적절한 접근)
            res.status(400).send({message: "Invalid access"})
        } else {
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

            try {
                // 이전 기록 조회
                const originalRecord = await Record.findOne({
                    where: {
                        record_num: record_num,
                    },
                });

                // 기록 정보 수정
                await Record.update(to_update_info, {
                    where: {
                        record_num: record_num,
                    },
                });

                // 수정된 기록 조회
                const updatedRecord = await Record.findOne({
                    where: {
                        record_num: record_num,
                    },
                });

                // 경험치 계산
                const originalExp = originalRecord.record_weight * originalRecord.record_count;
                const updatedExp = updatedRecord.record_weight * updatedRecord.record_count;
                const expDifference = updatedExp - originalExp;

                // 경험치 반영
                req.user = await req.user.update({user_exp: req.user.user_exp + expDifference});

                // 경험치에 따른 레벨 시스템
                await req.user.update({user_level: 1 + ~~(req.user.user_exp / 100000)});

                // 성공 메시지 전송
                res.status(200).send({message: "Success"});
            } catch (err) {
                // 실패 메시지 전송
                res.status(400).send({message: "Server error"});
            }
        }
    } else {
        res.status(400).send({message: "No data found"});
    }
};

// 기록 정보 삭제하기
exports.delete_record = async (req, res) => {
    // 요청에서 기록 번호(record_num) 추출
    const record_num = req.params.record_num;

    // 기록 조회
    const record = await Record.findOne({
        where: {
            record_num: record_num,
            user_num: req.user.user_num,
        },
    });

    if (record) {
        try {
            // 경험치 계산
            const exp = record.record_weight * record.record_count;

            // 기록 삭제
            const deleteCount = await Record.destroy({
                where: {
                    record_num: record_num,
                },
            })

            // 경험치 반영
            req.user = await req.user.update({user_exp: req.user.user_exp - exp});

            // 경험치에 따른 레벨 시스템
            await req.user.update({user_level: 1 + ~~(req.user.user_exp / 100000)});

            // 삭제 성공 메시지 전송
            if (deleteCount > 0) {
                res.status(200).send({message: "Success"});
            } else {
                res.status(200).send({message: "Not found"});
            }

        } catch (err) {
            // 삭제 실패 메시지 전송
            res.status(400).send({message: "Server error"});
        }
    } else {
        res.status(200).send({message: "No data found"});
    }
};

// 한국 시간대(KST, UTC+9)의 날짜 문자열을 반환하는 함수
function getDateStringInKST(date) {
    const koreaTimeOffset = 9 * 60 * 60 * 1000; // 한국 시간대 오프셋(밀리초 단위)
    const kstDate = new Date(date.getTime() + koreaTimeOffset); // 한국 시간대로 조정
    return kstDate.toISOString().split('T')[0];
}

// 출석 퀘스트 정보 가져오기
exports.get_attendance_quest = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        console.log(currentDateString);

        // 출석 퀘스트 수행여부 (1)
        const process_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.lte]: 5 // quest_num이 5 이하인 조건
                },
                quest_state: '진행',
            },
        });
        if (process_quest && currentDateString > process_quest.quest_start_date) {
            // 이전 날 (currentDate에서 하루 빼기)
            const previousDate = new Date(currentDate);
            previousDate.setDate(currentDate.getDate() - 1);
            // 이전 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
            const previousDateString = getDateStringInKST(previousDate);
            console.log(currentDateString - previousDateString);
            // 출석 퀘스트 종료일이 지나지 않았다면
            if (currentDateString <= process_quest.quest_end_date) {
                // 이전 날의 운동기록이 있는지 확인
                const record = await Record.findOne({
                    where: {
                        user_num: req.user.user_num,
                        record_date: previousDateString,
                    },
                });
                console.log(2);
                console.log(record);
                if (record) {
                    console.log(3);
                    // 오늘이 출석 퀘스트 종료일이라면
                    if (currentDateString === process_quest.quest_end_date) {
                        console.log(4);
                        const today_record = await Record.findOne({
                            where: {
                                record_date: currentDateString,
                                user_num: req.user.user_num,
                            },
                        });
                        // 오늘 운동기록이 있다면
                        console.log(5);
                        if (today_record) {
                            console.log(6);
                            // process_quest의 상태를 달성상태로 변경
                            await Quest_record.update(
                                {quest_state: '달성', state_update_date: currentDateString},
                                {where: {quest_record_num: process_quest.quest_record_num}}
                            );
                            // 오늘 운동기록이 없다면
                        } else {
                            console.log('아무것도 안함');
                        }
                        // 이전 날의 운동기록이 있고, 출석 퀘스트 종료일이 아직 지나지 않았으면
                    } else {
                        console.log('아무것도 안함');
                    }
                    // 이전 날의 운동기록이 없다면
                } else {
                    console.log(10);
                    // process_quest의 상태를 실패상태로 변경
                    await Quest_record.update({quest_state: '실패', state_update_date: currentDateString},
                        {
                            where: {quest_record_num: process_quest.quest_record_num},
                        });
                }
                // 출석 퀘스트 종료일이 지났다면
            } else {
                console.log(7);
                const past_record = await Record.findOne({
                    where: {
                        record_date: process_quest.quest_end_date,
                        user_num: req.user.user_num,
                    },
                });
                // 출석 종료일 날 과거 운동기록이 있다면
                if (past_record) {
                    console.log(8);
                    // process_quest의 상태를 달성상태로 변경
                    await Quest_record.update({quest_state: '달성', state_update_date: process_quest.quest_end_date},
                        {
                            where: {quest_record_num: process_quest.quest_record_num},
                        }
                    );
                }
                // 출석 종료일 날 과거 운동기록이 없다면
                else {
                    console.log(9);
                    // process_quest의 상태를 실패상태로 변경
                    await Quest_record.update({quest_state: '실패', state_update_date: process_quest.quest_end_date},
                        {
                            where: {quest_record_num: process_quest.quest_record_num},
                        }
                    );
                }
            }
            // 진행중인 퀘스트가 없거나, 퀘스트 시작일이 지나지 않았으면
        } else {
            console.log('아무것도 안함');
        }

        // 퀘스트 상태에 따라 퀘스트 생성 (2)
        const recent_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.lte]: 5 // quest_num이 5 이하인 조건
                },
            },
            order: [
                ['quest_record_num', 'DESC'] // quest_record_num 기준으로 내림차순 정렬 (가장 최근)
            ]
        });
        // recent_quest가 없다면 quest_db에서 quest_num=1을 찾아서 quest_record_db에 미진행으로 저장
        if (!recent_quest) {
            await Quest_record.create({
                quest_num: 1,
                user_num: req.user.user_num,
                quest_state: '미진행',
                state_update_date: currentDateString,
            });
            // recent_quest가 있다면 상태에 따라 처리
        } else {
            // 상태 변경날의 다음 날이 되었으면 퀘스트 생성처리
            if (currentDateString > recent_quest.state_update_date) {
                // quest_record 상태에 따라 처리
                switch (recent_quest.quest_state) {
                    case '완료':
                        // 완료한 퀘스트의 다음 퀘스트를 찾아서 미진행으로 저장
                        const nextQuest = await Quest.findOne({
                            where: {quest_num: recent_quest.quest_num + 1}
                        });
                        console.log(nextQuest);
                        if (nextQuest && nextQuest.quest_num <= 5) {
                            await Quest_record.create({
                                quest_num: nextQuest.quest_num,
                                user_num: req.user.user_num,
                                quest_state: '미진행',
                                state_update_date: currentDateString,
                            });
                        } else {
                            // 다음 퀘스트가 없는 경우 (예: 마지막 퀘스트를 완료한 경우)
                            console.log("모든 퀘스트를 완료했습니다.");
                        }
                        break;
                    case '실패':
                        // (실패) 다음 날이 되었으면 실패한 퀘스트를 미진행으로 다시 저장
                        const failedQuest = await Quest_record.create({
                            quest_num: recent_quest.quest_num,
                            user_num: req.user.user_num,
                            quest_state: '미진행',
                            state_update_date: currentDateString,
                        });
                        break;
                    default:
                        // 진행중이거나 미진행이거나 달성상태의 경우 변경 없음
                        console.log("퀘스트가 진행중이거나 미진행이거나 달성상태이기 때문에 변동사항이 없습니다.");
                        break;
                }
            } else {
                console.log("아직 다음날이 되지 않았습니다.");
            }
        }

        // 일일 퀘스트 가져오기 (가장 최근 퀘스트) (3)
        const today_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.lte]: 5 // quest_num이 5 이하인 조건
                },
            },
            order: [
                ['quest_record_num', 'DESC'] // quest_record_num 기준으로 내림차순 정렬 (가장 최근)
            ],
            include: [{
                model: Quest, // quest_db와 조인
            }]
        });
        res.status(200).send({data: today_quest, message: "출석 퀘스트 가져오기 성공"});
    } catch (error) {
        console.error(error);
        res.status(400).send('출석 퀘스트 정보 가져오기 도중 오류가 발생했습니다.')
    }
}

// 출석일 가져오기
exports.get_attendance_day = async (req, res) => {
    let attendance_day = 0; // 출석일 0으로 초기화
    let attendance_rate = 0; // 출석률 0으로 초기화
    // 현재 날짜 생성 (연-월-일만 고려)
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
    const currentDateString = getDateStringInKST(currentDate);
    // 진행중인 퀘스트 가져오기
    const process_quest = await Quest_record.findOne({
        where: {
            user_num: req.user.user_num,
            quest_num: {
                [Op.lte]: 5 // quest_num이 5 이하인 조건
            },
            quest_state: '진행',
        },
    });
    // 진행중인 출석 퀘스트가 있다면
    if (process_quest) {
        attendance_day = moment(currentDateString).diff(moment(process_quest.quest_start_date), 'days');
        console.log(attendance_day);
        const today_record = await Record.findOne({
            where: {
                record_date: currentDateString,
                user_num: req.user.user_num,
            },
        });
        // 오늘 운동기록이 있다면
        if (today_record) {
            attendance_day += 1;
        }
        attendance_rate = Math.round(attendance_day / moment(process_quest.quest_end_date).diff(moment(process_quest.quest_start_date), 'days') * 100);
        res.status(200).send({
            data: {attendance_day: attendance_day, attendance_rate: attendance_rate},
            message: "출석일 가져오기 성공"
        });
    }
    // 진행중인 출석 퀘스트가 없다면
    else {
        console.log('진행중인 출석 퀘스트가 없습니다.');
        res.status(200).send({data: {attendance_day: 0, attendance_rate: 0}, message: "진행중인 출석 퀘스트가 없습니다."});
    }
}

// 출석 퀘스트 수락하기 (미진행 -> 진행)
exports.accept_attendance_quest = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        // 현재 미진행 퀘스트 가져오기
        const not_process_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.lte]: 5 // quest_num이 5 이하인 조건
                },
                quest_state: '미진행',
            },
            include: [{
                model: Quest, // quest_db와 조인
            }]
        });
        // quest_end_date 설정 (currentDate에서 requirement 추가)
        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + not_process_quest.Quest.quest_requirement - 1);
        // 이전 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const endDateString = getDateStringInKST(endDate);
        // 미진행 퀘스트의 상태를 진행상태로 변경
        await Quest_record.update(
            {
                quest_state: '진행',
                quest_start_date: currentDateString,
                quest_end_date: endDateString,
                state_update_date: currentDateString,
            },
            {where: {quest_record_num: not_process_quest.quest_record_num}}
        );
        res.status(200).send('퀘스트 수락하기가 처리되었습니다.');
    } catch (error) {
        console.error(error);
        res.status(400).send('퀘스트 수락하기 도중 오류가 발생했습니다.')
    }
}

// 출석 퀘스트 완료하기 (달성 -> 완료)
exports.finish_attendance_quest = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        // 현재 달성 퀘스트 가져오기
        const achieve_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.lte]: 5 // quest_num이 5 이하인 조건
                },
                quest_state: '달성',
            },
            include: [{
                model: Quest, // quest_db와 조인
            }]
        });
        // 미진행 퀘스트의 상태를 진행상태로 변경
        await Quest_record.update(
            {
                quest_state: '완료',
                state_update_date: currentDateString,
            },
            {where: {quest_record_num: achieve_quest.quest_record_num}}
        );
        // 퀘스트 완료에 따른 보상 경험치 반영
        const exp = achieve_quest.Quest.quest_reward;
        req.user = await req.user.update({user_exp: req.user.user_exp + exp});
        res.status(200).send('퀘스트 완료하기가 처리되었습니다.');
    } catch (error) {
        console.error(error);
        res.status(400).send('퀘스트 완료하기 도중 오류가 발생했습니다.');
    }
}

// 운동 퀘스트 정보 가져오기
exports.get_exercise_quest = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        console.log(currentDateString);

        // 운동 퀘스트 수행여부 (1)
        const process_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.gt]: 5 // quest_num이 5보다 큰 조건
                },
                quest_state: '진행',
            },
            include: [{
                model: Quest, // quest_db와 조인
            }]
        });
        // 진행중인 운동 퀘스트가 있다면
        if (process_quest) {
            // 해당 운동기구에 대한 오늘 기록을 가져온다.
            const today_record = await Record.findAll({
                where: {
                    user_num: req.user.user_num,
                    record_date: currentDateString,
                    equipment_num: process_quest.Quest.equipment_num,
                },
            });

            // 해당 운동기구의 오늘 총 볼륨
            let total_volume = 0;
            today_record.forEach(record => {
                total_volume += record.record_count * record.record_weight;
            });

            // 운동 퀘스트 필요조건을 넘었다면
            if (total_volume >= process_quest.Quest.quest_requirement) {
                // process_quest의 상태를 달성상태로 변경
                await Quest_record.update({quest_state: '달성', state_update_date: currentDateString},
                    {
                        where: {quest_record_num: process_quest.quest_record_num},
                    }
                );
            }
            // 운동 퀘스트 필요조건을 못 넘었다면
            else {
                console.log('아무것도 안함');
            }
            // 진행중인 퀘스트가 없다면
        } else {
            console.log('아무것도 안함');
        }

        // 퀘스트 상태에 따라 퀘스트 생성 (2)
        const recent_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.gt]: 5 // quest_num이 5보다 큰 조건
                },
            },
            order: [
                ['quest_record_num', 'DESC'] // quest_record_num 기준으로 내림차순 정렬 (가장 최근)
            ]
        });
        // recent_quest가 없다면 새로운 운동 퀘스트 만들기
        if (!recent_quest) {
            await createExerciseQuest(req);
        } else {
            // 상태 변경날의 다음 날이 되었으면 퀘스트 생성처리
            if (currentDateString > recent_quest.state_update_date) {
                // quest_record 상태에 따라 처리
                switch (recent_quest.quest_state) {
                    case '완료':
                        // 완료되었으면 새로운 운동 퀘스트 만들기
                        await createExerciseQuest(req);
                        break;
                    default:
                        // 진행중이거나 미진행이거나 달성상태의 경우 변경 없음
                        console.log("퀘스트가 진행중이거나 미진행이거나 달성상태이기 때문에 변동사항이 없습니다.");
                        break;
                }
            } else {
                console.log("아직 다음날이 되지 않았습니다.");
            }
        }

        // 운동 퀘스트 가져오기 (가장 최근 퀘스트) (3)
        const today_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.gt]: 5 // quest_num이 5보다 큰 조건
                },
            },
            include: [{
                model: Quest, // quest_db와 조인
            }],
            order: [
                ['quest_record_num', 'DESC'] // quest_record_num 기준으로 내림차순 정렬 (가장 최근)
            ]
        });
        res.status(200).send({data: today_quest, message: "운동 퀘스트 가져오기 성공"});
    } catch (error) {
        console.error(error);
        res.status(400).send('운동 퀘스트 정보 가져오기 도중 오류가 발생했습니다.')
    }
}

// 운동 퀘스트 생성 알고리즘
async function createExerciseQuest(req) {
    // 현재 날짜 생성 (연-월-일만 고려)
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
    const currentDateString = getDateStringInKST(currentDate);
    console.log(currentDateString);

    // 유저의 레벨에 따라서 필요조건(운동볼륨) 부여
    let quest_requirement = 0;
    if (req.user.user_level <= 10) {
        quest_requirement = 500;
    } else if (req.user.user_level <= 20) {
        quest_requirement = 1000;
    } else if (req.user.user_level <= 30) {
        quest_requirement = 1500;
    } else if (req.user.user_level <= 40) {
        quest_requirement = 2000;
    } else {
        quest_requirement = 2500;
    }

    // 모든 운동 부위 가져오기
    const allCategories = await Equipment.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('equipment_category')), 'category'],
        ],
        raw: true,
    });
    // 사용자가 운동한 기록에서 부위별로 사용한 운동기구 찾기
    const user_record = await Record.findAll({
        where: {
            user_num: req.user.user_num,
        },
        include: [{
            model: Equipment, // equipment_db와 조인
            attributes: ['equipment_num', 'equipment_category'],
        }]
    });

    let usedCategories = user_record.map(record => record['Equipment.equipment_category']);
    usedCategories = [...new Set(usedCategories)]; // 카테고리 중복 제거

    // 모든 부위 중에서 아직 사용하지 않은 부위 찾기
    const unusedCategories = allCategories.filter(category => !usedCategories.includes(category.category));

    // 사용되지 않은 부위가 있다면
    if (unusedCategories.length > 0) {
        // 사용하지 않은 부위 중 랜덤으로 하나 선택하기
        const randomCategoryIndex = Math.floor(Math.random() * unusedCategories.length);
        console.log(randomCategoryIndex);
        const selectedCategory = unusedCategories[randomCategoryIndex].category;
        console.log(selectedCategory);
        // 랜덤으로 선택된 부위에서 사용하지 않은 운동기구 찾기
        const allEquipmentsInCategory = await Equipment.findAll({
            where: {equipment_category: selectedCategory},
            raw: true,
        });
        // 랜덤으로 선택된 부위에서 사용한 운동기구 equipment_num 배열
        const usedEquipmentsInCategory = user_record
            .filter(record => record['Equipment.equipment_category'] === selectedCategory)
            .map(record => record['Equipment.equipment_num']);
        // 랜덤으로 선택된 부위에서 사용하지 않은 운동기구 equipment_num 배열
        const unusedEquipmentsInCategory = allEquipmentsInCategory.filter(equipment => !usedEquipmentsInCategory.includes(equipment.equipment_num));
        // 사용하지 않은 부위 중 사용하지 않은 운동기구가 있다면
        if (unusedEquipmentsInCategory.length > 0) {
            // 사용하지 않은 운동기구 중 랜덤으로 하나 선택하기
            const randomEquipmentIndex = Math.floor(Math.random() * unusedEquipmentsInCategory.length);
            const selectedEquipment = unusedEquipmentsInCategory[randomEquipmentIndex];
            // 운동 퀘스트 등록하기
            const exercise_quest = await Quest.create({
                quest_category: 'exercise',
                quest_description: `${selectedEquipment.equipment_name} 운동 볼륨 ${quest_requirement} 도전하기`,
                quest_reward: quest_requirement * 10,
                quest_requirement: quest_requirement,
                equipment_num: selectedEquipment.equipment_num
            });
            // 해당 운동 퀘스트 미진행으로 Quest_record_db에 저장
            await Quest_record.create({
                quest_num: exercise_quest.quest_num,
                user_num: req.user.user_num,
                quest_state: '미진행',
                state_update_date: currentDateString,
            });
        }
        // 사용되지 않은 부위가 없다면 (모든 부위를 다 했다면)
    } else {
        // 사용자 기록에서 부위별 총 볼륨 계산
        let categoryVolume = {};
        user_record.forEach(record => {
            const category = record['Equipment.equipment_category'];
            const volume = record['record_weight'] * record['record_count'];
            if (category in categoryVolume) {
                categoryVolume[category] += volume;
            } else {
                categoryVolume[category] = volume;
            }
        });

        // 가장 적게 운동한 부위 찾기
        let minVolume = Infinity;
        let leastUsedCategory = null;
        for (const [category, volume] of Object.entries(categoryVolume)) {
            if (volume < minVolume) {
                minVolume = volume;
                leastUsedCategory = category;
            }
        }

        // 해당 부위에서 사용하지 않은 운동기구 찾기
        const allEquipmentsInLeastUsedCategory = await Equipment.findAll({
            where: {equipment_category: leastUsedCategory},
            raw: true,
        });
        const usedEquipmentsInLeastUsedCategory = user_record
            .filter(record => record['Equipment.equipment_category'] === leastUsedCategory)
            .map(record => record['Equipment.equipment_num']);
        const unusedEquipmentsInLeastUsedCategory = allEquipmentsInLeastUsedCategory.filter(equipment => !usedEquipmentsInLeastUsedCategory.includes(equipment.equipment_num));

        // 사용하지 않은 운동기구가 있으면, 그 중 하나를 랜덤으로 선택하여 운동 퀘스트 생성
        if (unusedEquipmentsInLeastUsedCategory.length > 0) {
            const randomEquipmentIndex = Math.floor(Math.random() * unusedEquipmentsInLeastUsedCategory.length);
            const selectedEquipment = unusedEquipmentsInLeastUsedCategory[randomEquipmentIndex];
            // 운동 퀘스트 등록하기
            const exercise_quest = await Quest.create({
                quest_category: 'exercise',
                quest_description: `${selectedEquipment.equipment_name} 운동 볼륨 ${quest_requirement} 도전하기`,
                quest_reward: quest_requirement * 10,
                quest_requirement: quest_requirement,
                equipment_num: selectedEquipment.equipment_num
            });
            // 해당 운동 퀘스트 미진행으로 Quest_record_db에 저장
            await Quest_record.create({
                quest_num: exercise_quest.quest_num,
                user_num: req.user.user_num,
                quest_state: '미진행',
                state_update_date: currentDateString,
            });

            // 사용하지 않은 운동기구가 없으면 운동기구들 중에서 가장 안 한 운동기구를 선택하여 운동 퀘스트 생성
        } else {
            // 해당 부위의 운동기구별 총 볼륨 계산
            let equipmentVolume = {};
            user_record.forEach(record => {
                if (record['Equipment.equipment_category'] === leastUsedCategory) {
                    const equipmentNum = record['Equipment.equipment_num'];
                    const volume = record['record_weight'] * record['record_count'];
                    if (equipmentNum in equipmentVolume) {
                        equipmentVolume[equipmentNum] += volume;
                    } else {
                        equipmentVolume[equipmentNum] = volume;
                    }
                }
            });

            // 가장 적게 사용된 운동기구 찾기
            let minVolume = Infinity;
            let leastUsedEquipmentNum = null;
            for (const [equipmentNum, volume] of Object.entries(equipmentVolume)) {
                if (volume < minVolume) {
                    minVolume = volume;
                    leastUsedEquipmentNum = equipmentNum;
                }
            }

            // 가장 적게 사용된 운동기구를 찾은 경우 해당 운동기구에 대한 운동 퀘스트 생성
            if (leastUsedEquipmentNum !== null) {
                const selectedEquipment = allEquipmentsInLeastUsedCategory.find(equipment => equipment.equipment_num === leastUsedEquipmentNum);

                // 가장 적게 사용된 운동기구에 대해 날짜별 볼륨 합산
                let dailyTotalVolumes = {}; // 날짜별 볼륨 합산 저장 객체

                user_record.forEach(record => {
                    if (record['Equipment.equipment_num'] === leastUsedEquipmentNum) {
                        const date = record['record_date']; // 날짜 가져오기
                        const volume = record['record_weight'] * record['record_count']; // 해당 기록의 볼륨 계산

                        // 해당 날짜에 대한 기록이 이미 있다면 볼륨 합산
                        if (dailyTotalVolumes[date]) {
                            dailyTotalVolumes[date] += volume;
                        } else {
                            // 해당 날짜의 첫 기록이라면 객체에 추가
                            dailyTotalVolumes[date] = volume;
                        }
                    }
                });

                // 모든 날짜의 볼륨 합산 중 최대값 찾기
                let maxDailyTotalVolume = 0;
                Object.values(dailyTotalVolumes).forEach(totalVolume => {
                    if (totalVolume > maxDailyTotalVolume) {
                        maxDailyTotalVolume = totalVolume;
                    }
                });

                // quest_requirement 계산 (이전 최고기록에서 레벨에 따라 추가)
                if (req.user.user_level <= 10) {
                    quest_requirement = maxDailyTotalVolume * 1.05; // 5퍼센트 더 많이
                } else if (req.user.user_level <= 20) {
                    quest_requirement = maxDailyTotalVolume * 1.06; // 6퍼센트 더 많이
                } else if (req.user.user_level <= 30) {
                    quest_requirement = maxDailyTotalVolume * 1.07; // 7퍼센트 더 많이
                } else if (req.user.user_level <= 40) {
                    quest_requirement = maxDailyTotalVolume * 1.08; // 8퍼센트 더 많이
                } else {
                    quest_requirement = maxDailyTotalVolume * 1.1; // 10퍼센트 더 많이
                }

                // 운동 퀘스트 등록하기
                const exercise_quest = await Quest.create({
                    quest_category: 'exercise',
                    quest_description: `${selectedEquipment.equipment_name} 운동 볼륨 ${quest_requirement - maxDailyTotalVolume} 늘리기`,
                    quest_reward: quest_requirement * 10,
                    quest_requirement: quest_requirement,
                    equipment_num: selectedEquipment.equipment_num
                });

                // 해당 운동 퀘스트 미진행으로 Quest_record_db에 저장
                await Quest_record.create({
                    quest_num: exercise_quest.quest_num,
                    user_num: req.user.user_num,
                    quest_state: '미진행',
                    state_update_date: currentDateString,
                });
            }
        }
    }
}

// 운동 퀘스트 수락하기 (미진행 -> 진행)
exports.accept_exercise_quest = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        // 현재 미진행 퀘스트 가져오기
        const not_process_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.gt]: 5 // quest_num이 5보다 큰 조건
                },
                quest_state: '미진행',
            },
            include: [{
                model: Quest, // quest_db와 조인
            }]
        });
        // 미진행 퀘스트의 상태를 진행상태로 변경
        await Quest_record.update(
            {
                quest_state: '진행',
                quest_start_date: currentDateString,
                state_update_date: currentDateString,
            },
            {where: {quest_record_num: not_process_quest.quest_record_num}}
        );
        res.status(200).send('퀘스트 수락하기가 처리되었습니다.');
    } catch (error) {
        console.error(error);
        res.status(400).send('퀘스트 수락하기 도중 오류가 발생했습니다.')
    }
}

// 운동 퀘스트 완료하기 (달성 -> 완료)
exports.finish_exercise_quest = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        // 현재 달성 퀘스트 가져오기
        const achieve_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {
                    [Op.gt]: 5 // quest_num이 5보다 큰 조건
                },
                quest_state: '달성',
            },
            include: [{
                model: Quest, // quest_db와 조인
            }]
        });
        // 미진행 퀘스트의 상태를 진행상태로 변경
        await Quest_record.update(
            {
                quest_state: '완료',
                quest_end_date: currentDateString,
                state_update_date: currentDateString,
            },
            {where: {quest_record_num: achieve_quest.quest_record_num}}
        );
        // 퀘스트 완료에 따른 보상 경험치 반영
        const exp = achieve_quest.Quest.quest_reward;
        console.log(exp);
        req.user = await req.user.update({user_exp: req.user.user_exp + exp});
        res.status(200).send('퀘스트 완료하기가 처리되었습니다.');
    } catch (error) {
        console.error(error);
        res.status(400).send('퀘스트 완료하기 도중 오류가 발생했습니다.');
    }
}

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "body_uploads"); // 파일이 저장될 서버 상의 위치
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = req.user.user_num + req.user.user_name + "-" + Date.now();
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({storage: storage}).single("image");

// 운동 Before/After 신체 정보 저장하기
exports.add_body_info = async (req, res) => {
    // 현재 날짜 생성 (연-월-일만 고려)
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
    const currentDateString = getDateStringInKST(currentDate);
    upload(req, res, async (error) => {
        if (error) {
            // Multer 업로드 에러 처리
            return res.status(500).json({message: "사진 업로드 중 오류가 발생했습니다.", error: error.message});
        }

        if (!req.file) {
            // 사진이 업로드되지 않았을 때의 에러 처리
            return res.status(400).json({message: "업로드된 사진이 없습니다."});
        }

        // req.body에서 키와 몸무게 정보 추출
        const {height, weight} = req.body;

        try {
            const imagePath = req.file.path;

            const newBodyInfo = await Body.create({
                user_num: req.user.user_num,
                body_date: currentDateString,
                body_height: height,
                body_weight: weight,
                body_bmi: weight / ((height / 100) ** 2),
                body_image: imagePath,
            });

            return res.json({message: "사진이 성공적으로 업로드되었습니다."});
        } catch (dbError) {
            // 데이터베이스 에러 처리
            console.error(dbError);
            return res.status(500).json({message: "데이터베이스 저장 중 오류가 발생했습니다."});
        }
    });
};

// 운동 Before/After 신체 정보 가져오기
exports.get_body_info = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        const before_body_info = await Body.findAll({
            where: {
                user_num: req.user.user_num,
                body_date: {
                    [Op.lt]: currentDateString // 오늘 미만 날짜로 조회
                },
            },
            order: [
                ['body_date', 'ASC'] // body_date를 기준으로 오름차순 정렬
            ]
        });
        // 성공 메시지 전송
        if (before_body_info.length > 0) {
            res.status(200).json({ message: "신체 정보 가져오기 성공", data: before_body_info });
        } else {
            res.status(200).json({ message: "신체 정보가 없습니다.", data: []});
        }
    } catch (err) {
        res.status(500).send({message: "Server error", error: err.message});
    }
};


// 맞춤형 분할운동 분할 정보 저장하기
exports.add_division_info = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        // 요청에서 정보 추출
        const divisionInfo = req.body;
        // 분할 정보에 user_num 추가
        divisionInfo.user_num = req.user.user_num;
        // 분할 정보에 분할 시작일 추가
        divisionInfo.division_start_date = currentDateString;
        const division_info = await Division.findOne({
            where: {
                user_num: req.user.user_num,
            },
        });
        // 이미 분할 정보가 있는 경우
        if (division_info) {
            // 기존 분할 정보 삭제
            await Division.destroy({
                where: {
                    user_num: req.user.user_num,
                }
            });
        }
        // 분할 DB 해당 분할 정보 추가
        const new_division_info = await Division.create(divisionInfo);
        if (new_division_info) {
            // 추가 성공 메시지 전송
            res.status(200).send({message: "Success"});
        } else {
            // 추가 실패 메시지 전송
            res.status(400).send({message: "Create error"});
        }
    } catch (err) {
        res.status(500).send({message: "Server error", error: err.message});
    }
};