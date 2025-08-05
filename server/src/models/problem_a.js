'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProblemV1TypeA extends Model {
    static associate(models) {
      // define association here
    }
  }
  ProblemV1TypeA.init({
    problem_number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    category_main: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category_sub: {
      type: DataTypes.STRING,
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    correct_answer: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ProblemV1TypeA',
    tableName: 'problem_v1_type_a',
    timestamps: false
  });
  return ProblemV1TypeA;
};
