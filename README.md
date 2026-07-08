# VendorIQ - Decision Intelligence Platform for SME Procurement

A comprehensive SaaS platform that helps small and medium-sized businesses make better vendor selection decisions using data-driven decision-making techniques.

## 🎯 Features

- **Vendor Management**: Upload, organize, and track vendor information
- **Multi-Criteria Decision Analysis (MCDA)**: Evaluate vendors using multiple criteria
- **TOPSIS Algorithm**: Advanced ranking using Technique for Order Preference by Similarity to Ideal Solution
- **Scenario Simulation**: Run what-if analysis to see how different priorities affect recommendations
- **Executive Dashboard**: Visualize vendor comparisons and decision outcomes
- **Report Generation**: Export detailed analysis reports
- **Role-Based Access**: Admin, Procurement Manager, and Viewer roles

## 🏗️ Architecture

```
Frontend (Next.js) → Backend (FastAPI) → PostgreSQL + Redis
                            ↓
                     Decision Engine (MCDA/TOPSIS)
```

## 📊 Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **PostgreSQL** - Relational database
- **Redis** - Caching layer
- **SQLAlchemy** - ORM
- **NumPy/SciPy** - Numerical computations for MCDA algorithms

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Hook Form** - Form management

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/cimilcharly/VendorIQ.git
cd VendorIQ

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations (if using Alembic)
alembic upgrade head

# Start server
uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/{id}` - Update vendor
- `DELETE /api/vendors/{id}` - Delete vendor
- `POST /api/vendors/{id}/metrics` - Add metrics
- `GET /api/vendors/{id}/metrics` - Get metrics

### Scenarios
- `GET /api/scenarios` - List scenarios
- `POST /api/scenarios` - Create scenario
- `POST /api/scenarios/{id}/run` - Run analysis
- `DELETE /api/scenarios/{id}` - Delete scenario

### Recommendations
- `GET /api/recommendations/scenario/{scenario_id}` - Get recommendations

### Reports
- `GET /api/reports/scenario/{scenario_id}/summary` - Get summary
- `GET /api/reports/scenario/{scenario_id}/detailed` - Get detailed report

## 🔄 Decision Engine

The platform implements multiple MCDA methods:

### 1. **Weighted Sum Model**
Simple scoring: `Score = Σ(Criterion × Weight)`

### 2. **TOPSIS** (Primary Method)
- Normalizes vendor metrics
- Applies weights
- Calculates distance to ideal and anti-ideal solutions
- Ranks based on similarity to ideal solution

### 3. **Sensitivity Analysis**
- Tests how rankings change with different weights
- Helps identify robust recommendations

## 🗄️ Database Schema

```
Users
├── id, email, username, full_name, hashed_password
├── role (admin, procurement_manager, viewer)
└── organization_id

Organizations
├── id, name, industry, subscription_plan
└── users, vendors, scenarios

Vendors
├── id, name, category, region, gst_number
├── contact_email, contact_phone
└── metrics

VendorMetrics
├── cost, quality, delivery_time
├── reliability, compliance, rating
└── financial_stability

Scenarios
├── id, name, description, weights
├── created_by, created_at
└── recommendations

Recommendations
├── vendor_id, score, rank
└── scenario_id
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Vercel (Frontend)
```bash
vercel deploy --prod
```

### Railway (Backend)
Push to GitHub and connect to Railway for automatic deployment.

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=your-secret-key
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api.vendoriq.com
```

## 📈 Roadmap

- [ ] AI-powered insights using OpenAI API
- [ ] CSV/Excel bulk import
- [ ] PDF report generation
- [ ] Email notifications
- [ ] Team collaboration features
- [ ] Advanced analytics and trends
- [ ] Mobile app
- [ ] API access for enterprise plans

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 📧 Contact

For support, email: support@vendoriq.com

---

Built with ❤️ for better procurement decisions
