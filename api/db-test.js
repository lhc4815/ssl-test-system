const mysql = require('mysql2/promise');

module.exports = async function handler(req, res) {
  console.log('🔍 DB Test API called');
  
  try {
    // 환경변수 확인
    console.log('Environment variables check:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USERNAME:', process.env.DB_USERNAME);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        available: {
          DB_HOST: !!process.env.DB_HOST,
          DB_USERNAME: !!process.env.DB_USERNAME,
          DB_PASSWORD: !!process.env.DB_PASSWORD,
          DB_NAME: !!process.env.DB_NAME
        }
      });
    }

    // 직접 MySQL 연결 테스트
    console.log('🔗 Attempting direct MySQL connection...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    });

    console.log('✅ MySQL connection successful!');

    // 간단한 쿼리 테스트
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful!', rows);

    // 실제 테이블 확인
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables);

    await connection.end();

    res.status(200).json({ 
      message: 'MySQL connection successful!',
      test_query: rows,
      available_tables: tables,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ DB connection error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      errno: error.errno
    });
  }
}
