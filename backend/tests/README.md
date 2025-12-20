# RAG Backend Testing Suite

Comprehensive testing suite for the RAG (Retrieval-Augmented Generation) backend data collection pipeline.

## Test Structure

```
tests/
├── __init__.py                 # Test package
├── conftest.py                 # Shared fixtures and configuration
├── test_crawler.py             # BiwaseCrawler unit tests
├── test_pdf_processor.py       # PDFProcessor unit tests
├── test_embedding_service.py   # EmbeddingService unit tests
├── test_qdrant_service.py      # QDrantService unit tests
├── test_data_collection_pipeline.py  # Integration tests
└── README.md                   # This file
```

## Test Categories

### Unit Tests (`pytest -m unit`)
- Test individual service methods in isolation
- Mock all external dependencies
- Fast execution, high coverage

### Integration Tests (`pytest -m integration`)
- Test service interactions
- End-to-end pipeline testing
- Slower execution, comprehensive validation

### Component Tests
- **Crawler Tests** (`pytest -m crawler`): Web scraping functionality
- **PDF Tests** (`pytest -m pdf`): Document processing
- **Embedding Tests** (`pytest -m embedding`): Vector generation
- **QDrant Tests** (`pytest -m qdrant`): Vector database operations
- **API Tests** (`pytest -m api`): REST endpoint validation

### Performance Tests (`pytest -m slow`)
- Load testing and benchmarking
- Concurrent processing validation
- Resource usage monitoring

## Running Tests

### Using the Test Runner (Recommended)

```bash
cd backend

# Run all tests
python run_tests.py all

# Run specific test types
python run_tests.py unit           # Unit tests only
python run_tests.py integration    # Integration tests only
python run_tests.py crawler        # Crawler tests only
python run_tests.py pdf           # PDF processor tests
python run_tests.py embedding     # Embedding service tests
python run_tests.py qdrant        # QDrant service tests

# Performance testing
python run_tests.py performance

# Coverage report
python run_tests.py coverage

# Options
python run_tests.py unit --verbose          # Verbose output
python run_tests.py unit --fail-fast        # Stop on first failure
python run_tests.py unit --no-cov           # Skip coverage
```

### Using Pytest Directly

```bash
cd backend

# Install test dependencies
pip install -r requirements-test.txt

# Run tests
pytest                          # All tests
pytest -m unit                  # Unit tests
pytest -m integration           # Integration tests
pytest -m "crawler or pdf"      # Multiple markers
pytest tests/test_crawler.py    # Specific file
pytest -k "test_crawl"          # Tests matching pattern

# Coverage
pytest --cov=app --cov-report=html
```

## Test Configuration

### Pytest Configuration (`pyproject.toml`)

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
addopts = [
    "--verbose",
    "--tb=short",
    "--strict-markers",
    "--cov=app",
    "--cov-report=html",
    "--cov-report=term-missing"
]
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
    "slow: Slow running tests",
    "crawler: Crawler related tests",
    "pdf: PDF processing tests",
    "embedding: Embedding service tests",
    "qdrant: QDrant service tests",
    "api: API endpoint tests"
]
```

### Test Markers

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.slow` - Performance/heavy tests
- `@pytest.mark.asyncio` - Async tests
- Component-specific markers for targeted testing

## Test Fixtures

### Shared Fixtures (`conftest.py`)

- `event_loop` - Async event loop for tests
- `temp_dir` - Temporary directory for file operations
- `mock_settings` - Mocked application settings
- `sample_pdf_content` - Sample PDF data for testing
- `sample_markdown_content` - Sample markdown content
- `mock_embedding_response` - Mock embedding API responses
- `mock_qdrant_collection_info` - Mock QDrant collection data
- `mock_crawl_result` - Mock crawler results

### Service Fixtures

Each test file provides fixtures for its specific service:
- `crawler` - BiwaseCrawler instance
- `processor` - PDFProcessor instance
- `embedding_service` - EmbeddingService instance
- `qdrant_service` - QDrantService instance
- `pipeline_services` - All services for integration testing

## Data Collection Pipeline Testing

