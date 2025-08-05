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

    // For now, allow test codes without DB connection
    const testCodes = ['TEST0001', 'TEST0002', 'TEST0003'];
    if (testCodes.includes(code)) {
      return res.status(200).json({ message: 'Login successful!', isAdmin: false });
    }

    // Invalid code
    res.status(401).json({ message: 'Invalid code.' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
}
