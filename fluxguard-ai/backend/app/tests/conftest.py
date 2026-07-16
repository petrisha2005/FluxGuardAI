import pytest

from app.core.security import User, get_current_user
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
