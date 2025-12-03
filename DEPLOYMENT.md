# CloudLinker Pro - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Database**: MongoDB Atlas or local MongoDB instance
3. **Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com)

## Environment Variables

Set the following environment variables in your Vercel dashboard:

```
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Installation Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy the Project

```bash
# In your project directory
vercel --prod
```

### 4. Set Environment Variables

After deployment, go to your Vercel dashboard:
1. Select your project
2. Go to Settings → Environment Variables
3. Add all the environment variables listed above

### 5. Redeploy

After setting environment variables, redeploy:

```bash
vercel --prod
```

## Project Structure

```
├── api/
│   ├── health.js       # Health check endpoint
│   ├── images.js       # Image management (GET, DELETE, export)
│   └── upload.js       # Image upload endpoint
├── index.html          # Frontend application
├── package.json        # Dependencies and scripts
└── vercel.json         # Vercel configuration
```

## API Endpoints

- **GET /api/health** - Health check
- **POST /api/upload** - Single image upload
- **POST /api/upload** - Multiple image upload (uses `images` or `images[]` field)
- **GET /api/images** - Get all images
- **DELETE /api/:id** - Delete specific image
- **GET /api/export/excel** - Export images to Excel

## Features

- ✅ **Unlimited file size uploads**
- ✅ **Multiple file upload support**
- ✅ **Drag & drop interface**
- ✅ **Real-time progress tracking**
- ✅ **Excel export functionality**
- ✅ **MongoDB integration**
- ✅ **Cloudinary cloud storage**
- ✅ **Responsive design**
- ✅ **Full-width layout**

## Local Development

To test locally before deploying:

```bash
# Install dependencies
npm install

# Start Vercel development server
npm run dev
```

Your app will be available at `http://localhost:3000`

## Troubleshooting

### Upload Issues
- Ensure MongoDB connection string is correct
- Verify Cloudinary credentials
- Check Vercel function logs in dashboard

### File Size Limits
- Vercel free tier has 5MB request limit for forms
- For larger files, consider using Cloudinary direct upload

### CORS Issues
- All API endpoints include proper CORS headers
- Make sure to use relative URLs (`/api/...`) not absolute URLs

## Production Tips

1. **Monitor Usage**: Check Vercel dashboard for function execution metrics
2. **Database Indexing**: Add indexes to MongoDB collection for better performance
3. **CDN**: Vercel automatically provides CDN for static assets
4. **SSL**: SSL is automatically provided by Vercel

## Support

For issues related to:
- **Vercel Deployment**: Check [Vercel Documentation](https://vercel.com/docs)
- **MongoDB**: Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- **Cloudinary**: Check [Cloudinary Documentation](https://cloudinary.com/documentation)

## License

MIT License - feel free to use this project for personal or commercial purposes.