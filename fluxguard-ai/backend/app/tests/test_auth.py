import pytest
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user as auth_get_current_user
from app.core.security import User as LegacyUser
from app.db.models import AuditLog, User
from app.db.session import get_db
from app.main import app

pytestmark = pytest.mark.asyncio


@pytest.fixture
def clean_auth_overrides():
    # Remove the conftest dependency bypass to test real security functions
    app.dependency_overrides.clear()
    yield
    # Restore mock user override after tests run
    app.dependency_overrides[auth_get_current_user] = lambda: LegacyUser(
        id="mock-op-uuid",
        email="operator@stadiumops.org",
        role="operator",
    )


@pytest.fixture
def test_db():
    db = next(get_db())
    # Delete test users and test audit logs if any exist
    db.query(AuditLog).filter(AuditLog.user.like("%test%")).delete()
    db.query(User).filter(User.email.like("%test%")).delete()
    db.commit()
    yield db
    db.query(AuditLog).filter(AuditLog.user.like("%test%")).delete()
    db.query(User).filter(User.email.like("%test%")).delete()
    db.commit()


async def test_password_policy_and_registration(
    test_db: Session, clean_auth_overrides, async_client
) -> None:
    # 1. Weak password registration (violates 12 chars minimum)
    payload_weak = {
        "name": "Test User",
        "email": "test-weak@ops.org",
        "password": "Password1!",
        "role": "VIEWER",
    }
    response = await async_client.post("/api/auth/register", json=payload_weak)
    assert response.status_code == 422  # Pydantic validation (min_length=12)

    # 2. Weak password registration (missing special char, long enough)
    payload_no_special = {
        "name": "Test User",
        "email": "test-weak@ops.org",
        "password": "Password12345",
        "role": "VIEWER",
    }
    response = await async_client.post("/api/auth/register", json=payload_no_special)
    assert response.status_code == 400
    assert "weak_password" in response.json()["detail"]["error"]["code"].lower()

    # 3. Successful registration
    payload_valid = {
        "name": "Test Validator",
        "email": "test-valid@ops.org",
        "password": "SuperSecurePassword123!",
        "role": "SECURITY_SUPERVISOR",
    }
    response = await async_client.post("/api/auth/register", json=payload_valid)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test-valid@ops.org"
    assert data["role"] == "SECURITY_SUPERVISOR"
    assert data["is_active"] is True

    # 4. Verify Audit Log entry created for registration
    log = test_db.query(AuditLog).filter(AuditLog.user == "test-valid@ops.org").first()
    assert log is not None
    assert log.action == "USER_REGISTER"


