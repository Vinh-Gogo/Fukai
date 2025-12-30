"""
API-related enumerations for the RAG Server.

This module contains all enums related to API operations, HTTP status codes, and error handling.
"""

from enum import Enum

class HTTPStatus(int, Enum):
    """Enumeration of HTTP status codes."""
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    UNPROCESSABLE_ENTITY = 422
    TOO_MANY_REQUESTS = 429
    INTERNAL_SERVER_ERROR = 500
    NOT_IMPLEMENTED = 501
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503
    GATEWAY_TIMEOUT = 504

class ErrorCategory(str, Enum):
    """Enumeration of error categories."""
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    SERVER_ERROR = "server_error"
    NETWORK_ERROR = "network_error"
    RATE_LIMIT = "rate_limit"
    QUOTA_EXCEEDED = "quota_exceeded"

class APIEndpoint(str, Enum):
    """Enumeration of API endpoints."""
    HEALTH = "/health"
    DOCS = "/docs"
    AUTH_LOGIN = "/api/v1/auth/login"
    AUTH_VERIFY = "/api/v1/auth/verify"
    DOCUMENTS = "/api/v1/documents"
    SEARCH = "/api/v1/search"
    RAG_ASK = "/api/v1/rag/ask"
    RAG_CHAT = "/api/v1/rag/chat"
    CRAWLER_SCAN = "/api/v1/crawler/scan"
    CRAWLER_DOWNLOAD = "/api/v1/crawler/download"
    CRAWLER_STATUS = "/api/v1/crawler/status"

class RequestMethod(str, Enum):
    """Enumeration of HTTP request methods."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    OPTIONS = "OPTIONS"
    HEAD = "HEAD"

class ContentType(str, Enum):
    """Enumeration of content types."""
    JSON = "application/json"
    FORM_DATA = "multipart/form-data"
    TEXT = "text/plain"
    HTML = "text/html"
    PDF = "application/pdf"
    XML = "application/xml"
    CSV = "text/csv"
