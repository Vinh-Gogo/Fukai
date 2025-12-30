from typing import List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.models import WebURL, PDF
from .activities_service import log_activity

class PDFCreate:
    def __init__(self, pdf_url: str, web_url_id: Optional[int] = None):
        self.pdf_url = pdf_url
        self.web_url_id = web_url_id

class PDFRead:
    def __init__(self, id: int, pdf_url: str, web_url_id: Optional[int], time_crawl: datetime):
        self.id = id
        self.pdf_url = pdf_url
        self.web_url_id = web_url_id
        self.time_crawl = time_crawl

async def create_pdf(payload: PDFCreate, db: AsyncSession) -> PDFRead:
    p = PDF(pdf_url=payload.pdf_url, web_url_id=payload.web_url_id)
    db.add(p)
    await db.commit()
    await db.refresh(p)

    # If linked to a WebURL, update its list/count
    web_url_updated = False
    if payload.web_url_id:
        res = await db.execute(select(WebURL).where(WebURL.id == payload.web_url_id))
        web = res.scalars().first()
        if web:
            web.list_pdf_url = (web.list_pdf_url or []) + [payload.pdf_url]
            web.count_list_pdf_url = len(web.list_pdf_url)
            db.add(web)
            await db.commit()
            await db.refresh(web)
            web_url_updated = True

    # Log activity
    await log_activity(
        activity_type="pdf_created",
        entity_type="PDF",
        action="created",
        entity_id=p.id,
        details={
            "pdf_url": p.pdf_url,
            "web_url_id": p.web_url_id,
            "web_url_updated": web_url_updated
        }
    )

    return PDFRead(
        id=p.id,
        pdf_url=p.pdf_url,
        web_url_id=p.web_url_id,
        time_crawl=p.time_crawl
    )

async def list_pdfs(db: AsyncSession) -> List[PDFRead]:
    result = await db.execute(select(PDF))
    items = result.scalars().all()
    return [
        PDFRead(
            id=item.id,
            pdf_url=item.pdf_url,
            web_url_id=item.web_url_id,
            time_crawl=item.time_crawl
        ) for item in items
    ]

async def get_pdf(pdf_id: int, db: AsyncSession) -> Optional[PDFRead]:
    result = await db.execute(select(PDF).where(PDF.id == pdf_id))
    item = result.scalars().first()
    if not item:
        return None
    return PDFRead(
        id=item.id,
        pdf_url=item.pdf_url,
        web_url_id=item.web_url_id,
        time_crawl=item.time_crawl
    )
