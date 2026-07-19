from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Event, ZoneStaffing


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_events(self) -> list[dict]:
        events = self.db.query(Event).all()
        return [
            {
                "id": e.id,
                "name": e.name,
                "description": e.description,
                "status": e.status,
                "starts_at": e.starts_at,
                "ends_at": e.ends_at,
                "venue_id": e.stadium_id,
            }
            for e in events
        ]

    def get_event_by_id(self, event_id: UUID) -> dict | None:
        e = self.db.query(Event).filter(Event.id == event_id).first()
        if not e:
            return None
        return {
            "id": e.id,
            "name": e.name,
            "description": e.description,
            "status": e.status,
            "starts_at": e.starts_at,
            "ends_at": e.ends_at,
            "venue_id": e.stadium_id,
        }

    def get_events_for_venue(self, venue_id: UUID) -> list[dict]:
        events = self.db.query(Event).filter(Event.stadium_id == venue_id).all()
        return [
            {
                "id": e.id,
                "name": e.name,
                "description": e.description,
                "status": e.status,
                "starts_at": e.starts_at,
                "ends_at": e.ends_at,
                "venue_id": e.stadium_id,
            }
            for e in events
        ]

    def get_zone_staffing(self, event_id: UUID) -> dict[str, int]:
        from app.db.models import Zone

        zones = self.db.query(Zone).filter(Zone.event_id == event_id).all()
        defaults = {
            "00000000-0000-0000-0000-000000000001": 20,
            "00000000-0000-0000-0000-000000000002": 15,
            "00000000-0000-0000-0000-000000000003": 25,
            "00000000-0000-0000-0000-000000000004": 10,
            "00000000-0000-0000-0000-000000000005": 25,
            "00000000-0000-0000-0000-000000000006": 20,
            "00000000-0000-0000-0000-000000000007": 25,
            "00000000-0000-0000-0000-000000000008": 35,
            "00000000-0000-0000-0000-000000000009": 15,
            "00000000-0000-0000-0000-000000000010": 20,
        }
        res = {}
        for z in zones:
            z_id_str = str(z.id)
            res[z_id_str] = defaults.get(z_id_str, 15)

        staff_records = self.db.query(ZoneStaffing).filter(ZoneStaffing.event_id == event_id).all()
        for record in staff_records:
            res[str(record.zone_id)] = record.count
        return res

    def update_zone_staffing(self, event_id: UUID, zone_id: UUID, count: int) -> None:
        record = (
            self.db.query(ZoneStaffing)
            .filter(ZoneStaffing.event_id == event_id, ZoneStaffing.zone_id == zone_id)
            .first()
        )
        if not record:
            record = ZoneStaffing(event_id=event_id, zone_id=zone_id, count=count)
            self.db.add(record)
        else:
            record.count = count
        self.db.commit()
