"""
Data validation utilities for the RAG platform
"""
import re
import uuid
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime, date
from email_validator import validate_email, EmailNotValidError
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom exception for validation errors"""

    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"{field}: {message}")


class Validator:
    """Base validator class with common validation methods"""

    @staticmethod
    def is_not_empty(value: Any, field_name: str = "value") -> str:
        """Validate that a value is not empty"""
        if value is None:
            raise ValidationError(field_name, "cannot be None")
        if isinstance(value, str) and not value.strip():
            raise ValidationError(field_name, "cannot be empty string")
        if isinstance(value, (list, dict)) and len(value) == 0:
            raise ValidationError(field_name, "cannot be empty")
        return str(value).strip() if isinstance(value, str) else value

    @staticmethod
    def is_email(value: str, field_name: str = "email") -> str:
        """Validate email format"""
        try:
            valid = validate_email(value)
            return valid.email
        except EmailNotValidError as e:
            raise ValidationError(field_name, str(e))

    @staticmethod
    def is_url(value: str, field_name: str = "url", schemes: Optional[List[str]] = None) -> str:
        """Validate URL format"""
        try:
            parsed = urlparse(value)
            if not parsed.scheme or not parsed.netloc:
                raise ValidationError(field_name, "invalid URL format")

            allowed_schemes = schemes or ['http', 'https', 'ftp', 'ftps']
            if parsed.scheme not in allowed_schemes:
                raise ValidationError(field_name, f"URL scheme must be one of: {', '.join(allowed_schemes)}")

            return value
        except Exception as e:
            raise ValidationError(field_name, f"invalid URL: {str(e)}")

    @staticmethod
    def is_uuid(value: str, field_name: str = "uuid") -> str:
        """Validate UUID format"""
        try:
            uuid.UUID(value)
            return value
        except (ValueError, TypeError):
            raise ValidationError(field_name, "invalid UUID format")

    @staticmethod
    def length_between(value: str, min_len: int, max_len: int, field_name: str = "value") -> str:
        """Validate string length is between min and max"""
        if not isinstance(value, str):
            value = str(value)

        if len(value) < min_len:
            raise ValidationError(field_name, f"must be at least {min_len} characters")
        if len(value) > max_len:
            raise ValidationError(field_name, f"must be at most {max_len} characters")

        return value

    @staticmethod
    def matches_regex(value: str, pattern: str, field_name: str = "value") -> str:
        """Validate that string matches regex pattern"""
        if not re.match(pattern, value):
            raise ValidationError(field_name, f"does not match required pattern")
        return value

    @staticmethod
    def is_in_range(value: Union[int, float], min_val: Union[int, float],
                   max_val: Union[int, float], field_name: str = "value") -> Union[int, float]:
        """Validate numeric value is in range"""
        if value < min_val or value > max_val:
            raise ValidationError(field_name, f"must be between {min_val} and {max_val}")
        return value

    @staticmethod
    def is_positive(value: Union[int, float], field_name: str = "value") -> Union[int, float]:
        """Validate numeric value is positive"""
        if value <= 0:
            raise ValidationError(field_name, "must be positive")
        return value

    @staticmethod
    def is_date_string(value: str, field_name: str = "date",
                      date_format: str = "%Y-%m-%d") -> str:
        """Validate date string format"""
        try:
            datetime.strptime(value, date_format)
            return value
        except ValueError:
            raise ValidationError(field_name, f"invalid date format, expected {date_format}")

    @staticmethod
    def is_future_date(value: Union[str, datetime, date], field_name: str = "date") -> Union[str, datetime, date]:
        """Validate that date is in the future"""
        if isinstance(value, str):
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        elif isinstance(value, date) and not isinstance(value, datetime):
            value = datetime.combine(value, datetime.min.time())

        if value <= datetime.utcnow():
            raise ValidationError(field_name, "must be a future date")

        return value

    @staticmethod
    def is_valid_filename(value: str, field_name: str = "filename") -> str:
        """Validate filename (no path traversal, valid characters)"""
        if not value or not value.strip():
            raise ValidationError(field_name, "cannot be empty")

        # Check for path traversal
        if ".." in value or "/" in value or "\\" in value:
            raise ValidationError(field_name, "contains invalid path characters")

        # Check for invalid characters
        invalid_chars = '<>:"|?*'
        if any(char in value for char in invalid_chars):
            raise ValidationError(field_name, f"contains invalid characters: {invalid_chars}")

        return value.strip()

    @staticmethod
    def is_valid_json(value: str, field_name: str = "json") -> str:
        """Validate JSON string"""
        import json
        try:
            json.loads(value)
            return value
        except (json.JSONDecodeError, TypeError):
            raise ValidationError(field_name, "invalid JSON format")


class DataValidator:
    """Advanced data validation with field-level validation rules"""

    def __init__(self):
        self.errors: List[Dict[str, Any]] = []

    def validate_field(self, value: Any, field_name: str, rules: List[Callable]) -> bool:
        """Validate a single field against multiple rules"""
        try:
            for rule in rules:
                value = rule(value, field_name)
            return True
        except ValidationError as e:
            self.errors.append({
                "field": e.field,
                "message": e.message,
                "value": e.value
            })
            return False

    def validate_data(self, data: Dict[str, Any], schema: Dict[str, List[Callable]]) -> bool:
        """Validate data dictionary against schema"""
        self.errors = []

        for field_name, rules in schema.items():
            value = data.get(field_name)
            self.validate_field(value, field_name, rules)

        return len(self.errors) == 0

    def get_errors(self) -> List[Dict[str, Any]]:
        """Get validation errors"""
        return self.errors.copy()

    def clear_errors(self):
        """Clear validation errors"""
        self.errors = []


# Common validation schemas
USER_SCHEMA = {
    "email": [Validator.is_not_empty, Validator.is_email],
    "username": [
        Validator.is_not_empty,
        lambda v, f: Validator.length_between(v, 3, 50, f),
        lambda v, f: Validator.matches_regex(v, r'^[a-zA-Z0-9_-]+$', f)
    ],
    "password": [
        Validator.is_not_empty,
        lambda v, f: Validator.length_between(v, 8, 128, f)
    ]
}

DOCUMENT_SCHEMA = {
    "filename": [Validator.is_not_empty, Validator.is_valid_filename],
    "user_id": [Validator.is_not_empty, Validator.is_uuid],
    "file_size": [Validator.is_positive]
}

SEARCH_QUERY_SCHEMA = {
    "query": [
        Validator.is_not_empty,
        lambda v, f: Validator.length_between(v, 1, 1000, f)
    ],
    "limit": [
        lambda v, f: Validator.is_in_range(int(v) if v is not None else 10, 1, 100, f)
    ]
}


def validate_user_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate user registration/login data"""
    validator = DataValidator()
    if not validator.validate_data(data, USER_SCHEMA):
        errors = validator.get_errors()
        raise ValidationError("user_data", f"Validation failed: {errors}")
    return data


