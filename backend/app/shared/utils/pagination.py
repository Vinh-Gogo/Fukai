"""
Pagination utilities for the RAG platform
"""
from typing import Dict, List, Any, Optional, Generic, TypeVar
from math import ceil

T = TypeVar('T')


class PaginationParams:
    """Parameters for pagination"""

    def __init__(self, page: int = 1, per_page: int = 20,
                 max_per_page: int = 100, min_per_page: int = 1):
        self.page = max(1, page)
        self.per_page = max(min_per_page, min(per_page, max_per_page))

    @property
    def offset(self) -> int:
        """Calculate offset for database queries"""
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        """Get limit for database queries"""
        return self.per_page


class PaginatedResponse(Generic[T]):
    """Paginated response wrapper"""

    def __init__(self, items: List[T], total: int,
                 page: int, per_page: int):
        self.items = items
        self.total = total
        self.page = page
        self.per_page = per_page

    @property
    def total_pages(self) -> int:
        """Calculate total number of pages"""
        return ceil(self.total / self.per_page) if self.per_page > 0 else 0

    @property
    def has_next(self) -> bool:
        """Check if there is a next page"""
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        """Check if there is a previous page"""
        return self.page > 1

    @property
    def next_page(self) -> Optional[int]:
        """Get next page number"""
        return self.page + 1 if self.has_next else None

    @property
    def prev_page(self) -> Optional[int]:
        """Get previous page number"""
        return self.page - 1 if self.has_prev else None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "items": self.items,
            "total": self.total,
            "page": self.page,
            "per_page": self.per_page,
            "total_pages": self.total_pages,
            "has_next": self.has_next,
            "has_prev": self.has_prev,
            "next_page": self.next_page,
            "prev_page": self.prev_page
        }


class PaginationUtils:
    """Pagination utility functions"""

    @staticmethod
    def paginate(items: List[T], page: int = 1, per_page: int = 20,
                max_per_page: int = 100) -> PaginatedResponse[T]:
        """Paginate a list of items"""
        params = PaginationParams(page, per_page, max_per_page)
        total = len(items)

        start_idx = params.offset
        end_idx = start_idx + params.per_page

        paginated_items = items[start_idx:end_idx]

        return PaginatedResponse(
            items=paginated_items,
            total=total,
            page=params.page,
            per_page=params.per_page
        )

    @staticmethod
    def create_pagination_links(base_url: str, page: int, total_pages: int,
                              query_params: Optional[Dict[str, Any]] = None) -> Dict[str, Optional[str]]:
        """Create pagination links for API responses"""
        links: Dict[str, Optional[str]] = {
            "first": None,
            "prev": None,
            "next": None,
            "last": None
        }

        params = query_params or {}
        params_str = "&".join(f"{k}={v}" for k, v in params.items() if v is not None)
        param_prefix = f"?{params_str}&" if params_str else "?"

        # First page
        links["first"] = f"{base_url}{param_prefix}page=1"

        # Last page
        if total_pages > 1:
            links["last"] = f"{base_url}{param_prefix}page={total_pages}"

        # Previous page
        if page > 1:
            links["prev"] = f"{base_url}{param_prefix}page={page - 1}"

        # Next page
        if page < total_pages:
            links["next"] = f"{base_url}{param_prefix}page={page + 1}"

        return links

    @staticmethod
    def validate_pagination_params(page: Any, per_page: Any,
                                 max_per_page: int = 100) -> PaginationParams:
        """Validate and sanitize pagination parameters"""
        try:
            page_num = int(page) if page is not None else 1
            per_page_num = int(per_page) if per_page is not None else 20
        except (ValueError, TypeError):
            page_num = 1
            per_page_num = 20

        return PaginationParams(
            page=page_num,
            per_page=per_page_num,
            max_per_page=max_per_page
        )


def paginate_queryset(queryset: Any, page: int = 1, per_page: int = 20) -> PaginatedResponse:
    """
    Paginate a SQLAlchemy or similar queryset

    Note: This is a generic implementation that assumes the queryset
    has count() and offset()/limit() methods like SQLAlchemy
    """
    params = PaginationParams(page, per_page)
    total = queryset.count()

    items = queryset.offset(params.offset).limit(params.limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        per_page=params.per_page
    )
