const Sequelize = require("sequelize");

//  User 모델 정의
class User extends Sequelize.Model {
  static initiate(sequelize) {
    User.init(
      {
        user_num: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        user_name: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        user_id: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        user_pw: {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        user_gender: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        user_email: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        user_height: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        user_weight: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        user_level: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 1,
        },
        user_exp: {
          type: Sequelize.FLOAT,
          allowNull: true,
          defaultValue: 0,
        },
        user_provider: {
          type: Sequelize.ENUM("local", "google"),
          allowNull: false,
          defaultValue: "local",
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modelName: "User",
        tableName: "user_db", //  테이블 이름
        freezeTableName: true, //  테이블 이름 복수화 방지
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(models) {
        User.hasMany(models.Record, {foreignKey: 'user_num'});
        User.hasMany(models.Own, {foreignKey: 'user_num'});
        User.hasMany(models.Quest_record, {foreignKey: 'user_num'});
        User.hasMany(models.Body, {foreignKey: 'user_num'});
    }
}

module.exports = User;
