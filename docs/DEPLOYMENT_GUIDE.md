# Deployment Guide - LCA Photography Website

## Project Overview
This is a **Next.js 15** application (not FastAPI + React), so deployment differs from standard full-stack setups.

## Local Development

### 1. Install Dependencies
```bash
cd /app
yarn install
```

### 2. Environment Setup
Ensure `.env.local` contains:
```env
# MongoDB
MONGODB_URI=mongodb+srv://lcavisualstudio_db_user:LCAhemanth@lcawebapp.p7vlwja.mongodb.net/
MONGODB_DB=lca-visual-studios

# Google Drive Service Account
GDRIVE_CLIENT_EMAIL=lca-visual-studios@lca-visual-studios.iam.gserviceaccount.com
GDRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GDRIVE_PARENT_FOLDER_ID=1rX1zpHu5YWLeCo75jWO-UabHqMJrc15H

# JWT & Auth
JWT_SECRET=lca-visual-studios-secret-key-2025
NEXT_PUBLIC_ADMIN_EMAILS=lcavisualstudio@gmail.com
ADMIN_PASSWORD=LCA-Admin-2026!

# Gmail SMTP
GMAIL_USER=lcavisualstudio@gmail.com
GMAIL_APP_PASSWORD=fagldqoekmrddwck

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
yarn dev
```
Access at: `http://localhost:3000`

### 4. Build for Production
```bash
yarn build
```

### 5. Start Production Server
```bash
yarn start
```
Runs on port 3000 by default.

## Production Deployment Options

### Option 1: Vercel (Recommended for Next.js)
Vercel is built for Next.js and offers the best performance.

**Steps:**
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables from `.env.local`
4. Deploy automatically

**Pros:**
- ✅ Automatic deployments
- ✅ Edge network (fastest)
- ✅ Free tier available
- ✅ Built-in image optimization

### Option 2: Docker Container
For custom hosting (AWS, GCP, DigitalOcean).

**Dockerfile Example:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
```

**Build & Run:**
```bash
docker build -t lca-photography .
docker run -p 3000:3000 --env-file .env.local lca-photography
```

### Option 3: Traditional VPS (Ubuntu/CentOS)

**Prerequisites:**
- Node.js 20+
- PM2 for process management
- Nginx as reverse proxy

**Setup:**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install yarn
npm install -g yarn

# Install PM2
npm install -g pm2

# Clone and setup project
cd /var/www
git clone <your-repo>
cd lca-photography-website
yarn install
yarn build

# Start with PM2
pm2 start yarn --name "lca-app" -- start
pm2 save
pm2 startup
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables for Production

⚠️ **CRITICAL: Change these before production deployment!**

```env
# Update these:
ADMIN_PASSWORD=<new-strong-password>
JWT_SECRET=<new-random-secret-256-bits>
GMAIL_APP_PASSWORD=<your-gmail-app-password>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## MongoDB Atlas Setup

Your current connection string:
```
mongodb+srv://lcavisualstudio_db_user:LCAhemanth@lcawebapp.p7vlwja.mongodb.net/
```

**For Production:**
1. Whitelist production server IP in MongoDB Atlas
2. Consider upgrading to paid tier for better performance
3. Enable automatic backups

## Google Drive Service Account

**Current Setup:**
- Service account: `lca-visual-studios@lca-visual-studios.iam.gserviceaccount.com`
- Parent folder: `1rX1zpHu5YWLeCo75jWO-UabHqMJrc15H`

**Verify Permissions:**
1. Service account has access to parent folder
2. Folder is set to "Anyone with link can view" or explicitly shared
3. Enable Google Drive API in GCP console

## Testing the Fix

### Test Image Quality:
```bash
# Get a test image file ID from your Drive folder
curl "https://yourdomain.com/api/drive/preview/YOUR_FILE_ID" \
  -o test-image.jpg

# Check file size - should match original
ls -lh test-image.jpg
```

### Check API Response:
```bash
# Should return original file with proper MIME type
curl -I "https://yourdomain.com/api/drive/preview/YOUR_FILE_ID"
```

Expected headers:
```
Content-Type: image/jpeg (or image/x-sony-arw for RAW)
Content-Length: <original file size>
Cache-Control: public, max-age=31536000, immutable
```

## Performance Monitoring

### Monitor API Response Times:
```javascript
// Add to route.js if needed
console.log(`Preview request for ${fileId} - ${Date.now() - startTime}ms`);
```

### Check Google Drive API Quota:
- Visit: https://console.cloud.google.com/apis/api/drive.googleapis.com/quotas
- Monitor: Queries per day, Queries per 100 seconds per user

## Troubleshooting

### Issue: Images still appear low quality
**Solution:** Clear browser cache and CDN cache

### Issue: Google Drive API quota exceeded
**Solution:** 
1. Implement caching layer (Redis)
2. Increase quota limits in GCP console
3. Consider pre-downloading frequently accessed files

### Issue: Large files timeout
**Solution:** 
1. Increase server timeout settings
2. Implement chunked transfer
3. Use CDN for large files

### Issue: RAW files not displaying in browser
**Expected:** Browsers can't display RAW formats natively. Files will download instead.
**Solution:** Implement server-side conversion (optional)

## Security Checklist

- [ ] Change ADMIN_PASSWORD from default
- [ ] Update JWT_SECRET with random 256-bit key
- [ ] Rotate GMAIL_APP_PASSWORD if exposed
- [ ] Don't commit .env.local to Git
- [ ] Enable HTTPS in production
- [ ] Set CORS properly for production domain
- [ ] Whitelist IPs in MongoDB Atlas
- [ ] Review Google Drive folder permissions
- [ ] Enable rate limiting on API routes

## Cost Considerations

**MongoDB Atlas:**
- Free tier: 512MB storage
- Shared cluster: $0/month
- Dedicated: Starting at $57/month

**Google Drive API:**
- Free tier: 1 billion queries/day
- Typically sufficient unless very high traffic

**Hosting:**
- Vercel: $0-$20/month
- VPS: $5-$20/month (DigitalOcean, Linode)
- AWS/GCP: Variable (typically $10-$50/month)

## Support & Maintenance

### Regular Tasks:
1. Monitor MongoDB storage usage
2. Check Google Drive API quota
3. Review server logs for errors
4. Update dependencies monthly: `yarn upgrade-interactive`
5. Backup database weekly

### When to Scale:
- Site traffic > 10K visitors/day → Consider CDN
- DB size > 500MB → Upgrade MongoDB tier
- API response > 3s → Add caching layer

---

**Questions?** Check the IMAGE_QUALITY_FIX_SUMMARY.md for details on the quality fix implementation.
