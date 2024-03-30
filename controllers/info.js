const Equipment = require("../models/equipment");
const Own = require("../models/own");
const Record = require("../models/record");
const Quest = require("../models/quest");
const Quest_record = require("../models/quest_record");
const {Op} = require("sequelize");

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
exports.add_own = (req, res) => {
    // 요청에서 정보 추출
    const ownInfo = req.body;
    // 요청 본문의 user_num과 req.user.user_num이 일치하는지 확인(검증)
    if (ownInfo.user_num !== req.user.user_num) {
        // 만약 토큰정보와 추가할 유저 정보가 일치하지 않으면 에러 메시지 전송(부적절한 접근)
        res.status(400).send({message: "Invalid access"})
    } else {
        // 일치하면 새로운 소유 정보 생성
        Own.create(ownInfo)
            .then((own) => {
                // 추가 성공 메시지 전송
                res.status(200).send({message: "Success"});
            })
            .catch((err) => {
                // 추가 실패 메시지 전송
                res.status(400).send({message: "Server error"});
            });
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
    })
        .then((record) => {
            //  가져오기 성공 메시지 전송
            if (record.length > 0) {
                res.status(200).send({data: record, message: "Success"});
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

    // 요청 본문의 user_num과 req.user.user_num이 일치하는지 확인(검증)
    if (recordInfo.user_num !== req.user.user_num) {
        // 만약 토큰정보와 추가할 유저 정보가 일치하지 않으면 에러 메시지 전송(부적절한 접근)
        res.status(400).send({message: "Invalid access"})
    } else {
        // 운동기록에 따른 경험치
        const exp = recordInfo.record_weight * recordInfo.record_count;
        // 일치하면 record_db에 기록 추가
        try {
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

// // 출석 퀘스트 실패, 완료 처리 알고리즘
// exports.check_attendance_quest = (req, res, next) => {
//     Quest_record.findOne({
//         where: {
//             user_num: req.user.user_num,
//             quest_state: '진행'
//         },
//     })
//         .then((quest_record) => {
//             if (!quest_record) {
//                 return res.status(200).send({message: "진행 중인 퀘스트가 없습니다."});
//             }
//             const questRequirement = quest_record.quest_requirement;
//             // quest_record_db에서 가져온 시작일 사용
//             const startDate = new Date(quest_record.quest_start_date);
//
//             // 종료일 계산
//             const endDate = new Date(startDate);
//             endDate.setDate(startDate.getDate() + questRequirement - 1);
//
//             const today = new Date();
//             today.setHours(0, 0, 0, 0); // 오늘 날짜를 자정으로 설정
//
//             // startDate의 다음 날부터 today(오늘)까지 날짜 배열 생성
//             const nextDay = new Date(startDate);
//             nextDay.setDate(startDate.getDate() + 1); // 시작일의 다음 날
//
//             // nextDay(다음날)부터 today(오늘)까지 날짜 배열 생성
//             const dateArray = [];
//             for (let d = new Date(nextDay); d <= today; d.setDate(d.getDate() + 1)) {
//                 dateArray.push(new Date(d).toISOString().slice(0, 10)); // YYYY-MM-DD 형태로 변환
//             }
//             // 날짜별로 운동 기록이 있는지 확인
//             Promise.all(dateArray.map(date => {
//                 return Record.findOne({
//                     where: {
//                         user_num: req.user.user_num,
//                         record_date: date,
//                     }
//                 });
//             }))
//                 .then(results => {
//                     const allDatesHaveRecords = results.every(record => record !== null);
//
//                     // 종료일이 오늘보다 크고 모든 날짜에 기록이 있으면 '진행' 상태 유지
//                     if (endDate > today && allDatesHaveRecords) {
//                         quest_record.quest_state = '진행';
//                     } else if (allDatesHaveRecords && endDate >= today) {
//                         // 오늘 날짜가 종료일 이상이고 모든 날짜에 기록이 있으면 '완료'
//                         quest_record.quest_state = '완료';
//                     } else {
//                         // 하루라도 기록이 없으면 '실패'
//                         quest_record.quest_state = '실패';
//                     }
//                     quest_record.save()
//                         .then(() => res.status(200).send({message: `퀘스트 ${quest_record.quest_state} 처리되었습니다.`}))
//                         .catch(err => res.status(200).send({message: "퀘스트 상태 업데이트 실패"}));
//                 })
//                 .catch(err => {
//                     console.log(err);
//                     res.status(200).send({message: "운동 기록 조회 실패"});
//                 });
//         })
//         .catch(err => {
//             console.log(err);
//             res.status(400).send({message: "서버 오류"});
//         });
//     next();
// };

// // 출석 퀘스트 생성 알고리즘
// exports.attendance_quest = (req, res) => {
//     Quest_record.findOne({
//         where: {
//             user_num: req.user.user_num,
//         },
//         order: [
//             ['quest_record_num', 'DESC'] // quest_record_num 기준으로 내림차순 정렬 (가장 최근)
//         ],
//         limit: 1 // 결과를 하나만 가져옴
//     })
//         .then((quest_record) => {
//             //  가져오기 성공 메시지 전송
//             if (!quest_record) {
//                 // quest_record가 없다면 quest_db에서 quest_num=1을 찾아서 quest_record_db에 미진행으로 저장
//                 Quest_record.create({
//                     user_num: req.user.user_num,
//                     quest_num: 1,
//                     quest_state: '미진행'
//                 }).then((newRecord) => {
//                     res.status(200).send({data: newRecord, message: "Quest record created"});
//                 })
//                     .catch((err) => {
//                         console.log(err);
//                         res.status(400).send({message: "Failed to create quest record"});
//                     });
//             } else {
//                 // quest_record 상태에 따라 처리
//                 switch (quest_record.quest_state) {
//                     case '완료':
//                         // 완료한 퀘스트의 다음 퀘스트를 찾아서 미진행으로 저장
//                         Quest.findOne({
//                             where: {quest_num: quest_record.quest_num + 1}
//                         }).then((nextQuest) => {
//                             if (nextQuest && nextQuest.quest_num <= 5) {
//                                 Quest_record.create({
//                                     user_num: req.user.user_num,
//                                     quest_num: nextQuest.quest_num,
//                                     quest_state: '미진행'
//                                 }).then((newRecord) => {
//                                     res.status(200).send({data: newRecord, message: "Quest record created"});
//                                 })
//                                     .catch((err) => {
//                                         console.log(err);
//                                         res.status(400).send({message: "Failed to create quest record"});
//                                     });
//                             } else {
//                                 // 다음 퀘스트가 없는 경우 (예: 마지막 퀘스트를 완료한 경우)
//                                 res.status(200).send({message: "No next quest available"});
//                             }
//                         });
//                         break;
//                     case '실패':
//                         // 실패한 퀘스트를 미진행으로 다시 저장
//                         Quest_record.create({
//                             user_num: req.user.user_num,
//                             quest_num: quest_record.quest_num,
//                             quest_state: '미진행'
//                         }).then((newRecord) => {
//                             res.status(200).send({data: newRecord, message: "Quest record created"});
//                         })
//                             .catch((err) => {
//                                 console.log(err);
//                                 res.status(400).send({message: "Failed to create quest record"});
//                             });
//                         break;
//                     default:
//                         // 진행중이거나 미진행인 경우 변경 없음
//                         res.status(200).send({data: quest_record, message: "Quest in progress or not started"});
//                         break;
//                 }
//             }
//         })
//         .catch((err) => {
//             console.log(err);
//             res.status(400).send({message: "Server error"});
//         });
// };

// 한국 시간대(KST, UTC+9)의 날짜 문자열을 반환하는 함수
function getDateStringInKST(date) {
    const koreaTimeOffset = 9 * 60 * 60 * 1000; // 한국 시간대 오프셋(밀리초 단위)
    const kstDate = new Date(date.getTime() + koreaTimeOffset); // 한국 시간대로 조정
    return kstDate.toISOString().split('T')[0];
}

// 출석 퀘스트 정보 가져오기
exports.get_attendance_quest = (req, res) => {
    // 출석 퀘스트 수행여부
    Quest_record.findOne({
        where: {
            user_num: req.user.user_num,
            quest_state: '진행',
        },
    }).then((process_quest) => {
        // 현재 날짜 생성 (연-월-일만 고려)
        console.log(process_quest);
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
        const currentDateString = getDateStringInKST(currentDate);
        console.log(currentDateString);
        if (process_quest && currentDateString > process_quest.quest_start_date) {
            // 이전 날 (currentDate에서 하루 빼기)
            const previousDate = new Date(currentDate);
            previousDate.setDate(currentDate.getDate() - 1);
            // 이전 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
            const previousDateString = getDateStringInKST(previousDate);
            console.log(previousDateString);
            // 이전 날의 운동기록이 있는지 확인
            Record.findOne({
                where: {
                    record_date: currentDateString,
                    user_num: req.user.user_num,
                },
            }).then((record) => {
                console.log(2);
                console.log(record);
                if (record) {
                    // 오늘이 출석 퀘스트 종료일이라면
                    console.log(3);
                    if (currentDateString === process_quest.quest_end_date) {
                        console.log(4);
                        Record.findOne({
                            where: {
                                record_date: currentDateString,
                                user_num: req.user.user_num,
                            },
                        }).then((today_record) => {
                            // 오늘 운동기록이 있다면
                            console.log(5);
                            if (today_record) {
                                console.log(6);
                                // process_quest의 상태를 달성상태로 변경
                                Quest_record.update({quest_state: '달성', state_update_date: currentDateString},
                                    {
                                        where: {quest_record_num: process_quest.quest_record_num},
                                    }
                                ).then(() => {
                                    res.send('퀘스트 상태가 성공적으로 변경되었습니다.');
                                }).catch((error) => {
                                    // 에러 처리
                                    console.error(error);
                                    res.status(500).send('퀘스트 상태 변경 중 오류가 발생했습니다.');
                                });
                            }
                        }).catch((error) => {
                            console.error(error);
                            res.status(500).send('오늘의 운동 기록 조회 중 오류가 발생했습니다.');
                        });
                        // 출석 퀘스트 종료일이 지났다면
                    } else if (currentDateString > process_quest.quest_end_date) {
                        console.log(7);
                        Record.findOne({
                            where: {
                                record_date: process_quest.quest_end_date,
                                user_num: req.user.user_num,
                            },
                        }).then((process_record) => {
                            // 출석 종료일 날 운동기록이 있다면
                            if (process_record) {
                                console.log(8);
                                // process_quest의 상태를 달성상태로 변경
                                Quest_record.update({quest_state: '달성', state_update_date: currentDateString},
                                    {
                                        where: {quest_record_num: process_quest.quest_record_num},
                                    }
                                ).then(() => {
                                    res.send('퀘스트 상태가 성공적으로 변경되었습니다.');
                                }).catch((error) => {
                                    // 에러 처리
                                    console.error(error);
                                    res.status(500).send('퀘스트 상태 변경 중 오류가 발생했습니다.');
                                });
                            }
                            // 출석 종료일 날 운동기록이 없다면
                            else {
                                console.log(9);
                                // process_quest의 상태를 실패상태로 변경
                                Quest_record.update({quest_state: '실패', state_update_date: currentDateString},
                                    {
                                        where: {quest_record_num: process_quest.quest_record_num},
                                    }
                                ).then(() => {
                                    res.send('퀘스트 상태가 성공적으로 변경되었습니다.');
                                }).catch((error) => {
                                    // 에러 처리
                                    console.error(error);
                                    res.status(500).send('퀘스트 상태 변경 중 오류가 발생했습니다.');
                                });
                            }
                        }).catch((error) => {
                            console.error(error);
                            res.status(500).send('퀘스트 종료일 운동 기록 조회 중 오류가 발생했습니다.');
                        });
                    }
                    // 이전 날의 운동기록이 없다면
                } else {
                    console.log(10);
                    // process_quest의 상태를 실패상태로 변경
                    Quest_record.update({quest_state: '실패', state_update_date: currentDateString},
                        {
                            where: {quest_record_num: process_quest.quest_record_num},
                        }
                    ).then(() => {
                        res.send('퀘스트 상태가 성공적으로 변경되었습니다.');
                    }).catch((error) => {
                        // 에러 처리
                        console.error(error);
                        res.status(500).send('퀘스트 상태 변경 중 오류가 발생했습니다.');
                    });
                }
            }).catch((error) => {
                console.error(error);
                res.status(500).send('이전 날의 운동 기록 조회 중 오류가 발생했습니다.');
            });
        }
    }).catch((error) => {
        console.error(error);
        res.status(500).send('출석 퀘스트 정보 조회 중 오류가 발생했습니다.');
    });
};



