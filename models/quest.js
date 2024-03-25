const Sequelize = require("sequelize");

//  Quest 모델 정의
class Quest extends Sequelize.Model {
    static initiate(sequelize) {
        Quest.init(
            {
                quest_num: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                quest_category: {
                    type: Sequelize.STRING(20),
                    primaryKey: true,
                    allowNull: false,
                },
                quest_description: {
                    type: Sequelize.STRING(500),
                    allowNull: false,
                },
                quest_reward: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                quest_requirement: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
            },
            {
                sequelize,
                timestamps: false,
                underscored: false,
                modelName: "Quest",
                tableName: "quest_db", //  테이블 이름
                freezeTableName: true, //  테이블 이름 복수화 방지
                paranoid: false,
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
            }
        );
    }
    static associate(models) {
        Quest.hasMany(models.Quest_record, {foreignKey: 'quest_num'});
    }
}



module.exports = Quest;