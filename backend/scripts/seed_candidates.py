"""
One-off migration: loads data/candidates.json into the MongoDB `candidates`
collection. Run once after setting up Mongo (safe to re-run — it upserts):

    cd backend
    python -m scripts.seed_candidates
"""
import json
from app.config import settings
from app.services.mongo_service import mongo_service


def seed() -> None:
    if not settings.CANDIDATES_PATH.exists():
        print(f"No candidates.json found at {settings.CANDIDATES_PATH}")
        return

    with open(settings.CANDIDATES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    candidates = data.get("candidates", [])
    for cand in candidates:
        mongo_service.upsert_candidate(cand)

    print(f"Seeded {len(candidates)} candidates into MongoDB ({settings.MONGO_DB_NAME}.candidates).")


if __name__ == "__main__":
    seed()
