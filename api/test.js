module.exports = async function handler(req, res) {
  console.log('🎯 Test API called');
  res.status(200).json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
