require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const ExcelJS = require('exceljs');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Simple Image model without user reference
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

const SimpleImage = mongoose.model('SimpleImage', SimpleImageSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filter files to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // No limits - allow any file size
});

// Configure multer for multiple file uploads (NO LIMITS)
const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter
  // No limits - allow any file size and count
});

// @desc    Upload image (NO AUTH REQUIRED)
// @route   POST /api/upload
// @access  Public
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    console.log('📤 Uploading image:', req.file.originalname);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'image-to-link-simple',
      resource_type: 'auto'
    });

    console.log('✅ Uploaded to Cloudinary:', result.secure_url);

    // Create image record in database
    const image = await SimpleImage.create({
      originalFilename: req.file.originalname,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    console.log('💾 Saved to database:', image._id);

    // Clean up local file
    fs.remove(req.file.path);

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during upload',
      error: error.message 
    });
  }
};

// @desc    Upload multiple images (folder upload)
// @route   POST /api/upload/multiple
// @access  Public
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload image files' });
    }

    console.log(`📤 Uploading ${req.files.length} images`);

    const uploadPromises = req.files.map(async (file) => {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'image-to-link-multiple',
        resource_type: 'auto'
      });

      // Create image record in database
      const image = await SimpleImage.create({
        originalFilename: file.originalname,
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        fileSize: file.size,
        fileType: file.mimetype
      });

      // Clean up local file
      fs.remove(file.path);

      return image;
    });

    const uploadedImages = await Promise.all(uploadPromises);
    
    console.log(`✅ Successfully uploaded ${uploadedImages.length} images`);

    res.status(200).json({
      success: true,
      count: uploadedImages.length,
      data: uploadedImages
    });
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during multiple upload',
      error: error.message 
    });
  }
};

// @desc    Get all images (NO AUTH REQUIRED)
// @route   GET /api/images
// @access  Public
const getAllImages = async (req, res) => {
  try {
    const images = await SimpleImage.find().sort({ uploadDate: -1 });
    console.log(`📊 Found ${images.length} images`);

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('❌ Get images error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error getting images',
      error: error.message 
    });
  }
};

// @desc    Delete image (NO AUTH REQUIRED)
// @route   DELETE /api/:id
// @access  Public
const deleteImage = async (req, res) => {
  try {
    const image = await SimpleImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    console.log('🗑️ Deleting image:', image.originalFilename);

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.cloudinaryPublicId);

    // Delete from database
    await image.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting image',
      error: error.message 
    });
  }
};

// @desc    Export images to Excel
// @route   GET /api/export/excel
// @access  Public
const exportToExcel = async (req, res) => {
  try {
    const images = await SimpleImage.find().sort({ uploadDate: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Image URLs');

    // Add headers
    worksheet.addRow(['Image Name', 'Image URL', 'Upload Date', 'File Size (MB)', 'File Type']);
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    images.forEach(image => {
      worksheet.addRow([
        image.originalFilename,
        image.cloudinaryUrl,
        new Date(image.uploadDate).toLocaleDateString(),
        (image.fileSize / 1024 / 1024).toFixed(2),
        image.fileType
      ]);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(
        ...column.values.map(v => (v ? v.toString().length : 10))
      );
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="image-urls-${new Date().toISOString().split('T')[0]}.xlsx"`);

    console.log(`📊 Exported ${images.length} images to Excel`);

    // Send workbook
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during export',
      error: error.message 
    });
  }
};

// Routes (NO AUTH REQUIRED)
app.post('/api/upload', upload.single('image'), uploadImage);
app.post('/api/upload/multiple', uploadMultiple.array('images'), uploadMultipleImages);
app.get('/api/images', getAllImages);
app.delete('/api/:id', deleteImage);
app.get('/api/export/excel', exportToExcel);

app.get('/', (req, res) => {
  res.send('🚀 Simple Image to Link API is running - NO AUTH REQUIRED!');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Simple Image Upload API - No Auth Required',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: err.message 
  });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`🚀 CloudLinker Pro running on port ${PORT} - NO AUTH REQUIRED`);
  console.log(`🌐 Access the web interface at: file://${process.cwd()}/index.html`);
  console.log(`📁 Project: Professional Cloud-Based Image Sharing Platform`);
  connectDB();
});