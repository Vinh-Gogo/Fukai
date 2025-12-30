from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.models import WebURL
from .activities_service import log_activity

class WebURLCreate:
    def __init__(self, url: str, list_page: Optional[List[str]] = None, list_pdf_url: Optional[List[str]] = None):
        self.url = url
        self.list_page = list_page or []
        self.list_pdf_url = list_pdf_url or []

class WebURLRead:
    def __init__(self, id: int, url: str, list_page: List[str], list_pdf_url: List[str], count_list_pdf_url: int):
        self.id = id
        self.url = url
        self.list_page = list_page
        self.list_pdf_url = list_pdf_url
        self.count_list_pdf_url = count_list_pdf_url

async def create_web_url(payload: WebURLCreate, db: AsyncSession) -> WebURLRead:
    w = WebURL(
        url=payload.url,
        list_page=payload.list_page,
        list_pdf_url=payload.list_pdf_url,
        count_list_pdf_url=len(payload.list_pdf_url),
    )
    db.add(w)
    await db.commit()
    await db.refresh(w)

    # Log activity
    await log_activity(
        activity_type="web_url_created",
        entity_type="WebURL",
        action="created",
        entity_id=w.id,
        details={
            "url": w.url,
            "pdf_count": len(w.list_pdf_url)
        }
    )

    return WebURLRead(
        id=w.id,
        url=w.url,
        list_page=w.list_page,
        list_pdf_url=w.list_pdf_url,
        count_list_pdf_url=w.count_list_pdf_url
    )

async def list_web_urls(db: AsyncSession) -> List[WebURLRead]:
    result = await db.execute(select(WebURL))
    items = result.scalars().all()
    return [
        WebURLRead(
            id=item.id,
            url=item.url,
            list_page=item.list_page,
            list_pdf_url=item.list_pdf_url,
            count_list_pdf_url=item.count_list_pdf_url
        ) for item in items
    ]

async def get_web_url(web_url_id: int, db: AsyncSession) -> Optional[WebURLRead]:
    result = await db.execute(select(WebURL).where(WebURL.id == web_url_id))
    item = result.scalars().first()
    if not item:
        return None
    return WebURLRead(
        id=item.id,
        url=item.url,
        list_page=item.list_page,
        list_pdf_url=item.list_pdf_url,
        count_list_pdf_url=item.count_list_pdf_url
    )
