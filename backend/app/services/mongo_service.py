from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.db.mongo import candidates_collection, reports_collection


class MongoService:
    """Permanent storage: candidate profiles and completed interview reports."""

    # --- Candidates ---

    def get_candidate_by_id(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        return candidates_collection.find_one({"member.id": candidate_id}, {"_id": 0})

    def list_candidates(self) -> List[Dict[str, Any]]:
        return list(candidates_collection.find({}, {"_id": 0}))

    def upsert_candidate(self, candidate: Dict[str, Any]) -> None:
        """Used by scripts/seed_candidates.py to migrate candidates.json into Mongo."""
        candidate_id = candidate.get("member", {}).get("id")
        if not candidate_id:
            return
        candidates_collection.update_one(
            {"member.id": candidate_id}, {"$set": candidate}, upsert=True
        )

    # --- Interview Reports (permanent) ---

    def save_interview_report(self, report: Dict[str, Any]) -> None:
        report["completedAt"] = datetime.now(timezone.utc).isoformat()
        reports_collection.insert_one(report)

    def get_reports_for_candidate(self, candidate_id: str) -> List[Dict[str, Any]]:
        cursor = reports_collection.find(
            {"candidateId": candidate_id}, {"_id": 0}
        ).sort("completedAt", -1)
        return list(cursor)

    def get_all_reports(self) -> List[Dict[str, Any]]:
        cursor = reports_collection.find({}, {"_id": 0}).sort("completedAt", -1)
        return list(cursor)

    # --- Admin aggregates ---

    def get_admin_overview(self) -> Dict[str, Any]:
        total_candidates = candidates_collection.count_documents({})
        interviewed_ids = reports_collection.distinct("candidateId")
        total_interviews = reports_collection.count_documents({})

        return {
            "totalCandidates": total_candidates,
            "candidatesInterviewed": len(interviewed_ids),
            "candidatesNotInterviewed": max(0, total_candidates - len(interviewed_ids)),
            "totalInterviewsCompleted": total_interviews,
        }


# Global singleton instance for app-wide import
mongo_service = MongoService()
