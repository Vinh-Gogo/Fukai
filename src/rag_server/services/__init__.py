from typing import Dict
from ..constants import APP_NAME, APP_VERSION

def get_service_info() -> Dict[str, str]:
    return {"name": APP_NAME, "version": APP_VERSION}
