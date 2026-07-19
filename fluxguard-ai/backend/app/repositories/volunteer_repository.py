from sqlalchemy.orm import Session

from app.db.models import Volunteer


class VolunteerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_volunteers(self) -> list[dict]:
        vols = self.db.query(Volunteer).all()
        return [
            {
                "name": v.name,
                "languages": [lang.strip() for lang in v.language.split(",") if lang.strip()],
                "skills": [sk.strip() for sk in v.skill.split(",") if sk.strip()],
                "location": v.assigned_zone or "Main Plaza",
                "available": v.availability.lower() == "available",
            }
            for v in vols
        ]

    def add_volunteer(self, volunteer_data: dict) -> Volunteer:
        v = Volunteer(
            name=volunteer_data["name"],
            language=",".join(volunteer_data["languages"]),
            skill=",".join(volunteer_data["skills"]),
            availability="Available" if volunteer_data.get("available", True) else "Unavailable",
            assigned_zone=volunteer_data.get("location"),
        )
        self.db.add(v)
        self.db.commit()
        return v
