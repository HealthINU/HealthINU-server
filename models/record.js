const Sequelize = require("sequelize");

//  User 모델 정의
class Record extends Sequelize.Model {
  static initiate(sequelize) {
    Record.init(
      {
        record_num: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        record_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        user_num: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        equipment_num: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        record_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        record_weight: {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 1.0,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modelName: "Record",
        tableName: "record_db", //  테이블 이름
        freezeTableName: true, //  테이블 이름 복수화 방지
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
    // 외래키 설정
    static associate(models) {
        Record.belongsTo(models.Equipment, {foreignKey: 'equipment_num'})
        Record.belongsTo(models.User, {foreignKey: 'user_num'})
    }
}

module.exports = Record;
