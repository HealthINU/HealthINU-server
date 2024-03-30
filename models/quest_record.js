const Sequelize = require("sequelize");

//  Quest_record 모델 정의
class Quest_record extends Sequelize.Model {
    static initiate(sequelize) {
        Quest_record.init(
            {
                quest_record_num: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                quest_num: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                user_num: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                quest_start_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                quest_end_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                quest_progress: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                },
                quest_state: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                },
                state_update_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
            },
            {
                sequelize,
                timestamps: false,
                underscored: false,
                modelName: "Quest_record",
                tableName: "quest_record_db", //  테이블 이름
                freezeTableName: true, //  테이블 이름 복수화 방지
                paranoid: false,
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
            }
        );
    }
    // 외래키 설정
    static associate(models) {
        Quest_record.belongsTo(models.Quest, {foreignKey: 'quest_num'})
        Quest_record.belongsTo(models.User, {foreignKey: 'user_num'})
    }
}

module.exports = Quest_record;