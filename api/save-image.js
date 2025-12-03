const mongoose = require('mongoose');

const SimpleImageSchema = new mongoose.Schema({
  originalFilename: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  }
});

const SimpleImage = mongoose.models.SimpleImage || mongoose.model('SimpleImage', SimpleImageSchema);

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

  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const imageData = await new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch (e) {
          resolve({});
        }
      });
    });

    const { originalFilename, cloudinaryUrl, cloudinaryPublicId, fileSize, fileType } = imageData;

    if (!originalFilename || !cloudinaryUrl || !cloudinaryPublicId) {
      return res.status(400).json({ success: false, message: 'Missing required image data' });
    }

    // Save to database
    const image = await SimpleImage.create({
      originalFilename,
      cloudinaryUrl,
      cloudinaryPublicId,
      fileSize: fileSize || 0,
      fileType: fileType || 'image/jpeg'
    });

    console.log('💾 Saved to database:', image._id);

    res.status(200).json({
      success: true,
      data: image
    });

  } catch (error) {
    console.error('❌ Save Image Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};