# VendorIQ Deployment Guide (Vercel + Supabase)

## 🚀 Step-by-Step Deployment

### **STEP 1: Create Supabase Account & Database**

1. Go to https://supabase.com and sign up
2. Create a new project
3. Wait for project to initialize
4. Go to **Project Settings → Database** 
5. Copy your connection string (looks like: `postgresql://user:password@host:5432/postgres`)
6. Save this somewhere safe

---

### **STEP 2: Set up Backend (Railway or Render)**

#### **Option A: Deploy to Railway (Recommended)**

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `cimilcharly/VendorIQ` repository
5. In the settings, add environment variables:
   ```
   DATABASE_URL=<your-supabase-connection-string>
   REDIS_URL=redis://default:password@redis.railway.internal:6379
   SECRET_KEY=<generate-random-secret>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   CORS_ORIGINS=https://your-vercel-domain.vercel.app
   ```
6. Click "Deploy"
7. Once deployed, copy your backend URL (looks like: `https://vendoriq-backend-prod.railway.app`)

#### **Option B: Deploy to Render**

1. Go to https://render.com
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Select the `main` branch
6. Settings:
   - **Name**: vendoriq-backend
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 10000`
   - **Environment**:
     ```
     DATABASE_URL=<your-supabase-connection-string>
     SECRET_KEY=<generate-random-secret>
     ALGORITHM=HS256
     ```
7. Deploy and copy your backend URL

---

### **STEP 3: Deploy Frontend to Vercel**

1. Go to https://vercel.com
2. Sign in with GitHub (you said it's linked)
3. Click "Add New" → "Project"
4. Select your `cimilcharly/VendorIQ` repository
5. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Environment Variables**:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
     ```
     (Replace `your-backend-url` with your Railway/Render URL from Step 2)
6. Click "Deploy"
7. Your frontend will be at: `https://vendoriq-prod.vercel.app` (or custom domain)

---

### **STEP 4: Initialize Supabase Database Tables**

Once your backend is deployed:

1. SSH into your backend or use the backend API locally
2. Run this Python script to create tables:

```python
from app.database import Base, engine
from app.models import User, Organization, Vendor, VendorMetric, Scenario, Recommendation

# This creates all tables
Base.metadata.create_all(bind=engine)

print("✅ All tables created in Supabase!")
```

Or use the API endpoint to verify it works:
```bash
curl https://your-backend-url.com/health
```

---

### **STEP 5: Test the Deployment**

1. Visit: `https://your-vercel-domain.vercel.app`
2. Register a new account
3. Add a vendor
4. Create a scenario
5. Run analysis

---

## 📋 Environment Variables Checklist

### **Backend (Railway/Render)**
- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `REDIS_URL` - Redis instance (or leave default)
- [ ] `SECRET_KEY` - Random secret for JWT
- [ ] `ALGORITHM` - HS256
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` - 30
- [ ] `CORS_ORIGINS` - Your Vercel frontend URL

### **Frontend (Vercel)**
- [ ] `NEXT_PUBLIC_API_URL` - Your backend API URL

---

## 🔗 Generate Secret Key

In Python:
```python
import secrets
print(secrets.token_urlsafe(32))
```

Or use this site: https://www.uuidgenerator.net/ (just copy the UUID)

---

## 🆘 Troubleshooting

### **"Failed to connect to database"**
- Check Supabase connection string is correct
- Verify firewall allows connections (Supabase → Project Settings → Network)

### **"CORS error" on frontend**
- Update backend `CORS_ORIGINS` with exact Vercel URL
- Restart backend deployment

### **"Failed to build on Vercel"**
- Check `package.json` in frontend folder exists
- Verify `npm run build` works locally

### **Database tables not created**
- Manually run SQL in Supabase SQL editor:
```sql
-- Copy the DDL from your backend/app/models files
-- Or let the app auto-create on first run
```

---

## 📝 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Railway Dashboard**: https://railway.app/dashboard (if using Railway)
- **Render Dashboard**: https://dashboard.render.com (if using Render)

---

## 🚀 Summary

| Service | What It Does | Cost |
|---------|-------------|------|
| **Vercel** | Hosts frontend (Next.js) | Free tier available |
| **Supabase** | PostgreSQL database | Free 500MB tier |
| **Railway/Render** | Hosts backend (FastAPI) | Free tier available |

All services have generous free tiers for starting projects!

---

**Next Step**: Go to https://supabase.com and create your first project! 🎉
