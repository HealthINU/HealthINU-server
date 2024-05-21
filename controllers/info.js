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
const express = require("express");
const path = require("path");


// 운동 정보 가져오기
exports.get_equipment = async (req, res) => {
    try {
        const equipment = await Equipment.findAll({});
        // 가져오기 성공 메시지 전송
        res.status(200).json({data: equipment, message: "Success"});
    } catch (err) {
        // 가져오기 실패 메시지 전송
        res.status(500).json({message: "Server error"});
    }
};

// 소유 정보 가져오기
exports.get_own = async (req, res) => {
    try {
        const own = await Own.findAll({
            where: {user_num: req.user.user_num},
            include: [{model: Equipment}] // Equipment 모델을 조인
        });

        if (own.length > 0) {
            res.status(200).json({data: own, message: "Success"});
        } else {
            res.status(200).json({data: [], message: "No data found"});
        }
    } catch (err) {
        // 가져오기 실패 메시지 전송
        res.status(500).json({message: "Server error"});
    }
};

// 기록 정보 가져오기
exports.get_record = async (req, res) => {
    try {
        // 사용자의 기록을 데이터베이스에서 조회
        const records = await Record.findAll({
            where: {
                user_num: req.user.user_num,
            },
            attributes: ["record_num", "record_date", "equipment_num", "record_count", "record_weight"],
            include: [{
                model: Equipment, // equipment_db와 조인
                attributes: ["equipment_name", "equipment_category"]
            }]
        });

        // 조회된 기록에 marked와 dotColor 속성 추가
        const updatedRecords = records.map(record => ({
            ...record.get({plain: true}), // Sequelize 인스턴스를 일반 객체로 변환
            marked: true,
            dotColor: "red",
        }));

        //  가져오기 성공 메시지 전송
        if (updatedRecords.length > 0) {
            res.status(200).json({data: updatedRecords, message: "Success"});
        } else {
            // 기록 정보가 존재하지 않는 경우
            res.status(200).json({data: [], message: "No data found"});
        }

    } catch (err) {
        // 에러 발생 시 서버 에러 메시지 전송
        res.status(500).json({message: "Server error"});
    }
};

// 소유 정보 추가하기
exports.add_own = async (req, res) => {
    try {
        // 요청에서 정보 추출 및 유저 정보 설정
        const ownInfo = {
            ...req.body,
            user_num: req.user.user_num
        };
        // 소유 DB에 저장하기
        const new_own = await Own.create(ownInfo);
        // 추가 성공 메시지 전송
        res.status(200).json({message: "Success"});

    } catch (err) {
        // 추가 실패 메시지 전송
        res.status(500).json({message: "Server error"});
    }
};

// 소유 정보 삭제하기
exports.delete_own = async (req, res) => {
    try {
        // 요청에서 삭제할 운동기구 번호(equipment_num) 추출
        const equipment_num = req.params.equipment_num;

        // 지정된 조건에 맞는 소유 정보를 삭제하고 삭제된 행의 수를 반환받음
        const deleteCount = await Own.destroy({
            where: {
                user_num: req.user.user_num,
                equipment_num: equipment_num
            },
        });

        // 삭제된 행이 있다면 성공 메시지 전송, 없다면 404 오류 전송
        if (deleteCount > 0) {
            res.status(200).json({message: "Success"});
        } else {
            res.status(404).json({message: "Not found"});
        }
    } catch (err) {
        // 오류 발생 시 서버 오류 메시지 전송
        res.status(500).json({message: "Server error"});
    }
};