The integration tests (`test_data_collection_pipeline.py`) validate the complete data collection workflow:

1. **Web Crawling** - PDF discovery and download
2. **PDF Processing** - Text extraction using marker-pdf
3. **Text Embedding** - Vector generation via OpenAI API
4. **Vector Storage** - QDrant database operations
5. **Search & Retrieval** - Similarity search validation

### Pipeline Test Scenarios

- **Complete Pipeline**: End-to-end document processing
- **Error Handling**: Failure recovery and error propagation
- **Concurrent Processing**: Multi-document parallel processing
- **Text Chunking**: Large document segmentation
- **Cleanup Operations**: Resource management and maintenance

## Test Data

### Sample Files
- `sample_pdf_content` - Minimal PDF for testing
- Generated test files in temporary directories
- Mock API responses for external services

### Mock Services
- OpenAI Embeddings API
- QDrant Cloud Database
- HTTP requests for web crawling
- File system operations

## Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95%+ for core business logic
- **Service Methods**: All public methods tested
- **Error Paths**: Exception handling validation

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests
  run: |
    cd backend
    pip install -r requirements-test.txt
    python run_tests.py coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./backend/htmlcov/coverage.xml
```

### Docker Testing

```bash
# Run tests in Docker
docker-compose -f docker/docker-compose.test.yml up --build

# Or run specific test containers
docker build -f docker/backend/Dockerfile.test -t rag-backend-test .
docker run --rm rag-backend-test
```

## Debugging Tests

### Common Issues

1. **Import Errors**: Ensure test dependencies are installed
2. **Async Test Issues**: Use `@pytest.mark.asyncio` decorator
3. **Mock Setup**: Verify mock return values and side effects
4. **Fixture Scope**: Check fixture scopes (function, class, session)

### Debug Commands

```bash
# Verbose output
pytest -v -s

# Debug specific test
pytest tests/test_crawler.py::TestBiwaseCrawler::test_crawler_initialization -xvs

# PDB debugging
pytest --pdb

# Show fixtures
pytest --fixtures
```

## Performance Testing

### Benchmarking

```bash
# Run performance tests
python run_tests.py performance

# Profile specific test
pytest --durations=10 tests/test_pdf_processor.py
```

### Load Testing Considerations

- Concurrent PDF processing limits
- Embedding API rate limits
- QDrant database throughput
- Memory usage patterns
- File I/O performance

## Contributing

### Adding New Tests

1. Create test file: `test_<component>.py`
2. Use appropriate markers: `@pytest.mark.unit`, `@pytest.mark.integration`
3. Add fixtures in `conftest.py` if shared
4. Update this README with new test categories
5. Ensure coverage requirements are met

### Test Organization

- Group related tests in classes
- Use descriptive test method names
- Include docstrings explaining test purpose
- Mock external dependencies appropriately
- Test both success and failure paths

## Test Results Interpretation

### Coverage Report

```
Name                 Stmts    Miss    Cover    Missing
------------------------------------------------------
app/services/           500      25     95%    125-130
app/api/               200      10     95%    45-50
app/core/              100       5     95%    20
------------------------------------------------------
TOTAL                  800      40     95%
```

### Test Output

```
tests/test_crawler.py .......                          [ 12%]
tests/test_pdf_processor.py ..........                [ 25%]
tests/test_embedding_service.py ......               [ 37%]
tests/test_qdrant_service.py ........                [ 50%]
tests/test_data_collection_pipeline.py .....         [ 62%]
======================== 30 passed in 45.67s =========
```

## Troubleshooting

### Environment Setup

```bash
# Ensure Python path
export PYTHONPATH=/path/to/backend:$PYTHONPATH

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-test.txt
```

### Common Errors

- **Module not found**: Check Python path and imports
- **Fixture errors**: Verify fixture dependencies
- **Async issues**: Ensure event loop is available
- **Mock failures**: Check mock setup and assertions

### Getting Help

1. Check existing tests for patterns
2. Review pytest documentation
3. Check fixture definitions in `conftest.py`
4. Run with verbose output for debugging
