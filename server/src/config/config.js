// Railway 환경변수 강제 로딩 (dotenv는 개발환경에서만)
try {
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
} catch (error) {
  console.log('⚠️ dotenv not loaded (this is normal in production)');
}

// Railway 환경변수 직접 접근
const dbHost = process.env.DB_HOST;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const nodeEnv = process.env.NODE_ENV;

// 디버깅을 위한 환경변수 로깅
console.log('🔍 Environment variables check:');
console.log('NODE_ENV:', nodeEnv);
console.log('DB_HOST:', dbHost);
console.log('DB_USERNAME:', dbUsername);
console.log('DB_NAME:', dbName);
console.log('All env keys:', Object.keys(process.env).filter(key => key.startsWith('DB_')));

// 환경변수 검증
if (!dbHost || !dbUsername || !dbPassword || !dbName) {
  console.error('❌ Missing required environment variables!');
  console.error('Required: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME');
  console.error('Current values:', { dbHost, dbUsername, dbName, dbPassword: dbPassword ? '***set***' : 'undefined' });
}

// 동적 DB 설정을 위한 함수 (더 직접적인 방식)
const getDatabaseConfig = (surveyType = 'v1') => {
  // surveyType 접미사 제거 - Railway에서 직접 전체 DB명 설정
  const databaseName = dbName || 'SSL-survey-v1';
  
  const config = {
    username: dbUsername || "username",
    password: dbPassword || "password", 
    database: databaseName,
    host: dbHost || "localhost",
    dialect: "mysql",
    logging: nodeEnv === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
  
  console.log(`🔧 Database config for ${surveyType}:`, {
    ...config,
    password: config.password ? '***masked***' : 'undefined'
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