async def test_login_and_token_refresh(
    test_db: Session, clean_auth_overrides, async_client
) -> None:
    # Register user first
    payload = {
        "name": "Test Session User",
        "email": "test-session@ops.org",
        "password": "SecurePassword123!",
        "role": "STADIUM_MANAGER",
    }
    await async_client.post("/api/auth/register", json=payload)

    # 1. Invalid login
    login_invalid = {"email": "test-session@ops.org", "password": "WrongPassword!"}
    response = await async_client.post("/api/auth/login", json=login_invalid)
    assert response.status_code == 401
    assert "unauthorized" in response.json()["detail"]["error"]["code"].lower()

    # Verify failed login audit log
    logs = test_db.query(AuditLog).filter(AuditLog.user == "test-session@ops.org").all()
    failed_login_logs = [
        log_entry
        for log_entry in logs
        if log_entry.action == "USER_LOGIN" and log_entry.metadata_json.get("result") == "failed"
    ]
    assert len(failed_login_logs) > 0

    # 2. Successful login
    login_valid = {"email": "test-session@ops.org", "password": "SecurePassword123!"}
    response = await async_client.post("/api/auth/login", json=login_valid)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "STADIUM_MANAGER"

    access_token = data["access_token"]
    refresh_token = data["refresh_token"]

    # Verify successful login audit log
    logs = test_db.query(AuditLog).filter(AuditLog.user == "test-session@ops.org").all()
    success_login_logs = [
        log_entry
        for log_entry in logs
        if log_entry.action == "USER_LOGIN" and log_entry.metadata_json.get("result") == "success"
    ]
    assert len(success_login_logs) > 0

    # 3. Retrieve Profile (/me)
    response_me = await async_client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response_me.status_code == 200
    assert response_me.json()["email"] == "test-session@ops.org"

    # 4. Refresh token exchange
    response_refresh = await async_client.post(
        "/api/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response_refresh.status_code == 200
    assert "access_token" in response_refresh.json()


async def test_profile_and_password_changes(
    test_db: Session, clean_auth_overrides, async_client
) -> None:
    # Register and login
    payload = {
        "name": "Change User",
        "email": "test-change@ops.org",
        "password": "Password12345!",
        "role": "VIEWER",
    }
    await async_client.post("/api/auth/register", json=payload)
    login_resp = (
        await async_client.post(
            "/api/auth/login",
            json={"email": "test-change@ops.org", "password": "Password12345!"},
        )
    ).json()
    token = login_resp["access_token"]

    # 1. Update Profile
    update_payload = {"name": "New Name", "preferred_language": "fr"}
    response = await async_client.put(
        "/api/auth/profile",
        json=update_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"
    assert response.json()["preferred_language"] == "fr"

    # 2. Change Password
    change_pw_payload = {
        "current_password": "Password12345!",
        "new_password": "BrandNewPassword123!",
    }
    response_pw = await async_client.put(
        "/api/auth/change-password",
        json=change_pw_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response_pw.status_code == 200

    # 3. Verify old password no longer works
    login_old = await async_client.post(
        "/api/auth/login",
        json={"email": "test-change@ops.org", "password": "Password12345!"},
    )
    assert login_old.status_code == 401

    # 4. Verify new password works
    login_new = await async_client.post(
        "/api/auth/login",
        json={"email": "test-change@ops.org", "password": "BrandNewPassword123!"},
    )
    assert login_new.status_code == 200


async def test_admin_user_management(test_db: Session, clean_auth_overrides, async_client) -> None:
    # 1. Register admin and viewer
    await async_client.post(
        "/api/auth/register",
        json={
            "name": "Admin User",
            "email": "test-admin@ops.org",
            "password": "AdminPassword123!",
            "role": "SUPER_ADMIN",
        },
    )
    await async_client.post(
        "/api/auth/register",
        json={
            "name": "Viewer User",
            "email": "test-viewer@ops.org",
            "password": "ViewerPassword123!",
            "role": "VIEWER",
        },
    )

    # Log in both
    admin_token = (
        await async_client.post(
            "/api/auth/login",
            json={
                "email": "test-admin@ops.org",
                "password": "AdminPassword123!",
            },
        )
    ).json()["access_token"]

    viewer_resp = (
        await async_client.post(
            "/api/auth/login",
            json={
                "email": "test-viewer@ops.org",
                "password": "ViewerPassword123!",
            },
        )
    ).json()
    viewer_token = viewer_resp["access_token"]
    viewer_id = viewer_resp["user"]["id"]

    # 2. Viewer attempts to fetch user list -> 403 Forbidden
    response_viewer = await async_client.get(
        "/api/auth/users", headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert response_viewer.status_code == 403

    # 3. Admin fetches user list -> 200 OK
    response_admin = await async_client.get(
        "/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_admin.status_code == 200
    users = response_admin.json()
    assert len(users) >= 2
    assert any(u["email"] == "test-viewer@ops.org" for u in users)

    # 4. Admin deactivates viewer -> 200 OK
    deactivate_resp = await async_client.put(
        f"/api/auth/users/{viewer_id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert deactivate_resp.status_code == 200

    # 5. Viewer attempts to log in -> 403 Forbidden (account inactive)
    login_attempt = await async_client.post(
        "/api/auth/login",
        json={
            "email": "test-viewer@ops.org",
            "password": "ViewerPassword123!",
        },
    )
    assert login_attempt.status_code == 403
