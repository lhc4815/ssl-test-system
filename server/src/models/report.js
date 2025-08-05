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
      type: DataTypes.STRING(100), // DB 스키마에 맞춰 길이 수정
      allowNull: false
    },
    user_code: {
      type: DataTypes.STRING(255), // DB 스키마와 일치
      allowNull: false
    },
    school: {
      type: DataTypes.STRING(100), // DB 스키마에 맞춰 길이 수정
      allowNull: false
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    gender: {
      type: DataTypes.STRING(50), // DB 스키마에 맞춰 길이 수정
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(100), // DB 스키마에 맞춰 길이 수정
      allowNull: true
    },
    b_grade_subjects_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    desired_high_school: {
      type: DataTypes.STRING(100), // DB 스키마에 맞춰 길이 수정
      allowNull: true
    },
    student_phone: {
      type: DataTypes.STRING(20), // DB 스키마에 맞춰 길이 수정
      allowNull: true,
      comment: '학생 연락처'
    },
    parent_phone: {
      type: DataTypes.STRING(20), // DB 스키마에 맞춰 길이 수정
      allowNull: true,
      comment: '학부모 연락처'
    },
    // DB에 존재하는 개별 점수 컬럼들 추가 (score 컬럼은 제거)
    자기조절능력: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    서류형인재_성향: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    면접형_인재_성향: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    내면학업수행능력: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    언어_이해_활용능력: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    인문형_인재: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    사회과학형_인재: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    경영경제형_인재: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    과학적_추론과_문제_해결력: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    수리논리능력: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    화학_생명공학형: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    컴퓨터공학형: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    기계공학형: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    전자전기공학형: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    산업공학형: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    의약학적성: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    typeB_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    typeC_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ReportV1',
    tableName: 'report_v1',
    timestamps: false
  });
  return ReportV1;
};
