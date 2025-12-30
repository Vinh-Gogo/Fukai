# RAG Server Middleware

This document describes the middleware stack implemented in the RAG Server, which handles cross-cutting concerns for all API endpoints.

## Middleware Stack Order

The middlewares are applied in the following order (important for proper functionality):

1. **CORS Middleware** - Handles Cross-Origin Resource Sharing
2. **Trusted Host Middleware** - Validates request host headers
3. **Request Validation Middleware** - Validates request size and path safety
4. **Rate Limiting Middleware** - Prevents abuse with request rate limits
5. **Authentication Middleware** - Validates API keys
6. **Request Logging Middleware** - Logs requests and activities
7. **Error Handling Middleware** - Catches and formats errors

## Middleware Descriptions

### 1. CORS Middleware
- **Purpose**: Enables cross-origin requests from web browsers
- **Configuration**: `CORS_ALLOW_ORIGINS`, `CORS_ALLOW_METHODS`, etc.
- **Default**: Allows all origins (`*`) for development

### 2. Trusted Host Middleware
- **Purpose**: Prevents HTTP Host header attacks
- **Configuration**: `TRUSTED_HOSTS`
- **Default**: Allows all hosts (`*`) for development

### 3. Request Validation Middleware
- **Purpose**: Validates request payloads and prevents malicious requests
- **Features**:
  - Content length validation (prevents oversized payloads)
  - Path traversal protection
- **Configuration**: `MAX_CONTENT_LENGTH` (default: 10MB)

### 4. Rate Limiting Middleware
- **Purpose**: Prevents API abuse and ensures fair usage
- **Features**:
  - In-memory rate limiting per IP address
  - Sliding window of 1 minute
  - Configurable requests per minute
- **Configuration**:
  - `RATE_LIMIT_REQUESTS_PER_MINUTE` (default: 60)
  - `RATE_LIMIT_EXCLUDE_PATHS` (default: `["/health"]`)

### 5. Authentication Middleware
- **Purpose**: Secures API endpoints with API key authentication
- **Features**:
  - API key validation via `X-API-Key` header
  - Configurable excluded paths
  - User identification for activity logging
- **Configuration**:
  - `API_KEY` (optional - if not set, authentication is disabled)
  - `AUTH_EXCLUDE_PATHS` (default: health/docs endpoints)

### 6. Request Logging Middleware
- **Purpose**: Comprehensive request logging and activity tracking
- **Features**:
  - Structured logging with timing information
  - Automatic activity logging to database
  - Client IP detection (supports proxies)
  - Error categorization
- **Configuration**: `LOGGING_EXCLUDE_PATHS`

### 7. Error Handling Middleware
- **Purpose**: Consistent error response formatting
- **Features**:
  - Catches all unhandled exceptions
  - Formats FastAPI HTTPExceptions consistently
  - Provides structured error responses
  - Logs server errors for debugging

## Configuration

All middleware settings can be configured via environment variables. See `.env.example` for all available options.

### Environment Variables

```bash
# Authentication
API_KEY=your-secret-api-key
AUTH_EXCLUDE_PATHS=["/health", "/docs", "/redoc", "/openapi.json"]

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_EXCLUDE_PATHS=["/health"]

# Request Validation
MAX_CONTENT_LENGTH=10485760  # 10MB

# CORS
CORS_ALLOW_ORIGINS=["https://yourdomain.com"]
CORS_ALLOW_CREDENTIALS=true
```

## Activity Logging

The Request Logging Middleware automatically logs API activities to the database:

- **Activity Types**: `api_{module}_accessed` (e.g., `api_crawler_accessed`)
- **Details Logged**:
  - HTTP method and path
  - Query parameters
  - Response status code and timing
  - Client IP and User-Agent
  - Error categorization for failures

## Security Considerations

### Production Deployment

1. **Set restrictive CORS origins**:
   ```bash
   CORS_ALLOW_ORIGINS=["https://yourdomain.com"]
   ```

2. **Configure trusted hosts**:
   ```bash
   TRUSTED_HOSTS=["yourdomain.com", "api.yourdomain.com"]
   ```

3. **Enable API key authentication**:
   ```bash
   API_KEY=your-secure-api-key-here
   ```

4. **Adjust rate limits** based on your needs:
   ```bash
   RATE_LIMIT_REQUESTS_PER_MINUTE=100
   ```

5. **Set appropriate content limits**:
   ```bash
   MAX_CONTENT_LENGTH=5242880  # 5MB
   ```

### Monitoring

- Monitor the `/api/v1/activities` endpoints for API usage patterns
- Check logs for rate limit violations and authentication failures
- Use activity statistics to understand usage patterns

## Usage Examples

### Making Authenticated Requests

```bash
curl -H "X-API-Key: your-api-key" \
     https://api.yourdomain.com/api/v1/crawler/scan
```

### Checking Rate Limits

Rate limit headers are included in responses:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

### Monitoring Activities

```bash
# Get recent activities
GET /api/v1/activities/recent

# Get activity statistics
GET /api/v1/activities/stats?days=7
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `CORS_ALLOW_ORIGINS` configuration
2. **Authentication Failures**: Verify `X-API-Key` header and `API_KEY` setting
3. **Rate Limiting**: Check client IP and rate limit configuration
4. **Large Payload Errors**: Adjust `MAX_CONTENT_LENGTH` setting

### Debugging

- Check application logs for middleware errors
- Use `/api/v1/activities` to see request patterns
- Monitor database for activity logging issues
