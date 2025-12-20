"""
Response formatting utilities for the RAG platform
"""
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import json


class APIResponse:
    """Standardized API response format"""

    def __init__(self, success: bool = True, message: str = "",
                 data: Any = None, errors: Optional[List[str]] = None,
                 meta: Optional[Dict[str, Any]] = None):
        self.success = success
        self.message = message
        self.data = data
        self.errors = errors or []
        self.meta = meta or {}
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary"""
        response = {
            "success": self.success,
            "message": self.message,
            "timestamp": self.timestamp.isoformat()
        }

        if self.data is not None:
            response["data"] = self.data

        if self.errors:
            response["errors"] = self.errors

        if self.meta:
            response["meta"] = self.meta

        return response

    def to_json(self) -> str:
        """Convert response to JSON string"""
        return json.dumps(self.to_dict(), default=str, indent=2)


class ResponseUtils:
    """Response formatting utilities"""

    @staticmethod
    def success_response(data: Any = None, message: str = "Success",
                        meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create success response"""
        response = APIResponse(success=True, message=message, data=data, meta=meta)
        return response.to_dict()

    @staticmethod
    def error_response(message: str = "An error occurred",
                      errors: Optional[List[str]] = None,
                      meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create error response"""
        response = APIResponse(success=False, message=message, errors=errors, meta=meta)
        return response.to_dict()

    @staticmethod
    def paginated_response(items: List[Any], total: int, page: int,
                          per_page: int, message: str = "Data retrieved successfully") -> Dict[str, Any]:
        """Create paginated response"""
        from .pagination import PaginatedResponse
        paginated = PaginatedResponse(items, total, page, per_page)

        return APIResponse(
            success=True,
            message=message,
            data=paginated.to_dict()
        ).to_dict()

    @staticmethod
    def format_error_list(errors: Union[str, List[str], Dict[str, Any]]) -> List[str]:
        """Format various error formats into a list of strings"""
        if isinstance(errors, str):
            return [errors]
        elif isinstance(errors, list):
            return errors
        elif isinstance(errors, dict):
            return [f"{key}: {value}" for key, value in errors.items()]
        else:
            return [str(errors)]

    @staticmethod
    def add_pagination_headers(response: Dict[str, Any],
                             base_url: str, query_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Add pagination headers to response"""
        if "data" not in response or not isinstance(response["data"], dict):
            return response

        data = response["data"]
        if "total_pages" not in data or "page" not in data:
            return response

        from .pagination import PaginationUtils
        links = PaginationUtils.create_pagination_links(
            base_url=base_url,
            page=data["page"],
            total_pages=data["total_pages"],
            query_params=query_params
        )

        # Add links to meta
        if "meta" not in response:
            response["meta"] = {}

        response["meta"]["pagination_links"] = links
        return response


# Convenience functions
def success(data: Any = None, message: str = "Success") -> Dict[str, Any]:
    """Create success response"""
    return ResponseUtils.success_response(data, message)


def error(message: str = "An error occurred", errors: Optional[List[str]] = None) -> Dict[str, Any]:
    """Create error response"""
    return ResponseUtils.error_response(message, errors)


def paginated(items: List[Any], total: int, page: int, per_page: int) -> Dict[str, Any]:
    """Create paginated response"""
    return ResponseUtils.paginated_response(items, total, page, per_page)
