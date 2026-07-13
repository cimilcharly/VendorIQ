import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Organization, User, Vendor, Scenario, Recommendation
from main import app

# Create isolated in-memory SQLite DB for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ensure schema is created in the test DB
Base.metadata.create_all(bind=engine)

from app.core.security import login_rate_limiter, register_rate_limiter

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def skip_rate_limiter():
    pass

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[login_rate_limiter] = skip_rate_limiter
app.dependency_overrides[register_rate_limiter] = skip_rate_limiter

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    client.cookies.clear()
    # Clean database before each test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_auth_flow():
    # 1. Register User A
    reg_response = client.post("/api/auth/register", json={
        "email": "userA@company.com",
        "username": "userA",
        "full_name": "User A",
        "password": "Password123"
    })
    assert reg_response.status_code == 200
    assert reg_response.json()["email"] == "userA@company.com"
    assert reg_response.json()["role"] == "admin" # first user is admin

    # 2. Duplicate registration check
    dup_response = client.post("/api/auth/register", json={
        "email": "userA@company.com",
        "username": "userA_dup",
        "full_name": "User A Dup",
        "password": "Password123"
    })
    assert dup_response.status_code == 400
    assert "registered" in dup_response.json()["detail"]["message"]

    # 3. Login with bad password
    bad_login = client.post("/api/auth/login", json={
        "email": "userA@company.com",
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401
    assert "credentials" in bad_login.json()["detail"]["message"]

    # 4. Login with correct password
    login_response = client.post("/api/auth/login", json={
        "email": "userA@company.com",
        "password": "Password123"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    
    # Check cookies are set
    access_cookie = login_response.cookies.get("access_token")
    refresh_cookie = login_response.cookies.get("refresh_token")
    assert access_cookie is not None
    assert refresh_cookie is not None

    # 5. Refresh token
    refresh_response = client.post("/api/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert refresh_response.status_code == 200
    assert "access_token" in refresh_response.json()

    # 6. Logout
    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 200
    # Cookies should be empty
    assert logout_response.cookies.get("access_token") in (None, "")


def test_password_reset_flow():
    # Register user
    client.post("/api/auth/register", json={
        "email": "reset@company.com",
        "username": "reset_user",
        "full_name": "Reset User",
        "password": "Password123"
    })

    # Forgot password
    forgot_res = client.post("/api/auth/forgot-password", json={"email": "reset@company.com"})
    assert forgot_res.status_code == 200
    token = forgot_res.json()["token"]
    assert token is not None

    # Reset password with valid token
    reset_res = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": "NewPassword789"
    })
    assert reset_res.status_code == 200

    # Try logging in with new password
    login_res = client.post("/api/auth/login", json={
        "email": "reset@company.com",
        "password": "NewPassword789"
    })
    assert login_res.status_code == 200

def test_vendors_crud_and_organization_isolation():
    # Register User A (Org A)
    client.cookies.clear()
    client.post("/api/auth/register", json={
        "email": "userA@company.com",
        "username": "userA",
        "full_name": "User A",
        "password": "Password123"
    })
    # Log in A
    loginA = client.post("/api/auth/login", json={"email": "userA@company.com", "password": "Password123"})
    tokenA = loginA.json()["access_token"]
    headersA = {"Authorization": f"Bearer {tokenA}"}

    # Register User B (Org B)
    client.cookies.clear()
    client.post("/api/auth/register", json={
        "email": "userB@company.com",
        "username": "userB",
        "full_name": "User B",
        "password": "Password123"
    })
    # Log in B
    loginB = client.post("/api/auth/login", json={"email": "userB@company.com", "password": "Password123"})
    tokenB = loginB.json()["access_token"]
    headersB = {"Authorization": f"Bearer {tokenB}"}

    # Create Vendor in Org A
    client.cookies.clear()
    vendor_res = client.post("/api/vendors/", json={
        "name": "Vendor A1",
        "category": "Logistics",
        "region": "West",
        "contact_email": "vA1@gmail.com",
        "contact_phone": "123456",
        "gst_number": "GST123"
    }, headers=headersA)
    assert vendor_res.status_code == 200
    vendor_id = vendor_res.json()["id"]

    # Verify Vendor is visible to A
    client.cookies.clear()
    list_A = client.get("/api/vendors/", headers=headersA)
    assert len(list_A.json()) == 1
    assert list_A.json()[0]["name"] == "Vendor A1"

    # Verify Vendor is NOT visible to B (Isolation)
    client.cookies.clear()
    list_B = client.get("/api/vendors/", headers=headersB)
    assert len(list_B.json()) == 0

    # Verify B cannot retrieve Vendor A1 by ID
    client.cookies.clear()
    get_v_B = client.get(f"/api/vendors/{vendor_id}", headers=headersB)
    assert get_v_B.status_code == 404


def test_subscription_limits_and_billing_upgrade():
    # Register User A (free tier by default)
    login_info = client.post("/api/auth/register", json={
        "email": "limit@company.com",
        "username": "limit",
        "full_name": "Limit",
        "password": "Password123"
    })
    login_res = client.post("/api/auth/login", json={"email": "limit@company.com", "password": "Password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Try creating 5 vendors (succeeds)
    for i in range(5):
        res = client.post("/api/vendors/", json={
            "name": f"Vendor {i}",
            "category": "Category",
            "region": "Region",
            "contact_email": f"v{i}@company.com",
            "contact_phone": "123456",
            "gst_number": "GST123"
        }, headers=headers)
        assert res.status_code == 200

    # Creating the 6th vendor should fail on free tier
    fail_res = client.post("/api/vendors/", json={
        "name": "Vendor 6",
        "category": "Category",
        "region": "Region",
        "contact_email": "v6@company.com",
        "contact_phone": "123456",
        "gst_number": "GST123"
    }, headers=headers)
    assert fail_res.status_code == 400
    assert "Free tier limit reached" in fail_res.json()["detail"]["message"]

    # Upgrade to premium via simulated billing
    upgrade_res = client.post("/api/billing/upgrade", headers=headers)
    assert upgrade_res.status_code == 200
    assert upgrade_res.json()["subscription_plan"] == "premium"

    # Now creating 6th vendor succeeds!
    success_res = client.post("/api/vendors/", json={
        "name": "Vendor 6",
        "category": "Category",
        "region": "Region",
        "contact_email": "v6@company.com",
        "contact_phone": "123456",
        "gst_number": "GST123"
    }, headers=headers)
    assert success_res.status_code == 200

def test_scenarios_limit_and_topsis_execution():
    login_info = client.post("/api/auth/register", json={
        "email": "scen@company.com",
        "username": "scen",
        "full_name": "Scen",
        "password": "Password123"
    })
    login_res = client.post("/api/auth/login", json={"email": "scen@company.com", "password": "Password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Add 2 vendors first (required for TOPSIS run)
    for i in range(2):
        client.post("/api/vendors/", json={
            "name": f"V{i}",
            "category": "C",
            "region": "R",
            "contact_email": f"v{i}@company.com",
            "contact_phone": "123",
            "gst_number": "GST",
            "metrics": {
                "cost": 50.0, "quality": 80.0, "delivery_time": 5.0,
                "reliability": 90.0, "compliance": 90.0, "rating": 4.5, "financial_stability": 80.0
            }
        }, headers=headers)

    # Try creating 3 scenarios (succeeds)
    weights = {
        "cost": 20.0, "quality": 20.0, "reliability": 15.0, "delivery_time": 15.0,
        "compliance": 10.0, "rating": 10.0, "financial_stability": 10.0
    }
    for i in range(3):
        res = client.post("/api/scenarios/", json={
            "name": f"Scenario {i}",
            "description": f"D{i}",
            "weights": weights
        }, headers=headers)
        assert res.status_code == 200
        scenario_id = res.json()["id"]

    # Creating 4th scenario fails
    fail_res = client.post("/api/scenarios/", json={
        "name": "Scenario 4",
        "weights": weights
    }, headers=headers)
    assert fail_res.status_code == 400
    assert "Free tier limit reached" in fail_res.json()["detail"]["message"]

    # Run scenario TOPSIS calculation
    run_res = client.post(f"/api/scenarios/{scenario_id}/run", headers=headers)
    assert run_res.status_code == 200
    assert "rankings" in run_res.json()
    assert len(run_res.json()["rankings"]) == 2

    # Verify recommendations are created & accessible
    rec_res = client.get(f"/api/recommendations/scenario/{scenario_id}", headers=headers)
    assert rec_res.status_code == 200
    assert len(rec_res.json()) == 2

    # Check stats endpoint
    stats_res = client.get("/api/reports/stats", headers=headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["scenarios"] == 3
    assert stats_res.json()["completed"] == 1
