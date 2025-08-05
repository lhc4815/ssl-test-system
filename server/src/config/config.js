// Production 환경에서만 dotenv 로드 (Railway에서는 불필요)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// 디버깅을 위한 환경변수 로깅
console.log('🔍 Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_NAME:', process.env.DB_NAME);

// 동적 DB 설정을 위한 함수
const getDatabaseConfig = (surveyType = 'v1') => {
  const databaseName = `${process.env.DB_NAME || 'SSL-survey'}-${surveyType}`;
  
  const config = {
    username: process.env.DB_USERNAME || "username",
    password: process.env.DB_PASSWORD || "password",
    database: databaseName,
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: process.env.NODE_ENV === 'production' ? false : console.log
  };
  
  console.log(`🔧 Database config for ${surveyType}:`, {
    ...config,
    password: '***masked***'
  });
  
  return config;
};

// 기본 설정 (기존 호환성 유지)
module.exports = {
  development: getDatabaseConfig('v1'),
  test: getDatabaseConfig('v1'),
  production: getDatabaseConfig('v1'),
  
  // 동적 설정 함수 export
  getDatabaseConfig: getDatabaseConfig
};
