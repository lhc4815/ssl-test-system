console.log('🚀 CONFIG.JS LOADED - NEW VERSION');
console.log('🚀 Current timestamp:', new Date().toISOString());

// Railway 환경변수 강제 로딩 (dotenv는 개발환경에서만)
try {
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
} catch (error) {
  console.log('⚠️ dotenv not loaded (this is normal in production)');
}

// 모든 환경변수 확인
console.log('🔍 ALL ENVIRONMENT VARIABLES:');
console.log('Total env vars:', Object.keys(process.env).length);
console.log('DB related vars:', Object.keys(process.env).filter(key => key.includes('DB')));
console.log('All env keys (first 20):', Object.keys(process.env).slice(0, 20));

// Railway 환경변수 직접 접근
const dbHost = process.env.DB_HOST;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const nodeEnv = process.env.NODE_ENV;

// 디버깅을 위한 환경변수 로깅
console.log('🔍 CRITICAL Environment variables check:');
console.log('NODE_ENV:', nodeEnv);
console.log('DB_HOST:', dbHost);
console.log('DB_USERNAME:', dbUsername);
console.log('DB_NAME:', dbName);
console.log('DB_PASSWORD exists:', !!dbPassword);

// 🚨 강력한 환경변수 검증 - 없으면 즉시 종료
if (!dbHost || !dbUsername || !dbPassword || !dbName) {
  console.error('💥 FATAL ERROR: Missing required environment variables!');
  console.error('Required: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME');
  console.error('Current values:', { 
    dbHost: dbHost || 'MISSING', 
    dbUsername: dbUsername || 'MISSING', 
    dbName: dbName || 'MISSING', 
    dbPassword: dbPassword ? 'SET' : 'MISSING' 
  });
  console.error('💥 APPLICATION WILL EXIT NOW');
  process.exit(1); // 강제 종료
}

console.log('✅ All environment variables are present!');

// 동적 DB 설정을 위한 함수 (surveyType별 검증 포함)
const getDatabaseConfig = (surveyType = 'v1') => {
  console.log(`🔍 Requesting database config for surveyType: ${surveyType}`);
  
  // 현재 지원되는 surveyType 목록
  const supportedSurveyTypes = ['v1'];
  
  if (!supportedSurveyTypes.includes(surveyType)) {
    console.error(`❌ Unsupported surveyType: ${surveyType}. Supported types: ${supportedSurveyTypes.join(', ')}`);
    throw new Error(`검사 유형 '${surveyType}'은 아직 준비되지 않았습니다. 현재 이용 가능한 검사 유형: ${supportedSurveyTypes.join(', ')}`);
  }
  
  // surveyType에 따른 데이터베이스 이름 생성
  const databaseName = `SSL-survey-${surveyType}`;
  
  // 환경변수의 DB_NAME과 비교하여 일치하는지 확인
  const envDbName = dbName || 'SSL-survey-v1';
  if (databaseName !== envDbName) {
    console.error(`❌ Database mismatch: requested '${databaseName}' but environment has '${envDbName}'`);
    throw new Error(`요청된 검사 유형 '${surveyType}'에 해당하는 데이터베이스가 설정되지 않았습니다.`);
  }
  
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
