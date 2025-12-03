module.exports = async (req, res) => {
  console.log('🧪 Test endpoint called');
  console.log('📋 Request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
};