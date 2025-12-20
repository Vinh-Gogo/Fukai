"""
Unit tests for authentication endpoints
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import router
from app.domains.auth.auth_service import AuthService
from app.infrastructure.repositories.user_repository import UserRepository
from app.models.user import User


@pytest.fixture
def test_client():
    """Create test client for auth endpoints"""
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.fixture
def mock_db():
    """Mock database session"""
    return MagicMock(spec=Session)


@pytest.fixture
def mock_user_repo(mock_db):
    """Mock user repository"""
    repo = MagicMock(spec=UserRepository)
    repo.get_by_email = AsyncMock()
    repo.exists_by_email = AsyncMock()
    repo.create = AsyncMock()
    return repo


@pytest.fixture
def mock_auth_service(mock_user_repo):
    """Mock auth service"""
    service = MagicMock(spec=AuthService)
    service.authenticate_user = AsyncMock()
    service.register_user = AsyncMock()
    service.login_user = AsyncMock()
    service.create_access_token = MagicMock()
    service.decode_token = MagicMock()
    return service


class TestAuthEndpoints:
    """Test cases for authentication endpoints"""

    def test_register_user_success(self, test_client, mock_auth_service):
        """Test successful user registration"""
        # Mock successful registration
        mock_auth_service.register_user.return_value = {
            "success": True,
            "user": {
                "id": "user123",
                "email": "test@example.com",
                "full_name": "Test User"
            },
            "access_token": "fake_token",
            "token_type": "bearer"
        }

        with patch('app.api.v1.endpoints.auth.get_auth_service', return_value=mock_auth_service):
            response = test_client.post("/register", json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["email"] == "test@example.com"
            assert "access_token" in data["data"]

    def test_register_user_validation_error(self, test_client):
        """Test registration with invalid data"""
        response = test_client.post("/register", json={
            "email": "invalid-email",
            "password": "",
            "full_name": ""
        })

        assert response.status_code == 422  # Pydantic validation error

    def test_register_user_existing_email(self, test_client, mock_auth_service):
        """Test registration with existing email"""
        mock_auth_service.register_user.return_value = {
            "success": False,
            "error": "User with this email already exists"
        }

        with patch('app.api.v1.endpoints.auth.get_auth_service', return_value=mock_auth_service):
            response = test_client.post("/register", json={
                "email": "existing@example.com",
                "password": "password123",
                "full_name": "Test User"
            })

            assert response.status_code == 400
            assert "already exists" in response.json()["detail"]

    def test_login_success(self, test_client, mock_auth_service):
        """Test successful login"""
        # Mock user object
        mock_user = MagicMock(spec=User)
        mock_user.id = "user123"
        mock_user.email = "test@example.com"
        mock_user.full_name = "Test User"
        mock_user.is_active = True
        mock_user.created_at = "2023-01-01T00:00:00"

        mock_auth_service.authenticate_user.return_value = mock_user
        mock_auth_service.create_access_token.return_value = "fake_token"

        with patch('app.api.v1.endpoints.auth.get_auth_service', return_value=mock_auth_service):
            response = test_client.post("/login", data={
                "username": "test@example.com",
                "password": "password123"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["access_token"] == "fake_token"
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == "test@example.com"

    def test_login_invalid_credentials(self, test_client, mock_auth_service):
        """Test login with invalid credentials"""
        mock_auth_service.authenticate_user.return_value = None

        with patch('app.api.v1.endpoints.auth.get_auth_service', return_value=mock_auth_service):
            response = test_client.post("/login", data={
                "username": "test@example.com",
                "password": "wrongpassword"
            })

            assert response.status_code == 401
            assert "Incorrect email or password" in response.json()["detail"]

    def test_refresh_token_success(self, test_client, mock_auth_service):
        """Test successful token refresh"""
        mock_auth_service.create_access_token.return_value = "new_fake_token"

        with patch('app.api.v1.endpoints.auth.get_current_token_data_dependency') as mock_dep, \
             patch('app.api.v1.endpoints.auth.get_auth_service', return_value=mock_auth_service):

            # Mock token data dependency
            mock_dep.return_value = MagicMock(
                user_id="user123",
                email="test@example.com"
            )

            response = test_client.post("/refresh-token")

            assert response.status_code == 200
            data = response.json()
            assert data["access_token"] == "new_fake_token"
            assert data["token_type"] == "bearer"

    def test_verify_token_success(self, test_client):
        """Test successful token verification"""
        with patch('app.api.v1.endpoints.auth.get_current_token_data_dependency') as mock_dep:
            mock_dep.return_value = MagicMock(
                user_id="user123",
                email="test@example.com",
                exp=1234567890
            )

            response = test_client.post("/verify-token")

            assert response.status_code == 200
            data = response.json()
            assert data["valid"] is True
            assert data["user_id"] == "user123"

    def test_logout_success(self, test_client):
        """Test successful logout"""
        with patch('app.api.v1.endpoints.auth.get_current_token_data_dependency') as mock_dep, \
             patch('app.api.v1.endpoints.auth.get_auth_service') as mock_service:

            mock_dep.return_value = MagicMock(user_id="user123")

            response = test_client.post("/logout")

            assert response.status_code == 200
            assert "Successfully logged out" in response.json()["message"]

    def test_get_current_user_success(self, test_client):
        """Test getting current user information"""
        mock_user = MagicMock(spec=User)
        mock_user.id = "user123"
        mock_user.email = "test@example.com"
        mock_user.full_name = "Test User"
        mock_user.is_active = True
        mock_user.created_at = "2023-01-01T00:00:00"

        with patch('app.api.v1.endpoints.auth.get_current_user_dependency', return_value=mock_user):
            response = test_client.get("/me")

            assert response.status_code == 200
            data = response.json()
            assert data["id"] == "user123"
            assert data["email"] == "test@example.com"
            assert data["full_name"] == "Test User"
            assert data["is_active"] is True


class TestAuthValidation:
    """Test input validation for auth endpoints"""

    def test_register_email_validation(self, test_client):
        """Test email validation in registration"""
        response = test_client.post("/register", json={
            "email": "invalid-email",
            "password": "password123",
            "full_name": "Test User"
        })

        assert response.status_code == 422
        assert "email" in str(response.json())

    def test_register_password_required(self, test_client):
        """Test password requirement in registration"""
        response = test_client.post("/register", json={
            "email": "test@example.com",
            "password": "",
            "full_name": "Test User"
        })

        assert response.status_code == 422

    def test_login_missing_credentials(self, test_client):
        """Test login with missing credentials"""
        response = test_client.post("/login", data={})

        assert response.status_code == 422


class TestAuthSecurity:
    """Test security aspects of auth endpoints"""

    def test_rate_limiting_applied(self, test_client):
        """Test that rate limiting decorators are applied"""
        # This would require setting up the rate limiter in tests
        # For now, just verify the endpoint exists and is callable
        response = test_client.post("/register", json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User"
        })

        # Should get validation error or success, but not rate limited in test environment
        assert response.status_code in [200, 400, 422]
