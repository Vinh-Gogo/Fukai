from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_db
from ...services.pdfs_service import PDFCreate as ServicePDFCreate, PDFRead as ServicePDFRead, create_pdf, list_pdfs, get_pdf
from .dtos import PDFCreateDTO, PDFResponseDTO

router = APIRouter()

@router.post("", response_model=PDFResponseDTO, summary="Create PDF", description="Create a new PDF entry")
async def create_pdf_endpoint(payload: PDFCreateDTO, db: AsyncSession = Depends(get_db)) -> PDFResponseDTO:
    """Create a new PDF entry."""
    service_payload = ServicePDFCreate(pdf_url=payload.pdf_url, web_url_id=payload.web_url_id)
    result = await create_pdf(service_payload, db)
    return PDFResponseDTO(
        id=result.id,
        pdf_url=result.pdf_url,
        web_url_id=result.web_url_id,
        time_crawl=result.time_crawl
    )

@router.get("", response_model=List[PDFResponseDTO], summary="List PDFs", description="Get all PDF entries")
async def list_pdfs_endpoint(db: AsyncSession = Depends(get_db)) -> List[PDFResponseDTO]:
    """Get all PDF entries."""
    results = await list_pdfs(db)
    return [
        PDFResponseDTO(
            id=r.id,
            pdf_url=r.pdf_url,
            web_url_id=r.web_url_id,
            time_crawl=r.time_crawl
        ) for r in results
    ]

@router.get("/{pdf_id}", response_model=PDFResponseDTO, summary="Get PDF", description="Get a specific PDF by ID")
async def get_pdf_endpoint(pdf_id: int, db: AsyncSession = Depends(get_db)) -> PDFResponseDTO:
    """Get a PDF by its ID."""
    result = await get_pdf(pdf_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="PDF not found")
    return PDFResponseDTO(
        id=result.id,
        pdf_url=result.pdf_url,
        web_url_id=result.web_url_id,
        time_crawl=result.time_crawl
    )