// 기록 정보 추가하기
exports.add_record = async (req, res) => {
    const {body: recordInfo} = req;

    // 운동기록에 따른 경험치 계산
    const exp = recordInfo.record_weight * recordInfo.record_count;

    try {
        // 요청한 사용자 번호를 기록 정보에 추가
        recordInfo.user_num = req.user.user_num;

        // record_db에 기록 추가
        await Record.create(recordInfo);

        // 사용자 경험치 업데이트
        const updatedUserExp = req.user.user_exp + exp;
        await req.user.update({user_exp: updatedUserExp});

        // 경험치에 따른 레벨 시스템 업데이트
        const newLevel = 1 + Math.floor(updatedUserExp / 100000);
        await req.user.update({user_level: newLevel});

        // 성공 메시지 전송
        res.status(200).json({message: "Success"});
    } catch (err) {
        console.error(err);  // 서버 측 에러 로깅
        // 실패 메시지 전송
        res.status(500).json({message: "Server error"});
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
            // 출석 퀘스트 종료일이 지나지 않았다면
            if (currentDateString <= process_quest.quest_end_date) {
                // 이전 날의 운동기록이 있는지 확인
                const record = await Record.findOne({
                    where: {
                        user_num: req.user.user_num,
                        record_date: previousDateString,
                    },
                });
                if (record) {
                    // 오늘이 출석 퀘스트 종료일이라면
                    if (currentDateString === process_quest.quest_end_date) {
                        const today_record = await Record.findOne({
                            where: {
                                record_date: currentDateString,
                                user_num: req.user.user_num,
                            },
                        });
                        // 오늘 운동기록이 있다면
                        if (today_record) {
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
                    // process_quest의 상태를 실패상태로 변경
                    await Quest_record.update({quest_state: '실패', state_update_date: currentDateString},
                        {
                            where: {quest_record_num: process_quest.quest_record_num},
                        });
                }
                // 출석 퀘스트 종료일이 지났다면
            } else {
                const past_record = await Record.findOne({
                    where: {
                        record_date: process_quest.quest_end_date,
                        user_num: req.user.user_num,
                    },
                });
                // 출석 종료일 날 과거 운동기록이 있다면
                if (past_record) {
                    // process_quest의 상태를 달성상태로 변경
                    await Quest_record.update({quest_state: '달성', state_update_date: process_quest.quest_end_date},
                        {
                            where: {quest_record_num: process_quest.quest_record_num},
                        }
                    );
                }
                // 출석 종료일 날 과거 운동기록이 없다면
                else {
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

        // 출석 퀘스트 가져오기 (가장 최근 퀘스트) (3)
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
    try {
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const currentDateString = getDateStringInKST(currentDate)
        // 진행중인 퀘스트 가져오기
        const process_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {[Op.lte]: 5},
                quest_state: '진행',
            },
        });

        // 진행중인 출석 퀘스트가 없다면
        if (!process_quest) {
            return res.status(200).json({data: {attendance_day: 0, attendance_rate: 0}, message: "진행중인 출석 퀘스트가 없습니다."});
        }

        // 진행중인 출석 퀘스트가 있다면
        let attendance_day = moment(currentDateString).diff(moment(process_quest.quest_start_date), 'days');
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

        const total_days = moment(process_quest.quest_end_date).diff(moment(process_quest.quest_start_date), 'days') + 1;
        const attendance_rate = Math.round((attendance_day / total_days) * 100);

        res.status(200).json({
            data: {attendance_day: attendance_day, attendance_rate: attendance_rate},
            message: "출석일 가져오기 성공"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "서버 오류로 출석일 정보를 가져오는데 실패했습니다."});
    }
}

// 출석 퀘스트 수락하기 (미진행 -> 진행)
exports.accept_attendance_quest = async (req, res) => {
    try {
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const currentDateString = getDateStringInKST(currentDate); // 'YYYY-MM-DD' 형식으로 변환

        const not_process_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {[Op.lte]: 5}, // quest_num이 5 이하
                quest_state: '미진행',
            },
            include: [{model: Quest}] // quest_db와 조인
        });

        if (!not_process_quest) {
            return res.status(404).json({message: '진행 가능한 미진행 퀘스트가 없습니다.'});
        }

        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + not_process_quest.Quest.quest_requirement - 1);
        const endDateString = getDateStringInKST(endDate); // 'YYYY-MM-DD' 형식으로 변환

        await Quest_record.update(
            {
                quest_state: '진행',
                quest_start_date: currentDateString,
                quest_end_date: endDateString,
                state_update_date: currentDateString,
            },
            {where: {quest_record_num: not_process_quest.quest_record_num}}
        );

        res.status(200).json({message: '퀘스트가 성공적으로 수락되었습니다.'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: '퀘스트 수락 중 서버 오류가 발생했습니다.'});
    }
}

