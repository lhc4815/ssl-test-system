'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const configModule = require(__dirname + '/../config/config.js');

// 동적 DB 연결을 위한 캐시
const dbConnections = {};

// 동적 모델 생성 함수
const createDynamicDB = (surveyType = 'v1') => {
  // 이미 연결된 DB가 있으면 재사용
  if (dbConnections[surveyType]) {
    return dbConnections[surveyType];
  }

  console.log(`🔄 Creating dynamic DB connection for survey type: ${surveyType}`);
  
  const config = configModule.getDatabaseConfig(surveyType);
  const db = {};

  let sequelize;
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }

  // 모든 모델 파일 로드
  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  // 모델 간 관계 설정
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  // 캐시에 저장
  dbConnections[surveyType] = db;
  console.log(`✅ DB connection cached for survey type: ${surveyType}`);
  
  return db;
};

// 기본 DB 연결 (v1)
const defaultDB = createDynamicDB('v1');

// 기본 export (기존 호환성 유지)
module.exports = defaultDB;

// 동적 DB 생성 함수도 export
module.exports.createDynamicDB = createDynamicDB;
