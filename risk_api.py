# Root re-export so running `uvicorn risk_api:app` works directly from the project root
from backend.risk_api import app

__all__ = ["app"]
