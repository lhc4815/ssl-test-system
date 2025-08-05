'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProblemV1TypeC extends Model {
    static associate(models) {
      // define association here
    }
  }
  ProblemV1TypeC.init({
    problem_number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    correct_answer: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ProblemV1TypeC',
    tableName: 'problem_v1_type_c',
    timestamps: false
  });
  return ProblemV1TypeC;
};
