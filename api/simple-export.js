const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

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
  console.log('🚀 Simple Export Handler Started');
  console.log('🔍 Request:', { method: req.method, url: req.url });
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return false;
  }

  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    console.log('🔌 Connecting to MongoDB...');
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected');
    } else {
      console.log('✅ MongoDB already connected');
    }

    console.log('📊 Fetching images...');
    const images = await SimpleImage.find().sort({ uploadDate: -1 });
    console.log('📊 Found images:', images.length);

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

    console.log('📊 Writing Excel file...');
    await workbook.xlsx.write(res);
    res.end();
    console.log('📊 Excel export completed successfully');

  } catch (error) {
    console.error('❌ Export Error:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during export',
      error: error.message 
    });
  }
};