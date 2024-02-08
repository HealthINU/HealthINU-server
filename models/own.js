const Sequelize = require("sequelize");

//  User 모델 정의
class Own extends Sequelize.Model {
  static initiate(sequelize) {
    Own.init(
      {
        user_num: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
        },
        equipment_num: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
        },
        own_image: {
          type: Sequelize.STRING(256),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modelName: "Own",
        tableName: "own_db", //  테이블 이름
        freezeTableName: true, //  테이블 이름 복수화 방지
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
}

module.exports = Own;
