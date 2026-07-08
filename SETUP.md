# VendorIQ Setup Guide

## Quick Start with Docker

The easiest way to get VendorIQ running locally is with Docker Compose.

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- FastAPI backend on port 8000
- Next.js frontend on port 3000

Access the app at: http://localhost:3000

## Development Setup

### 1. Backend Development

```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL=postgresql://user:password@localhost:5432/vendoriq

# Start development server
uvicorn main:app --reload
```

### 2. Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Access frontend at: http://localhost:3000

## Database Setup

### With PostgreSQL locally installed:

```bash
# Create database
createdb vendoriq

# Set up with psql
psql vendoriq -c "CREATE USER vendoriq WITH PASSWORD 'vendoriq_password';"
psql vendoriq -c "ALTER ROLE vendoriq CREATEDB;"
```

### With Docker:

```bash
docker run -d \
  --name vendoriq-postgres \
  -e POSTGRES_USER=vendoriq \
  -e POSTGRES_PASSWORD=vendoriq_password \
  -e POSTGRES_DB=vendoriq \
  -p 5432:5432 \
  postgres:15-alpine
```

## Creating First User

Once backend is running, use the API:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vendoriq.com",
    "username": "admin",
    "full_name": "Admin User",
    "password": "admin123"
  }'
```

Then login at http://localhost:3000

## Verification Checklist

- [ ] PostgreSQL running and accessible
- [ ] Redis running
- [ ] Backend API responding at http://localhost:8000/docs
- [ ] Frontend loads at http://localhost:3000
- [ ] Can register and login
- [ ] Can add vendors
- [ ] Can create scenarios
- [ ] Can run analysis

## Troubleshooting

### Database connection error
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check database user permissions

### Port already in use
- Change ports in docker-compose.yml or use:
  ```bash
  sudo lsof -i :8000  # Find process on port 8000
  kill -9 <PID>       # Kill process
  ```

### Redis connection error
- Ensure Redis is running
- Check REDIS_URL in .env

### Frontend not connecting to API
- Check NEXT_PUBLIC_API_URL in frontend/.env.local
- Verify backend is running on correct port
- Check CORS settings in backend/app/core/config.py
