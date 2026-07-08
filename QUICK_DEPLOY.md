# 🚀 Quick Deployment Checklist (5 Minutes)

## Prerequisites
- Vercel account (linked to GitHub) ✅
- Supabase account (create at https://supabase.com)
- Railway or Render account (optional, for backend)

---

## **1️⃣ Create Supabase Database** (2 min)

1. Go to https://supabase.com → Sign up
2. Create new project
3. Go to **Settings → Database** → Copy connection string
4. Save it! You'll need it in step 2

**Example string:**
```
postgresql://postgres:password@db.supabase.co:5432/postgres
```

---

## **2️⃣ Deploy Backend to Railway** (2 min)

1. Go to https://railway.app → Sign in with GitHub
2. New Project → Deploy from GitHub repo
3. Select `cimilcharly/VendorIQ`
4. Add environment variables:
   ```
   DATABASE_URL=<paste-supabase-string-here>
   SECRET_KEY=your-random-secret-key-123
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   CORS_ORIGINS=https://vendoriq-prod.vercel.app
   ```
5. Click Deploy → Copy your backend URL (e.g., `https://vendoriq-backend-prod.railway.app`)

---

## **3️⃣ Deploy Frontend to Vercel** (1 min)

1. Go to https://vercel.com → Click "Add New → Project"
2. Import `cimilcharly/VendorIQ`
3. Configure:
   - Root Directory: `frontend`
   - Add Environment Variable:
     ```
     NEXT_PUBLIC_API_URL=https://your-railway-url/api
     ```
     (Replace with actual Railway backend URL)
4. Click "Deploy"

---

## ✅ Done!

Your app will be live at: `https://vendoriq-prod.vercel.app`

**Test it:**
- Register a new account
- Add a vendor
- Create a scenario
- Run analysis

---

## 🔑 Generate SECRET_KEY

Use any of these:

**Option 1 - Python:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Option 2 - Online:** https://www.uuidgenerator.net/

**Option 3 - Simple:** Just use any random string like `my-secret-key-12345`

---

## 🆘 If Something Goes Wrong

| Error | Solution |
|-------|----------|
| Database connection error | Copy Supabase connection string again, make sure password is correct |
| CORS error on frontend | Update backend's `CORS_ORIGINS` with exact Vercel URL, redeploy |
| "Cannot find module" | Make sure root directory is set to `frontend` in Vercel |
| Backend returns 500 | Check Railway logs for errors |

---

**That's it! You're deployed!** 🎉
