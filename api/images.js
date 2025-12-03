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

    // Handle different routes
    if (method === 'GET' && pathname === '/images') {
      // Get all images
      const images = await SimpleImage.find().sort({ uploadDate: -1 });
      
      res.status(200).json({
        success: true,
        count: images.length,
        data: images
      });
    } else if (method === 'DELETE' && pathname.startsWith('/images/')) {
      // Delete image
      const imageId = pathname.split('/').pop();
      const image = await SimpleImage.findById(imageId);

      if (!image) {
        return res.status(404).json({ success: false, message: 'Image not found' });
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(image.cloudinaryPublicId);

      // Delete from database
      await image.deleteOne();

      res.status(200).json({
        success: true,
        data: {}
      });
    } else if (method === 'GET' && pathname === '/export/excel') {
      // Export to Excel
      const images = await SimpleImage.find().sort({ uploadDate: -1 });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Image URLs');

      // Add headers
      worksheet.addRow(['Image Name', 'Image URL']);
      
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
          image.cloudinaryUrl
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
      res.setHeader('Content-Disposition', `attachment; filename="image-urls-${new Date().toISOString().split('T')[0]}.xlsx`);

      // Send workbook
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(404).json({ success: false, message: 'Route not found', pathname });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};