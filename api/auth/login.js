const mysql = require('mysql2/promise');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, code, surveyType } = req.body;

  if (!name || !code || !surveyType) {
    return res.status(400).json({ message: 'Name, code, and surveyType are required.' });
  }

  console.log('🔍 Login request received:', { name, code, surveyType });

  try {
    // Check if it's the admin code
    if (code === 'ADM0000') {
      // Admin login always succeeds for testing purposes
      return res.status(200).json({ message: 'Admin login successful!', isAdmin: true });
    }

    // Connect to MySQL database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000
    });

    // Check if the code exists and is not used
    const [rows] = await connection.execute(
      'SELECT code_value, is_used FROM Code WHERE code_value = ?',
      [code]
    );

    await connection.end();

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid code.' });
    }

    const foundCode = rows[0];
    if (foundCode.is_used) {
      return res.status(401).json({ message: 'This code has already been used.' });
    }

    // If code is valid and not used, login successful
    res.status(200).json({ message: 'Login successful!', isAdmin: false });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
}
