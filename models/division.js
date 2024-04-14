const Sequelize = require("sequelize");

//  Division 모델 정의
class Division extends Sequelize.Model {
    static initiate(sequelize) {
        Division.init(
            {
                division_num: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                user_num: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                first_category: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                second_category: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                third_category: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                fourth_category: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                division_start_date: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                division_count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: false,
                underscored: false,
                modelName: "Division",
                tableName: "division_db", //  테이블 이름
                freezeTableName: true, //  테이블 이름 복수화 방지
                paranoid: false,
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
            }
        );
    }
    // 외래키 설정
    static associate(models) {
        Division.belongsTo(models.User, {foreignKey: 'user_num'})
    }
}

module.exports = Division;