def validate_document_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate document upload data"""
    validator = DataValidator()
    if not validator.validate_data(data, DOCUMENT_SCHEMA):
        errors = validator.get_errors()
        raise ValidationError("document_data", f"Validation failed: {errors}")
    return data


def validate_search_query(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate search query data"""
    validator = DataValidator()
    if not validator.validate_data(data, SEARCH_QUERY_SCHEMA):
        errors = validator.get_errors()
        raise ValidationError("search_query", f"Validation failed: {errors}")
    return data


def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize user input by removing dangerous characters"""
    if not text:
        return ""

    # Remove null bytes and other dangerous characters
    sanitized = text.replace('\x00', '').replace('\r\n', '\n').replace('\r', '\n')

    # Limit length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized.strip()


def validate_file_size(size: int, max_size: int = 10 * 1024 * 1024) -> int:  # 10MB default
    """Validate file size"""
    if size < 0:
        raise ValidationError("file_size", "cannot be negative")
    if size > max_size:
        raise ValidationError("file_size", f"exceeds maximum size of {max_size} bytes")
    return size


def validate_mime_type(mime_type: str, allowed_types: List[str]) -> str:
    """Validate MIME type against allowed types"""
    if mime_type not in allowed_types:
        raise ValidationError("mime_type", f"not allowed. Allowed types: {', '.join(allowed_types)}")
    return mime_type
