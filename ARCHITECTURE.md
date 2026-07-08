# VendorIQ Architecture Documentation

## System Overview

VendorIQ is a three-tier SaaS application with a decision intelligence engine at its core.

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│                    Next.js Frontend (TypeScript)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │Dashboard │  │ Vendors  │  │Scenarios │  │ Reports      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────┬─┘
                                                              │
                     HTTP/REST API (JSON)
                                                              │
┌─────────────────────────────────────────────────────────────▼─┐
│                      Application Layer                         │
│                   FastAPI Backend (Python)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐│
│  │ Auth Module  │  │ Vendor CRUD  │  │ Scenario Management  ││
│  └──────────────┘  └──────────────┘  └──────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          Decision Intelligence Engine                     │ │
│  │  ├─ Weighted Sum Model                                   │ │
│  │  ├─ TOPSIS Algorithm                                    │ │
│  │  └─ Sensitivity Analysis                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────┬──────────────────────────────┬────────────────┘
                 │                              │
         Database Layer              Cache Layer
                 │                              │
        ┌────────▼────────┐        ┌───────────▼────────┐
        │  PostgreSQL 15   │        │   Redis 7          │
        │  - Users         │        │   - Session cache  │
        │  - Organizations │        │   - Result cache   │
        │  - Vendors       │        │   - Query cache    │
        │  - Metrics       │        └────────────────────┘
        │  - Scenarios     │
        │  - Results       │
        └──────────────────┘
```

## Core Components

### 1. Authentication & Authorization

**Files**: `backend/app/core/security.py`, `backend/app/api/auth.py`

- JWT-based authentication
- Role-based access control (RBAC)
- Three roles: Admin, Procurement Manager, Viewer
- Password hashing with bcrypt

### 2. Data Models

**Files**: `backend/app/models/*.py`

```python
User
  └─ Organization (1:N)
      ├─ Vendor (1:N)
      │   └─ VendorMetric (1:N)
      └─ Scenario (1:N)
          └─ Recommendation (1:N)
```

### 3. Decision Engine

**Files**: `backend/app/engine/decision.py`

Core algorithms:

#### a) Weighted Sum Model
- Simple weighted average of criteria
- Formula: Score = Σ(Criterion × Weight / 100)
- Fast, interpretable

#### b) TOPSIS (Primary)
- Technique for Order Preference by Similarity to Ideal Solution
- Steps:
  1. Normalize decision matrix
  2. Apply weights
  3. Find ideal and anti-ideal solutions
  4. Calculate separation distances
  5. Compute closeness coefficient

#### c) Sensitivity Analysis
- Varies weights to test ranking stability
- Helps identify robust recommendations
- Range: ±10% variation

### 4. API Endpoints

#### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login
GET    /api/auth/me             - Current user info
```

#### Vendor Management
```
GET    /api/vendors             - List vendors
POST   /api/vendors             - Create vendor
GET    /api/vendors/{id}        - Get vendor details
PUT    /api/vendors/{id}        - Update vendor
DELETE /api/vendors/{id}        - Delete vendor
POST   /api/vendors/{id}/metrics - Add metrics
GET    /api/vendors/{id}/metrics - Get metrics
```

#### Scenario Management
```
GET    /api/scenarios           - List scenarios
POST   /api/scenarios           - Create scenario
GET    /api/scenarios/{id}      - Get scenario
PUT    /api/scenarios/{id}      - Update scenario
DELETE /api/scenarios/{id}      - Delete scenario
POST   /api/scenarios/{id}/run  - Run analysis
```

#### Recommendations & Reports
```
GET    /api/recommendations/scenario/{id}    - Get rankings
GET    /api/reports/scenario/{id}/summary    - Summary report
GET    /api/reports/scenario/{id}/detailed   - Detailed report
POST   /api/reports/scenario/{id}/export     - Export report
```

### 5. Frontend Architecture

#### Pages
- `/` - Landing page
- `/auth/login` - Login
- `/auth/register` - Registration
- `/dashboard` - Main dashboard
- `/dashboard/vendors` - Vendor management
- `/dashboard/scenarios` - Scenario management
- `/dashboard/reports` - Reports view

#### Components
- UI components in `src/components/ui/`
- Shared utilities in `src/lib/`

#### State Management
- React hooks for component state
- localStorage for session/tokens

## Data Flow

### 1. Adding a Vendor
```
User Input (Frontend)
    ↓
POST /api/vendors
    ↓
Validate & Store (Backend)
    ↓
Create VendorMetric record
    ↓
Response with Vendor ID
```

### 2. Running an Analysis (Scenario)
```
User defines weights
    ↓
POST /api/scenarios/{id}/run
    ↓
Fetch all vendors & latest metrics
    ↓
Run TOPSIS algorithm
    ↓
Calculate scores & rankings
    ↓
Save Recommendations
    ↓
Return ranked vendors
```

### 3. Generating Reports
```
GET /api/reports/scenario/{id}
    ↓
Fetch Scenario & Recommendations
    ↓
Join with Vendor data
    ↓
Format response
    ↓
Return to frontend
    ↓
Display/Export
```

## Security Considerations

1. **Authentication**: JWT tokens with 30-minute expiration
2. **Authorization**: Role-based endpoint access control
3. **Data Isolation**: Users only access their organization's data
4. **Password Security**: Bcrypt hashing with salt
5. **CORS**: Restricted to frontend origin
6. **SQL Injection**: SQLAlchemy ORM parameterized queries
7. **Input Validation**: Pydantic schemas on all inputs

## Performance Optimization

1. **Caching**: Redis for frequently accessed data
2. **Indexing**: Database indexes on foreign keys and commonly filtered fields
3. **Pagination**: Implement for large vendor lists
4. **Connection Pooling**: SQLAlchemy session management
5. **Query Optimization**: Eager loading with SQLAlchemy relationships

## Scalability Strategy

### Horizontal Scaling
- Stateless FastAPI backend
- Load balancer (AWS ALB, Nginx)
- Multiple backend instances
- Shared PostgreSQL database
- Redis cluster for caching

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add indexes as needed

### Database Optimization
- Connection pooling
- Read replicas for reporting
- Partitioning for large tables
- Archive old scenarios

## Future Enhancements

1. **AI Integration**: OpenAI API for vendor insights
2. **File Uploads**: CSV/Excel bulk vendor import
3. **Notifications**: Email alerts for recommendations
4. **Real-time Updates**: WebSocket for live dashboard
5. **Advanced Analytics**: Trend analysis, forecasting
6. **Mobile App**: React Native client
7. **API Marketplace**: Third-party integrations
8. **Audit Logs**: Complete decision tracking

## Deployment Architecture

### Development
```
Local: Frontend (3000) ↔ Backend (8000) ↔ PostgreSQL + Redis
```

### Production
```
CDN → Vercel (Frontend)
        ↓
     API Gateway
        ↓
    Railway (Backend API)
        ↓
    Neon (PostgreSQL) + Redis
```

## Testing Strategy

### Backend
- Unit tests: Models, decision engine
- Integration tests: API endpoints
- E2E tests: Complete scenarios

### Frontend
- Component tests: React Testing Library
- E2E tests: Cypress/Playwright

---

This architecture ensures scalability, security, and maintainability while keeping the system focused on decision intelligence.
