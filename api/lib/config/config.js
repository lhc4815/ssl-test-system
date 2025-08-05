require('dotenv').config();

// 동적 DB 설정을 위한 함수
const getDatabaseConfig = (surveyType = 'v1') => {
  const databaseName = `${process.env.DB_NAME || 'SSL-survey'}-${surveyType}`;
  
  return {
    username: process.env.DB_USERNAME || "username",
    password: process.env.DB_PASSWORD || "password",
    database: databaseName,
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql"
  };
};

// 기본 설정 (기존 호환성 유지)
module.exports = {
  development: getDatabaseConfig('v1'),
  test: getDatabaseConfig('v1'),
  production: getDatabaseConfig('v1'),
  
  // 동적 설정 함수 export
  getDatabaseConfig: getDatabaseConfig
};
