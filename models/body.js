const Sequelize = require("sequelize");

//  Body 모델 정의
class Body extends Sequelize.Model {
    static initiate(sequelize) {
        Body.init(
            {
                body_num: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                user_num: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                body_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: false,
                },
                body_weight: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                },
                body_image: {
                    type: Sequelize.STRING(256),
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: false,
                underscored: false,
                modelName: "Body",
                tableName: "body_db", //  테이블 이름
                freezeTableName: true, //  테이블 이름 복수화 방지
                paranoid: false,
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
            }
        );
    }
    // 외래키 설정
    static associate(models) {
        Body.belongsTo(models.User, {foreignKey: 'user_num'})
    }
}

module.exports = Body;