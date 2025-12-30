APP_NAME = "rag-server"
APP_VERSION = "0.1.0"
API_PREFIX = "/api/v1"

# Database configuration
# SQLite database file placed under src/store/ as requested
DATABASE_URL = "sqlite+aiosqlite:///src/store/rag_server.db"

# JWT Authentication
JWT_SECRET_KEY = "your-super-secure-random-jwt-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 1440  # 24 hours
