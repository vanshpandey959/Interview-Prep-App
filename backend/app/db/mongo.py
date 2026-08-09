from pymongo import MongoClient
from app.config import settings

_client = MongoClient(settings.MONGO_URI)
db = _client[settings.MONGO_DB_NAME]

# candidates: migrated once from candidates.json via scripts/seed_candidates.py
candidates_collection = db["candidates"]

# interview_reports: one permanent document per completed interview
reports_collection = db["interview_reports"]
