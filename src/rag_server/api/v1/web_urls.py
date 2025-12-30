from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_db
from ...services.web_urls_service import WebURLCreate as ServiceWebURLCreate, WebURLRead as ServiceWebURLRead, create_web_url, list_web_urls, get_web_url
from .dtos import WebURLCreateDTO, WebURLResponseDTO, WebURLListResponseDTO, PaginationDTO

router = APIRouter()

@router.post("", response_model=WebURLResponseDTO, summary="Create WebURL", description="Create a new WebURL entry for crawling PDFs")
async def create_web_url_endpoint(payload: WebURLCreateDTO, db: AsyncSession = Depends(get_db)) -> WebURLResponseDTO:
    """Create a new WebURL for PDF crawling."""
    service_payload = ServiceWebURLCreate(
        url=payload.url,
        list_page=payload.list_page,
        list_pdf_url=payload.list_pdf_url
    )
    result = await create_web_url(service_payload, db)
    return WebURLResponseDTO(
        id=result.id,
        url=result.url,
        list_page=result.list_page,
        list_pdf_url=result.list_pdf_url,
        count_list_pdf_url=result.count_list_pdf_url
    )

@router.get("", response_model=List[WebURLResponseDTO], summary="List WebURLs", description="Get all WebURL entries")
async def list_web_urls_endpoint(db: AsyncSession = Depends(get_db)) -> List[WebURLResponseDTO]:
    """Get all WebURL entries."""
    results = await list_web_urls(db)
    return [
        WebURLResponseDTO(
            id=r.id,
            url=r.url,
            list_page=r.list_page,
            list_pdf_url=r.list_pdf_url,
            count_list_pdf_url=r.count_list_pdf_url
        ) for r in results
    ]

@router.get("/{web_url_id}", response_model=WebURLResponseDTO, summary="Get WebURL", description="Get a specific WebURL by ID")
async def get_web_url_endpoint(web_url_id: int, db: AsyncSession = Depends(get_db)) -> WebURLResponseDTO:
    """Get a WebURL by its ID."""
    result = await get_web_url(web_url_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="WebURL not found")
    return WebURLResponseDTO(
        id=result.id,
        url=result.url,
        list_page=result.list_page,
        list_pdf_url=result.list_pdf_url,
        count_list_pdf_url=result.count_list_pdf_url
    )
