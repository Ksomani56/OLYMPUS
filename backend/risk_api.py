import sys
from pathlib import Path

_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

try:
    from risks_api import app
except ImportError:
    from backend.risks_api import app

__all__ = ["app"]
