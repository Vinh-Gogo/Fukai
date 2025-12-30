# RAG Server API DTOs (Data Transfer Objects)

This document describes the Data Transfer Objects (DTOs) implemented in the RAG Server API, which provide robust data validation, type safety, and API contract definition.

## Overview

DTOs are used throughout the API to:

- **Validate incoming data**: Ensure requests contain valid, properly formatted data
- **Control data exposure**: Prevent sensitive fields from being exposed to clients
- **Provide type safety**: Strong typing with Pydantic models
- **Document APIs**: Clear field descriptions and examples
- **Decouple contracts**: Separate API contracts from internal data models

## DTO Categories

### 1. Request DTOs
Used for validating incoming request data:

```python
class WebURLCreateDTO(BaseDTO):
    url: str = Field(..., description="URL to crawl")
    list_page: Optional[List[str]] = Field(default_factory=list)
```

### 2. Response DTOs
Define the structure of API responses:

```python
class WebURLResponseDTO(BaseDTO):
    id: int
    url: str
    list_page: List[str]
    count_list_pdf_url: int
```

### 3. Pagination DTOs
Handle paginated responses:

```python
class PaginatedResponseDTO(BaseDTO):
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
```

### 4. Error DTOs
Standardize error responses:

```python
class ErrorResponseDTO(BaseDTO):
    error: str
    message: str
    status_code: int
    timestamp: datetime
```

## Key Features

### Validation
- **URL validation**: Ensures proper URL format with regex
- **Length constraints**: Min/max lengths for strings
- **Type validation**: Automatic type coercion and validation
- **Custom validators**: Business logic validation (e.g., PDF extension check)

### Security
- **Field control**: Only expose necessary fields to clients
- **Input sanitization**: Prevent malicious input through validation
- **Path traversal protection**: Block `..` in file paths

### Documentation
- **Field descriptions**: Clear explanations of each field
- **Examples**: Sample values for better API documentation
- **Summaries**: Endpoint summaries and descriptions

## Usage Examples

### Creating Resources
```python
# POST /api/v1/web_urls
{
  "url": "https://biwase.com.vn/tin-tuc/ban-tin-biwase",
  "list_page": ["https://biwase.com.vn/page/1"],
  "list_pdf_url": ["https://biwase.com.vn/pdf/doc.pdf"]
}
```

### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "status_code": 422,
  "errors": [
    {
      "field": "url",
      "message": "Invalid URL format",
      "value": "not-a-url"
    }
  ]
}
```

### Paginated Responses
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8,
  "has_next": true,
  "has_prev": false
}
```

## Benefits Achieved

### ✅ Data Integrity Protection
- Validates all incoming data before processing
- Prevents malformed data from reaching business logic
- Ensures database consistency

### ✅ API Contract Decoupling
- Internal models can change without affecting API contracts
- DTOs provide stable API interface
- Easy versioning through DTO updates

### ✅ Security Enhancement
- Blocks access to sensitive internal fields
- Prevents injection attacks through validation
- Path traversal protection

### ✅ Developer Experience
- Type hints and autocompletion in IDEs
- Clear API documentation with examples
- Runtime validation with helpful error messages

### ✅ Type Safety
- Compile-time type checking with mypy
- Runtime type validation with Pydantic
- Reduced runtime errors

## Implementation Details

### Base Classes
All DTOs inherit from `BaseDTO` which provides:
- SQLAlchemy model conversion (`from_attributes = True`)
- JSON serialization for datetime objects
- Assignment validation

### Enums
Strongly typed enumerations for controlled vocabularies:
- `ActivityType`: web_url_created, pdf_created, etc.
- `ActivityAction`: created, updated, deleted, etc.
- `EntityType`: WebURL, PDF, API, etc.

### Custom Validators
- URL format validation with regex
- File extension checking
- Path safety validation
- Business rule enforcement

## Migration from Basic Models

The API has been updated from basic Pydantic models to comprehensive DTOs:

### Before
```python
class WebURLCreate(BaseModel):
    url: str
    list_page: Optional[List[str]] = None
```

### After
```python
class WebURLCreateDTO(BaseDTO):
    url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="The URL to crawl for PDFs",
        example="https://biwase.com.vn/tin-tuc/ban-tin-biwase"
    )
    # ... with validation, examples, and documentation
```

## Testing DTOs

DTOs can be tested independently:

```python
# Valid DTO
dto = WebURLCreateDTO(
    url="https://example.com",
    list_pdf_url=["https://example.com/test.pdf"]
)
assert dto.url == "https://example.com"

# Invalid DTO raises ValidationError
try:
    invalid_dto = WebURLCreateDTO(url="not-a-url")
except ValidationError as e:
    print(f"Validation error: {e}")
```

## Future Enhancements

- **Versioning**: API versioning through DTO versioning
- **Transformation**: Automatic DTO-to-model mapping
- **OpenAPI**: Enhanced OpenAPI schema generation
- **Serialization**: Custom JSON encoders for complex types
