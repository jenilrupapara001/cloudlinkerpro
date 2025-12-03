# 🔧 Environment Variables Setup Guide

## Required Environment Variables for Vercel Deployment

You need to set these environment variables in your Vercel dashboard:

### 1. Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Select your **CloudLinker Pro** project
3. Go to **Settings** → **Environment Variables**

### 2. Add These Variables:

#### MongoDB Connection
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

#### Cloudinary Credentials
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 📍 Where to Find Cloudinary Credentials:

1. **Login** to [Cloudinary Dashboard](https://cloudinary.com/console)
2. **Copy** these values from your dashboard:

```
Cloud name: dsiwxu4ny          (or your unique name)
API Key: [YOUR_API_KEY]        (shown in dashboard)
API Secret: [YOUR_SECRET]      (shown in dashboard - keep this private)
```

## 🚀 After Setting Environment Variables:

1. **Redeploy** your application:
   ```bash
   vercel --prod
   ```

2. **Test** the upload functionality at: https://cloudlinkerpro-1.vercel.app

## ❌ Common Issues:

### Issue: 401 Unauthorized Error
**Cause**: Environment variables not set or incorrect
**Solution**: Double-check all environment variables are set correctly in Vercel

### Issue: MongoDB Connection Error
**Cause**: Invalid MongoDB connection string
**Solution**: Ensure your MONGO_URI is correct and accessible

## 🧪 Test Environment Variables:

You can test if your environment variables are set correctly by visiting:
https://cloudlinkerpro-1.vercel.app/api/health

The response should include your environment status without errors.