// 출석 퀘스트 완료하기 (달성 -> 완료)
exports.finish_attendance_quest = async (req, res) => {
    try {
        // 현재 날짜 (연-월-일) 생성
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const currentDateString = getDateStringInKST(currentDate); // 'YYYY-MM-DD' 형식으로 변환

        // 달성한 퀘스트 정보 조회
        const achievedQuest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {[Op.lte]: 5}, // quest_num이 5 이하
                quest_state: '달성',
            },
            include: [{model: Quest}] // Quest 모델과 조인
        });

        if (!achievedQuest) {
            return res.status(404).json({message: '완료할 수 있는 달성된 퀘스트가 없습니다.'});
        }

        // 퀘스트 상태를 완료로 업데이트
        await Quest_record.update(
            {quest_state: '완료', state_update_date: currentDateString},
            {where: {quest_record_num: achievedQuest.quest_record_num}}
        );

        // 경험치 반영
        const exp = achievedQuest.Quest.quest_reward;
        await req.user.update({user_exp: req.user.user_exp + exp});

        res.json({message: '퀘스트가 성공적으로 완료되었습니다.'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: '퀘스트 완료 처리 중 오류가 발생했습니다.'});
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
                console.log('아무것도 안함1');
            }
            // 진행중인 퀘스트가 없다면
        } else {
            console.log('아무것도 안함2');
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

    console.log("운동 퀘스트 생성 알고리즘 실행");

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

    let usedCategories = user_record.map(record => {
        if (record.Equipment && record.Equipment.equipment_category) {
            return record.Equipment.equipment_category;
        }
        return null; // 또는 적절한 기본값 설정
    }).filter(category => category !== null); // null이 아닌 값만 필터링

    usedCategories = [...new Set(usedCategories)]; // 카테고리 중복 제거

    // 모든 부위 중에서 아직 사용하지 않은 부위 찾기
    const unusedCategories = allCategories.filter(category => !usedCategories.includes(category.category));

    // 사용되지 않은 부위가 있다면, 해당하는 부위의 어떠한 운동기구도 사용하지 않은 상태
    if (unusedCategories.length > 0) {
        console.log("아직 사용하지 않은 부위가 있다.");
        // 사용하지 않은 부위 중 랜덤으로 하나 선택하기
        const randomCategoryIndex = Math.floor(Math.random() * unusedCategories.length);
        const selectedCategory = unusedCategories[randomCategoryIndex].category;

        // 랜덤으로 선택된 부위의 사용되지 않은 운동기구 찾기
        const unusedEquipmentsInCategory = await Equipment.findAll({
            where: {equipment_category: selectedCategory},
            raw: true,
        });
        console.log(unusedEquipmentsInCategory);

        // 사용하지 않은 운동기구 중 랜덤으로 하나 선택하기
        const randomEquipmentIndex = Math.floor(Math.random() * unusedEquipmentsInCategory.length);
        const selectedEquipment = unusedEquipmentsInCategory[randomEquipmentIndex];
        // 운동 퀘스트 등록하기
        const exercise_quest = await Quest.create({
            quest_category: 'exercise',
            quest_description: `${selectedEquipment.equipment_name}`,
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

        // 사용되지 않은 부위가 없다면 (모든 부위를 다 했다면)
    } else {
        console.log("모든 부위를 다했다.");
        // 사용자 기록에서 부위별 총 볼륨 계산
        let categoryVolume = {};
        user_record.forEach(record => {
            let category;
            // Equipment가 배열인 경우 첫 번째 요소 사용, 아니면 바로 사용
            if (Array.isArray(record.Equipment)) {
                category = record.Equipment[0]?.equipment_category;
            } else {
                category = record.Equipment?.equipment_category;
            }
            const volume = record.record_weight * record.record_count;
            if (category && volume) {
                if (category in categoryVolume) {
                    categoryVolume[category] += volume;
                } else {
                    categoryVolume[category] = volume;
                }
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

        console.log(leastUsedCategory);

        // 해당 부위에서 사용하지 않은 운동기구 찾기
        const allEquipmentsInLeastUsedCategory = await Equipment.findAll({
            where: {equipment_category: leastUsedCategory},
            raw: true,
        });

        console.log(allEquipmentsInLeastUsedCategory);

        // 사용자가 사용한 운동기구 찾기
        const usedEquipmentsInLeastUsedCategory = user_record
            .filter(record => {
                // Equipment가 배열인지, 객체인지에 따라 조건을 다르게 처리
                let category = Array.isArray(record.Equipment) ? record.Equipment[0]?.equipment_category : record.Equipment?.equipment_category;
                return category === leastUsedCategory;
            })
            .map(record => {
                // Equipment가 배열인지, 객체인지에 따라 처리
                return Array.isArray(record.Equipment) ? record.Equipment[0]?.equipment_num : record.Equipment?.equipment_num;
            })
            .filter(num => num !== undefined); // undefined로 된 equipment_num을 제거


        console.log(usedEquipmentsInLeastUsedCategory);
        // 사용하지 않은 운동기구 찾기
        const unusedEquipmentsInLeastUsedCategory = allEquipmentsInLeastUsedCategory
            .filter(equipment => !usedEquipmentsInLeastUsedCategory.includes(equipment.equipment_num));

        console.log(unusedEquipmentsInLeastUsedCategory.length);



        // 사용하지 않은 운동기구가 있으면, 그 중 하나를 랜덤으로 선택하여 운동 퀘스트 생성
        if (unusedEquipmentsInLeastUsedCategory.length > 0) {
            const randomEquipmentIndex = Math.floor(Math.random() * unusedEquipmentsInLeastUsedCategory.length);
            const selectedEquipment = unusedEquipmentsInLeastUsedCategory[randomEquipmentIndex];
            // 운동 퀘스트 등록하기
            const exercise_quest = await Quest.create({
                quest_category: 'exercise',
                quest_description: `${selectedEquipment.equipment_name}`,
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
                let equipmentCategory, equipmentNum;
                // Equipment가 배열인 경우 첫 번째 요소 사용, 아니면 바로 사용
                if (Array.isArray(record.Equipment)) {
                    equipmentCategory = record.Equipment[0]?.equipment_category;
                    equipmentNum = record.Equipment[0]?.equipment_num;
                } else {
                    equipmentCategory = record.Equipment?.equipment_category;
                    equipmentNum = record.Equipment?.equipment_num;
                }
                const volume = record.record_weight * record.record_count;
                if (equipmentCategory === leastUsedCategory && volume) {
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

            console.log(leastUsedEquipmentNum);

            // 가장 적게 사용된 운동기구를 찾은 경우 해당 운동기구에 대한 운동 퀘스트 생성
            if (leastUsedEquipmentNum !== null) {
                const selectedEquipment = allEquipmentsInLeastUsedCategory.find(equipment =>
                    String(equipment.equipment_num) === String(leastUsedEquipmentNum));
                console.log(selectedEquipment);

                // 날짜별 볼륨 합산 객체 생성
                let dailyTotalVolumes = {}; // 날짜별 볼륨 합산 저장 객체

                // 가장 적게 사용된 운동기구에 대해 날짜별 볼륨 합산 계산
                user_record.forEach(record => {
                    console.log(record.Equipment.equipment_num, leastUsedEquipmentNum);
                    if (Number(record.Equipment.equipment_num) === Number(leastUsedEquipmentNum)) {
                        const date = record.record_date; // 날짜 가져오기
                        const volume = record.record_weight * record.record_count; // 해당 기록의 볼륨 계산
                        console.log(date, volume);
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
                    quest_description: `${selectedEquipment.equipment_name}`,
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
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const currentDateString = getDateStringInKST(currentDate); // 현재 날짜를 'YYYY-MM-DD' 형식으로 변환

        const not_process_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {[Op.gt]: 5}, // quest_num이 5보다 큰 조건
                quest_state: '미진행',
            },
            include: [{model: Quest}]
        });

        if (!not_process_quest) {
            return res.status(404).json({message: '미진행 상태의 운동 퀘스트를 찾을 수 없습니다.'});
        }

        await Quest_record.update({
            quest_state: '진행',
            quest_start_date: currentDateString,
            state_update_date: currentDateString,
        }, {
            where: {quest_record_num: not_process_quest.quest_record_num}
        });

        res.status(200).json({message: '퀘스트 수락 처리가 완료되었습니다.'});
    } catch (error) {
        console.error('퀘스트 수락 처리 중 오류:', error);
        res.status(500).json({message: '퀘스트 수락 도중 서버 오류가 발생했습니다.'});
    }
}

// 운동 퀘스트 완료하기 (달성 -> 완료)
exports.finish_exercise_quest = async (req, res) => {
    try {
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const currentDateString = getDateStringInKST(currentDate); // 'YYYY-MM-DD' 형식으로 변환

        const achieve_quest = await Quest_record.findOne({
            where: {
                user_num: req.user.user_num,
                quest_num: {[Op.gt]: 5}, // quest_num이 5보다 큰 조건
                quest_state: '달성',
            },
            include: [{model: Quest}]
        });

        if (!achieve_quest) {
            return res.status(404).json({message: '달성 상태의 운동 퀘스트를 찾을 수 없습니다.'});
        }

        await Quest_record.update({
            quest_state: '완료',
            quest_end_date: currentDateString,
            state_update_date: currentDateString,
        }, {
            where: {quest_record_num: achieve_quest.quest_record_num}
        });

        // 퀘스트 완료에 따른 보상 경험치 반영
        const exp = achieve_quest.Quest.quest_reward;
        await req.user.update({user_exp: req.user.user_exp + exp});

        res.status(200).json({message: '퀘스트 완료 처리가 완료되었습니다.'});
    } catch (error) {
        console.error('퀘스트 완료 처리 중 오류:', error);
        res.status(500).json({message: '퀘스트 완료 도중 서버 오류가 발생했습니다.'});
    }
}

// 완료한 퀘스트 가져오기
exports.get_finished_quest = async (req, res) => {
    try {
        const finishedQuests = await Quest_record.findAll({
            where: {
                user_num: req.user.user_num,
                quest_state: '완료',
            },
            include: [{
                model: Quest,
            }],
            order: [
                ['quest_end_date', 'ASC']
            ]
        });

        if (finishedQuests.length > 0) {
            res.status(200).json({message: "완료된 퀘스트 가져오기 성공", data: finishedQuests});
        } else {
            res.status(200).json({message: "완료된 퀘스트가 없습니다.", data: []});
        }
    } catch (error) {
        console.error('완료된 퀘스트 가져오기 중 오류:', error);
        res.status(500).json({message: '완료된 퀘스트를 가져오는 도중 서버 오류가 발생했습니다.'});
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

        try {
            const imagePath = req.file.path;

            const newBodyInfo = await Body.create({
                user_num: req.user.user_num,
                body_date: currentDateString,
                body_weight: req.body.weight,
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
        const before_body_info = await Body.findAll({
            where: {
                user_num: req.user.user_num,
            },
            order: [
                ['body_date', 'ASC'] // body_date를 기준으로 오름차순 정렬
            ]
        });
        // 성공 메시지 전송
        if (before_body_info.length > 0) {
            res.status(200).json({message: "신체 정보 가져오기 성공", data: before_body_info});
        } else {
            res.status(200).json({message: "신체 정보가 없습니다.", data: []});
        }
    } catch (err) {
        res.status(500).send({message: "Server error", error: err.message});
    }
};


// 맞춤형 분할운동 분할 정보 저장하기
exports.add_division_info = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentDateString = getDateStringInKST(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())); // 'YYYY-MM-DD' 형식으로 변환

        const divisionInfo = {
            ...req.body,
            user_num: req.user.user_num,
            division_start_date: currentDateString
        };

        // 기존 분할 정보가 있으면 삭제
        await Division.destroy({
            where: {
                user_num: req.user.user_num,
            }
        });

        // 새로운 분할 정보 추가
        const new_division_info = await Division.create(divisionInfo);

        if (new_division_info) {
            res.status(200).json({message: "분할 정보 저장에 성공했습니다."});
        } else {
            res.status(400).json({message: "분할 정보 저장에 실패했습니다."});
        }
    } catch (err) {
        console.error('분할 정보 저장 중 서버 오류:', err.message);
        res.status(500).json({message: "서버 오류로 분할 정보 저장에 실패했습니다.", error: err.message});
    }
};

// 맞춤형 분할운동 가져오기
exports.get_division_info = async (req, res) => {
    try {
        // 현재 날짜 생성 (연-월-일만 고려)
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        // 분할 정보 가져오기
        const division_info = await Division.findOne({
            where: {
                user_num: req.user.user_num,
            },
        });
        // 분할 정보가 없다면
        if (!division_info) {
            res.status(200).json({message: "맞춤형 분할 정보가 없습니다.", data: []});
            // 분할 정보가 있다면
        } else {
            // 분할운동 시작일부터 오늘이 몇 일 째인지 계산
            const division_exercise_day = moment(currentDateString).diff(moment(division_info.division_start_date), 'days');
            const division_count = division_info.division_count;
            // 오늘이 몇 번째 카테고리인지 계산
            const today_category_idx = division_exercise_day % division_count;
            // 카테고리 정보를 배열로 구성
            const categories = [
                division_info.first_category,
                division_info.second_category,
                division_info.third_category,
                division_info.fourth_category
            ].filter(category => category !== null); // null이 아닌 카테고리만 필터링
            // 오늘의 카테고리
            const today_category = categories[today_category_idx];
            // 요청에서 북마크 유무 추출
            const isMark = req.body.isMark;
            // 북마크가 설정되어 있다면
            if (isMark) {
                // 북마크에서 오늘 해야할 부위의 운동 가져오기
                const markInfo = await Own.findAll({
                    where: {
                        user_num: req.user.user_num,
                    },
                    attributes: [],
                    include: [{
                        model: Equipment, // Equipment_db와 조인
                        where: {
                            equipment_category: {
                                [Op.in]: today_category // 오늘의 카테고리
                            }
                        }
                    }]
                });
                if (markInfo.length > 0) {
                    res.status(200).json({message: "(북마크) 맞춤형 분할운동 가져오기 성공", data: markInfo.map(info => info.Equipment)});
                } else {
                    res.status(200).json({message: "맞춤형 분할운동에 북마크된 정보가 없습니다.", data: []});
                }
                // 북마크가 설정되어 있지 않다면
            } else {
                // 전체 운동기구에서 오늘 해야할 부위의 운동 가져오기
                const exerInfo = await Equipment.findAll({
                    where: {
                        equipment_category: {
                            [Op.in]: today_category // 오늘의 카테고리
                        }
                    },
                });
                if (exerInfo.length > 0) {
                    res.status(200).json({message: "맞춤형 분할운동 가져오기 성공", data: exerInfo});
                } else {
                    res.status(200).json({message: "맞춤형 분할운동 정보가 없습니다.", data: []});
                }
            }
        }
    } catch (err) {
        console.error('맞춤형 분할운동 가져오기 중 오류:', err.message);
        res.status(500).json({message: "서버 오류로 맞춤형 분할운동 정보를 가져오는데 실패했습니다.", error: err.message});
    }
};