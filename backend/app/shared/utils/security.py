"""
Security utilities for the RAG platform
"""
import hashlib
import hmac
import secrets
import string
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta
import base64
import os

try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    print("Warning: PyJWT not available, JWT functionality disabled")

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False
    print("Warning: cryptography not available, encryption functionality limited")

logger = logging.getLogger(__name__)


class HashUtils:
    """Hashing utilities"""

    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> Dict[str, str]:
        """Hash password with salt using PBKDF2"""
        if not salt:
            salt = secrets.token_hex(16)

        # Use PBKDF2 with SHA-256
        password_bytes = password.encode('utf-8')
        salt_bytes = salt.encode('utf-8')

        # Create hash
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            password_bytes,
            salt_bytes,
            100000  # Number of iterations
        )

        return {
            'hash': hash_obj.hex(),
            'salt': salt,
            'algorithm': 'pbkdf2_sha256'
        }

    @staticmethod
    def verify_password(password: str, hashed_password: str, salt: str) -> bool:
        """Verify password against hash"""
        password_bytes = password.encode('utf-8')
        salt_bytes = salt.encode('utf-8')

        # Create hash with same parameters
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            password_bytes,
            salt_bytes,
            100000
        )

        return hmac.compare_digest(hash_obj.hex(), hashed_password)

    @staticmethod
    def generate_hash(data: str, algorithm: str = 'sha256') -> str:
        """Generate hash of data"""
        data_bytes = data.encode('utf-8')

        if algorithm == 'md5':
            return hashlib.md5(data_bytes).hexdigest()
        elif algorithm == 'sha1':
            return hashlib.sha1(data_bytes).hexdigest()
        elif algorithm == 'sha256':
            return hashlib.sha256(data_bytes).hexdigest()
        elif algorithm == 'sha512':
            return hashlib.sha512(data_bytes).hexdigest()
        else:
            raise ValueError(f"Unsupported hash algorithm: {algorithm}")

    @staticmethod
    def generate_file_hash(file_path: str, algorithm: str = 'sha256') -> str:
        """Generate hash of file content"""
        hash_obj = hashlib.new(algorithm)

        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_obj.update(chunk)

        return hash_obj.hexdigest()

    @staticmethod
    def generate_hmac(message: str, key: str, algorithm: str = 'sha256') -> str:
        """Generate HMAC of message"""
        message_bytes = message.encode('utf-8')
        key_bytes = key.encode('utf-8')

        hmac_obj = hmac.new(key_bytes, message_bytes, getattr(hashlib, algorithm))
        return hmac_obj.hexdigest()


class TokenUtils:
    """Token generation and validation utilities"""

    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(length)

    @staticmethod
    def generate_api_key(prefix: str = "rag", length: int = 32) -> str:
        """Generate an API key with prefix"""
        token = secrets.token_urlsafe(length)
        return f"{prefix}_{token}"

    @staticmethod
    def generate_password(length: int = 12, include_special: bool = True) -> str:
        """Generate a random password"""
        characters = string.ascii_letters + string.digits
        if include_special:
            characters += "!@#$%^&*"

        return ''.join(secrets.choice(characters) for _ in range(length))

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a numeric OTP"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))


class EncryptionUtils:
    """Encryption utilities"""

    @staticmethod
    def generate_key(password: str, salt: Optional[bytes] = None) -> bytes:
        """Generate encryption key from password"""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise RuntimeError("cryptography library is required for encryption")

        if salt is None:
            salt = os.urandom(16)

        password_bytes = password.encode('utf-8')

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )

        return base64.urlsafe_b64encode(kdf.derive(password_bytes))

    @staticmethod
    def encrypt_data(data: str, key: bytes) -> str:
        """Encrypt string data"""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise RuntimeError("cryptography library is required for encryption")

        f = Fernet(key)
        encrypted = f.encrypt(data.encode('utf-8'))
        return encrypted.decode('utf-8')

    @staticmethod
    def decrypt_data(encrypted_data: str, key: bytes) -> str:
        """Decrypt string data"""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise RuntimeError("cryptography library is required for encryption")

        f = Fernet(key)
        decrypted = f.decrypt(encrypted_data.encode('utf-8'))
        return decrypted.decode('utf-8')


