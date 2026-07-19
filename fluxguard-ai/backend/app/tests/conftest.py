import os

import pytest
from httpx import ASGITransport, AsyncClient

os.environ["JWT_SECRET"] = "test-secret-key-with-at-least-thirty-two-bytes"

from app.auth.dependencies import get_current_user
from app.core.security import User
from app.main import app


@pytest.fixture(autouse=True)
def bypass_auth_for_tests():
    """Automatically bypass JWT authentication for all tests, defaulting to operator permissions."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id="mock-op-uuid",
        email="operator@stadiumops.org",
        role="operator",
    )
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def async_client():
    """Async ASGI test client that avoids deprecated Starlette TestClient wrappers."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
