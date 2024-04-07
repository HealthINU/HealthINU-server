const Sequelize = require("sequelize");

//  환경 변수를 불러와서 개발 환경인지 배포 환경인지 확인
const env = process.env.NODE_ENV || "development";
//  환경에 따라 config/config.json에서 설정값 가져오기
const config = require("../config/config")[env]["db"];

//  User 모델 가져오기
const User = require("./user");
const Equipment = require("./equipment");
const Own = require("./own");
const Record = require("./record");
const Quest = require("./quest");
const Quest_record = require("./quest_record");
const Body = require("./body");

const db = {};
//  시퀄라이즈 정보 설정
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

db.Sequelize = Sequelize;
db.sequelize = sequelize;

//  모델 초기화
User.initiate(sequelize);
Equipment.initiate(sequelize);
Own.initiate(sequelize);
Record.initiate(sequelize);
Quest.initiate(sequelize);
Quest_record.initiate(sequelize);
Body.initiate(sequelize);

//  associate 메소드 호출
const models = {
    User: User,
    Equipment: Equipment,
    Own: Own,
    Record: Record,
    Quest: Quest,
    Quest_record: Quest_record,
    Body: Body,
};
Object.keys(models).forEach(key => {
    if ('associate' in models[key]) {
        models[key].associate(models);
    }
});

module.exports = db;