class JWTUtils:
    """JWT token utilities"""

    def __init__(self, secret_key: str, algorithm: str = 'HS256'):
        if not JWT_AVAILABLE:
            raise RuntimeError("PyJWT library is required for JWT functionality")

        self.secret_key = secret_key
        self.algorithm = algorithm

    def generate_token(self, payload: Dict[str, Any],
                      expires_delta: Optional[timedelta] = None) -> str:
        """Generate JWT token"""
        to_encode = payload.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
            to_encode.update({"exp": expire})
        elif 'exp' not in to_encode:
            # Default expiration of 24 hours
            expire = datetime.utcnow() + timedelta(hours=24)
            to_encode.update({"exp": expire})

        # Add issued at time
        to_encode.update({"iat": datetime.utcnow()})

        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {str(e)}")

    def refresh_token(self, token: str, expires_delta: Optional[timedelta] = None) -> str:
        """Refresh JWT token"""
        payload = self.decode_token(token)

        # Remove old timestamps
        payload.pop('iat', None)
        payload.pop('exp', None)

        return self.generate_token(payload, expires_delta)

    def get_token_expiration(self, token: str) -> Optional[datetime]:
        """Get token expiration time"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm],
                               options={"verify_exp": False})
            exp_timestamp = payload.get('exp')
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp)
        except jwt.InvalidTokenError:
            pass
        return None

    def is_token_expired(self, token: str) -> bool:
        """Check if token is expired"""
        try:
            jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return False
        except jwt.ExpiredSignatureError:
            return True
        except jwt.InvalidTokenError:
            return True


class SecurityUtils:
    """General security utilities"""

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal"""
        # Remove path separators
        filename = filename.replace('/', '').replace('\\', '')

        # Remove dangerous characters
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*']
        for char in dangerous_chars:
            filename = filename.replace(char, '')

        # Limit length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255-len(ext)] + ext

        return filename.strip()

    @staticmethod
    def validate_file_type(filename: str, allowed_extensions: list) -> bool:
        """Validate file extension"""
        if not allowed_extensions:
            return True

        _, ext = os.path.splitext(filename.lower())
        return ext in [e.lower() if e.startswith('.') else f'.{e.lower()}' for e in allowed_extensions]

    @staticmethod
    def generate_csrf_token() -> str:
        """Generate CSRF token"""
        return secrets.token_hex(32)

    @staticmethod
    def constant_time_compare(a: str, b: str) -> bool:
        """Constant time string comparison to prevent timing attacks"""
        return hmac.compare_digest(a.encode('utf-8'), b.encode('utf-8'))

    @staticmethod
    def rate_limit_key(identifier: str, action: str) -> str:
        """Generate rate limiting key"""
        return f"rate_limit:{action}:{identifier}"

    @staticmethod
    def validate_redirect_url(url: str, allowed_domains: list) -> bool:
        """Validate redirect URL for security"""
        from urllib.parse import urlparse

        try:
            parsed = urlparse(url)
            if not parsed.netloc:
                return False

            # Check if domain is in allowed list
            domain = parsed.netloc.lower()
            return any(domain.endswith(allowed.lower()) for allowed in allowed_domains)
        except Exception:
            return False


# Convenience functions
def hash_password(password: str) -> Dict[str, str]:
    """Convenience function for password hashing"""
    return HashUtils.hash_password(password)


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Convenience function for password verification"""
    return HashUtils.verify_password(password, hashed, salt)


def generate_token(length: int = 32) -> str:
    """Convenience function for token generation"""
    return TokenUtils.generate_secure_token(length)


def generate_api_key(prefix: str = "rag") -> str:
    """Convenience function for API key generation"""
    return TokenUtils.generate_api_key(prefix)


def create_jwt_utils(secret_key: str) -> JWTUtils:
    """Create JWT utilities instance"""
    return JWTUtils(secret_key)
