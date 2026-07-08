# VendorIQ Hosting & Deployment Guide

This guide explains how to host the VendorIQ application in production using **Render** (for the FastAPI backend, PostgreSQL database, and Redis cache) and **Vercel** (for the Next.js frontend).

---

## 1. Hosting the Backend (on Render)

Render allows declarative deployments using the `render.yaml` blueprint file we added to the repository root.

### Option A: Using the Render Blueprint (Recommended)
1. Log in to [Render](https://render.com/).
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/cimilcharly/VendorIQ`.
4. Render will automatically parse the `render.yaml` file, creating:
   - A PostgreSQL Database (`vendoriq-db`)
   - A Redis cache (`vendoriq-redis`)
   - A Python Web Service (`vendoriq-backend`) with configured environment variables.
5. Click **Apply** and wait for deployment to complete.

### Option B: Manual Setup on Render
If you prefer setting up services manually:
1. **Create PostgreSQL Database**:
   - Go to **New +** -> **PostgreSQL**.
   - Name it `vendoriq-db`.
2. **Create Redis Instance**:
   - Go to **New +** -> **Redis**.
   - Name it `vendoriq-redis`.
3. **Create Web Service for Backend**:
   - Go to **New +** -> **Web Service**.
   - Select your repository.
   - Set **Runtime** to `Python`.
   - Set **Build Command** to:
     ```bash
     pip install -r requirements.txt && alembic upgrade head
     ```
   - Set **Start Command** to:
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - In the **Environment** section, add the following variables:
     - `DATABASE_URL`: Connection string from your Render Postgres.
     - `REDIS_URL`: Connection string from your Render Redis.
     - `ENV`: `production`
     - `SECRET_KEY`: A secure random string (e.g., generated with `openssl rand -hex 32`).

---

## 2. Hosting the Frontend (on Vercel)

Vercel is the recommended hosting platform for Next.js applications.

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository: `https://github.com/cimilcharly/VendorIQ`.
4. In the Project Configuration:
   - **Root Directory**: Select `frontend` (crucial since the repository is monorepo-styled).
   - **Framework Preset**: `Next.js` (automatically detected).
5. Open the **Environment Variables** accordion and add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Render Backend API URL + `/api` suffix (e.g., `https://vendoriq-backend.onrender.com/api`).
6. Click **Deploy**.

---

## 3. Local Development (using Docker Compose)

To run the entire ecosystem locally in containers:
1. Ensure Docker is running.
2. Execute the following command in the project root:
   ```bash
   docker-compose up --build
   ```
3. Access:
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`
