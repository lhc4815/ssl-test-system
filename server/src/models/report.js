'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReportV1 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ReportV1.init({
    report_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    school: {
      type: DataTypes.STRING(255), // 길이 확장
      allowNull: false
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    gender: {
      type: DataTypes.STRING(255), // 길이 확장
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(255), // 길이 확장
      allowNull: true
    },
    b_grade_subjects_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    desired_high_school: {
      type: DataTypes.STRING(255), // 길이 확장
      allowNull: true
    },
    student_phone: {
      type: DataTypes.STRING(255), // 길이 확장
      allowNull: true,
      comment: '학생 연락처'
    },
    parent_phone: {
      type: DataTypes.STRING(255), // 길이 확장
      allowNull: true,
      comment: '학부모 연락처'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ReportV1',
    tableName: 'report_v1',
    timestamps: false
  });
  return ReportV1;
};
