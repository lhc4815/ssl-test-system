'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProblemV1TypeB extends Model {
    static associate(models) {
      // define association here
    }
  }
  ProblemV1TypeB.init({
    problem_number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT
    },
    passage: {
      type: DataTypes.TEXT
    },
    option_a: {
      type: DataTypes.STRING
    },
    option_b: {
      type: DataTypes.STRING
    },
    option_c: {
      type: DataTypes.STRING
    },
    option_d: {
      type: DataTypes.STRING
    },
    correct_answer: {
      type: DataTypes.STRING
    },
    common_passage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '공통 지문 (8,9번 문항용)'
    }
  }, {
    sequelize,
    modelName: 'ProblemV1TypeB',
    tableName: 'problem_v1_type_b',
    timestamps: false
  });
  return ProblemV1TypeB;
};
