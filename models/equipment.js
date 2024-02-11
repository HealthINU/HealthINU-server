const Sequelize = require("sequelize");

//  User 모델 정의
class Equipment extends Sequelize.Model {
  static initiate(sequelize) {
    Equipment.init(
      {
        equipment_num: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        equipment_name: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        equipment_category: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        equipment_image: {
          type: Sequelize.STRING(256),
          allowNull: true,
        },
        equipment_description: {
          type: Sequelize.STRING(1000),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modelName: "Equipment",
        tableName: "equipment_db", //  테이블 이름
        freezeTableName: true, //  테이블 이름 복수화 방지
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(models) {
      Equipment.hasMany(models.Own, {foreignKey: 'equipment_num'});
  }
}

module.exports = Equipment;
