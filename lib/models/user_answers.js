'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserAnswers extends Model {
    static associate(models) {
      // define association here
      // UserAnswers could be associated with Code model via user_code
    }
  }
  UserAnswers.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    type_a_answers: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of Type A answers (1-5 scale)'
    },
    type_b_answers: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of Type B answers (A,B,C,D)'
    },
    type_c_answers: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of Type C answers (A,B,C,D)'
    },
    test_started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    test_completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_questions_answered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'UserAnswers',
    tableName: 'user_answers',
    timestamps: false, // We're using custom timestamp fields
    indexes: [
      {
        name: 'idx_user_code',
        fields: ['user_code']
      },
      {
        name: 'idx_test_completed',
        fields: ['test_completed_at']
      }
    ]
  });
  return UserAnswers;
};
