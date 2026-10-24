import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root or backend directory if present
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b").strip()
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "900"))  # 15 minutes default
DEFAULT_PERIOD_DAYS = int(os.getenv("DEFAULT_PERIOD_DAYS", "90"))
