module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  // Check environment variables
  const envStatus = {
    MONGO_URI: process.env.MONGO_URI ? '✅ Set' : '❌ Missing',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
  };

  const hasAllEnv = Object.values(envStatus).every(status => status === '✅ Set');

  res.status(200).json({ 
    status: hasAllEnv ? 'healthy' : 'missing_env_vars', 
    message: 'CloudLinker Pro API - Vercel Deployment',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: envStatus,
    uploadMethod: hasAllEnv ? 'Direct Cloudinary (Unlimited)' : 'Requires environment setup'
  });
};