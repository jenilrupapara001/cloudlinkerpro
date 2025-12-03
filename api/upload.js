const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { Readable } = require('stream');

const formidable = require('formidable');
const fs = require('fs-extra');

// Simple Image model for Vercel
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

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const { method } = req;
    const url = new URL(req.url, `https://${req.headers.host}`);
    const pathname = url.pathname;

    if (method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Parse multipart form data
    const form = new formidable.IncomingForm({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      multiples: true
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(400).json({ success: false, message: 'Error parsing form data' });
      }

      try {
        // Handle single file upload
        if (files.image && !Array.isArray(files.image)) {
          const result = await uploadSingleFile(files.image);
          return res.status(200).json({
            success: true,
            data: result
          });
        }

        // Handle multiple files upload
        if (files.images || files['images[]']) {
          const fileArray = files.images || files['images[]'];
          const filesToUpload = Array.isArray(fileArray) ? fileArray : [fileArray];
          
          const uploadPromises = filesToUpload.map(file => uploadSingleFile(file));
          const uploadedImages = await Promise.all(uploadPromises);

          return res.status(200).json({
            success: true,
            count: uploadedImages.length,
            data: uploadedImages
          });
        }

        return res.status(400).json({ success: false, message: 'No files uploaded' });

      } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Upload failed',
          error: error.message 
        });
      }
    });

  } catch (error) {
    console.error('❌ Upload API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

async function uploadSingleFile(file) {
  try {
    console.log('📤 Uploading file:', file.originalFilename);

    // Convert file to buffer
    const fileBuffer = await fs.readFile(file.filepath);
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream({
      folder: 'image-to-link-vercel',
      resource_type: 'auto'
    }, async (error, result) => {
      if (error) throw error;
      return result;
    });

    // Convert buffer to stream and upload
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({
        folder: 'image-to-link-vercel',
        resource_type: 'auto'
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });

      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });

    console.log('✅ Uploaded to Cloudinary:', uploadResult.secure_url);

    // Save to database
    const image = await SimpleImage.create({
      originalFilename: file.originalFilename,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      fileSize: file.size,
      fileType: file.mimetype
    });

    console.log('💾 Saved to database:', image._id);

    // Clean up temp file
    await fs.remove(file.filepath);

    return image;
  } catch (error) {
    console.error('Single file upload error:', error);
    throw error;
  }
}