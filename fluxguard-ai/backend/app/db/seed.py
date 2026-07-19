import random
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.auth.password import hash_password
from app.db.database import SessionLocal
from app.db.models import (
    ActionExecution,
    AgentDecision,
    Alert,
    AuditLog,
    Camera,
    CrowdMeasurement,
    Event,
    Feedback,
    GuidanceMessage,
    HistoricalRecord,
    Incident,
    Prediction,
    RiskScore,
    Stadium,
    User,
    Volunteer,
    Zone,
    ZoneStaffing,
)

STADIUMS_LIST = [
    ("MetLife Stadium", "East Rutherford", "USA", 82500, 40.8136, -74.0744),
    ("SoFi Stadium", "Inglewood", "USA", 70240, 33.9534, -118.3390),
    ("Hard Rock Stadium", "Miami Gardens", "USA", 64767, 25.9580, -80.2389),
    ("Mercedes-Benz Stadium", "Atlanta", "USA", 71000, 33.7573, -84.4010),
    ("AT&T Stadium", "Arlington", "USA", 80000, 32.7473, -97.0945),
    ("Estadio Azteca", "Mexico City", "Mexico", 87523, 19.3029, -99.1505),
    ("Estadio Akron", "Guadalajara", "Mexico", 48071, 20.6811, -103.4628),
    ("Estadio BBVA", "Monterrey", "Mexico", 53500, 25.6692, -100.2447),
    ("BMO Field", "Toronto", "Canada", 30000, 43.6328, -79.4186),
    ("BC Place", "Vancouver", "Canada", 54500, 49.2767, -123.1120),
    ("Lumen Field", "Seattle", "USA", 68740, 47.5952, -122.3316),
    ("Levi's Stadium", "Santa Clara", "USA", 68500, 37.4033, -121.9694),
    ("Gillette Stadium", "Foxborough", "USA", 65878, 42.0909, -71.2643),
    ("Lincoln Financial Field", "Philadelphia", "USA", 69796, 39.9009, -75.1675),
    ("NRG Stadium", "Houston", "USA", 72220, 29.6847, -95.4107),
    ("Arrowhead Stadium", "Kansas City", "USA", 76416, 39.0489, -94.4839),
    ("Gaston-Gerard Stadium", "Dijon", "France", 15995, 47.3247, 5.0683),
    ("Allianz Arena", "Munich", "Germany", 75024, 48.2188, 11.6248),
    ("Wembley Stadium", "London", "UK", 90000, 51.5560, -0.2796),
    ("Stade de France", "Saint-Denis", "France", 80698, 48.9244, 2.3601),
]

LANGUAGES = [
    "English",
    "Spanish",
    "French",
    "German",
    "Japanese",
    "Arabic",
    "Portuguese",
    "Russian",
]
SKILLS = [
    "First Aid",
    "Egress Support",
    "Crowd Guidance",
    "Translation",
    "Ticketing",
    "VIP Support",
]
SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
INCIDENT_TYPES = [
    "Medical emergency",
    "Crowd bottleneck",
    "Ticket scanner failure",
    "Lost child",
    "Slip and fall",
    "Minor altercation",
]
AGENT_NAMES = [
    "Crowd Control Agent",
    "Emergency Response Agent",
    "Transport Coordinator Agent",
    "Resource Allocator Agent",
    "Safety Hazard Agent",
]
DECISION_ACTIONS = [
    "OPEN_GATE",
    "REDIRECT_FLOW",
    "DISPATCH_MEDICAL",
    "INCREASE_SHUTTLE_FREQUENCY",
    "ASSIGN_STAFF",
]


def seed_database(db: Session) -> None:
    # 1. Clean existing records
    db.query(GuidanceMessage).delete()
    db.query(Feedback).delete()
    db.query(Alert).delete()
    db.query(RiskScore).delete()
    db.query(Prediction).delete()
    db.query(CrowdMeasurement).delete()
    db.query(Camera).delete()
    db.query(ZoneStaffing).delete()
    db.query(Zone).delete()
    db.query(Incident).delete()
    db.query(Event).delete()
    db.query(Stadium).delete()
    db.query(Volunteer).delete()
    db.query(ActionExecution).delete()
    db.query(AgentDecision).delete()
    db.query(HistoricalRecord).delete()
    db.query(User).delete()
    db.query(AuditLog).delete()
    db.commit()

    # 2. Seed Users
    seeded_users = [
        User(
            id=uuid.uuid4(),
            name="Patricia",
            email="petrishavp74@gmail.com",
            password_hash=hash_password("Password123!"),
            role="SUPER_ADMIN",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Super Admin",
            email="admin@stadiumops.org",
            password_hash=hash_password("AdminPassword123!"),
            role="SUPER_ADMIN",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Global Director",
            email="director@stadiumops.org",
            password_hash=hash_password("DirectorPassword123!"),
            role="GLOBAL_OPERATIONS_DIRECTOR",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Stadium Manager",
            email="manager@stadiumops.org",
            password_hash=hash_password("ManagerPassword123!"),
            role="STADIUM_MANAGER",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Security Supervisor",
            email="security@stadiumops.org",
            password_hash=hash_password("SecurityPassword123!"),
            role="SECURITY_SUPERVISOR",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Medical Coordinator",
            email="medical@stadiumops.org",
            password_hash=hash_password("MedicalPassword123!"),
            role="MEDICAL_COORDINATOR",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Volunteer Coordinator",
            email="volunteer@stadiumops.org",
            password_hash=hash_password("VolunteerPassword123!"),
            role="VOLUNTEER_COORDINATOR",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Data Analyst",
            email="analyst@stadiumops.org",
            password_hash=hash_password("AnalystPassword123!"),
            role="DATA_ANALYST",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Default Viewer",
            email="viewer@stadiumops.org",
            password_hash=hash_password("ViewerPassword123!"),
            role="VIEWER",
            is_active=True,
            is_verified=True,
        ),
        # Legacy compatibility users for tests
        User(
            id=uuid.uuid4(),
            name="Alice Operator",
            email="operator@stadiumops.org",
            password_hash=hash_password("OperatorPassword123!"),
            role="operator",
            is_active=True,
            is_verified=True,
        ),
        User(
            id=uuid.uuid4(),
            name="Bob Organizer",
            email="organizer@stadiumops.org",
            password_hash=hash_password("OrganizerPassword123!"),
            role="organizer",
            is_active=True,
            is_verified=True,
        ),
    ]
    for u in seeded_users:
        db.add(u)

    # 3. Seed Stadiums (20 stadiums)
    stadium_objects = []
    # Make sure we preserve Lucusa Stadium UUID for compatibility with existing tests
    lucusa_id = uuid.UUID("b0000000-0000-0000-0000-000000000000")
    lucusa_stadium = Stadium(
        id=lucusa_id,
        name="Lucusa Stadium",
        city="Lucusa",
        country="Lusaka",
        capacity=85000,
        latitude=-15.4167,
        longitude=28.2833,
    )
    db.add(lucusa_stadium)
    stadium_objects.append(lucusa_stadium)

    for i, (name, city, country, cap, lat, lon) in enumerate(STADIUMS_LIST[1:], start=1):
        std = Stadium(
            id=uuid.UUID(f"b0000000-0000-0000-0000-{i:012x}"),
            name=name,
            city=city,
            country=country,
            capacity=cap,
            latitude=lat,
            longitude=lon,
        )
        db.add(std)
        stadium_objects.append(std)

    db.commit()

    # 4. Seed Events (100 events)
    event_objects = []
    # Preserve first active World Cup event context UUID for existing tests
    opening_event_id = uuid.UUID("e0000000-0000-0000-0000-000000000000")
    opening_event = Event(
        id=opening_event_id,
        stadium_id=lucusa_id,
        name="FIFA World Cup 2026 - Opening Match",
        date=datetime(2026, 6, 11, 18, 0, 0),
        attendance=75000,
        description="Opening match at the stadium",
        status="active",
        starts_at=datetime(2026, 6, 11, 18, 0, 0),
        ends_at=datetime(2026, 6, 11, 22, 0, 0),
    )
    db.add(opening_event)
    event_objects.append(opening_event)

    # Preserve second and third event UUIDs for compatibility
    group_b_event = Event(
        id=uuid.UUID("e0000000-0000-0000-0000-000000000001"),
        stadium_id=uuid.UUID("b0000000-0000-0000-0000-000000000001"),
        name="FIFA World Cup 2026 - Group B Match",
        date=datetime(2026, 6, 12, 15, 0, 0),
        attendance=42000,
        description="Group Stage B match",
        status="active",
        starts_at=datetime(2026, 6, 12, 15, 0, 0),
        ends_at=datetime(2026, 6, 12, 19, 0, 0),
    )
    db.add(group_b_event)
    event_objects.append(group_b_event)

    watch_party_event = Event(
        id=uuid.UUID("e0000000-0000-0000-0000-000000000002"),
        stadium_id=uuid.UUID("b0000000-0000-0000-0000-000000000002"),
        name="World Cup City Live Watch Party",
        date=datetime(2026, 6, 12, 18, 0, 0),
        attendance=18000,
        description="Downtown watch party under the stars",
        status="active",
        starts_at=datetime(2026, 6, 12, 18, 0, 0),
        ends_at=datetime(2026, 6, 12, 23, 0, 0),
    )
    db.add(watch_party_event)
    event_objects.append(watch_party_event)

    for i in range(3, 100):
        std = random.choice(stadium_objects)
        ev_id = uuid.UUID(f"e0000000-0000-0000-0000-000000000{i:03x}")
        start_time = datetime(2026, 6, 13) + timedelta(days=i // 5, hours=(i % 3) * 4)
        ev = Event(
            id=ev_id,
            stadium_id=std.id,
            name=f"FIFA World Cup 2026 - Match {i+1}",
            date=start_time,
            attendance=random.randint(int(std.capacity * 0.5), std.capacity),
            description=f"Tournament fixture matches match {i+1}",
            status="active",
            starts_at=start_time,
            ends_at=start_time + timedelta(hours=3),
        )
        db.add(ev)
        event_objects.append(ev)

    db.commit()

    # 5. Seed Zones (we generate zones for each of our top events so simulations don't crash)
    zone_objects = []
    # Core compatibility zones for Lucusa Stadium event
    lucusa_zones = [
        (uuid.UUID("00000000-0000-0000-0000-000000000001"), "North Gate", "gate", 2000),
        (uuid.UUID("00000000-0000-0000-0000-000000000002"), "East Concourse", "concourse", 5000),
        (uuid.UUID("00000000-0000-0000-0000-000000000003"), "Gate C", "gate", 1500),
        (uuid.UUID("00000000-0000-0000-0000-000000000004"), "West Entrance", "gate", 1800),
    ]
    for z_id, name, z_type, cap in lucusa_zones:
        z = Zone(
            id=z_id,
            event_id=opening_event_id,
            name=name,
            zone_type=z_type,
            capacity=cap,
            status="open",
        )
        db.add(z)
        zone_objects.append(z)

    # City Arena zones
    city_arena_zones = [
        (uuid.UUID("00000000-0000-0000-0000-000000000005"), "Main Entry Gate", "gate", 3000),
        (uuid.UUID("00000000-0000-0000-0000-000000000006"), "South Concourse", "concourse", 4000),
        (uuid.UUID("00000000-0000-0000-0000-000000000007"), "North Gate Stand", "gate", 2500),
    ]
    for z_id, name, z_type, cap in city_arena_zones:
        z = Zone(
            id=z_id,
            event_id=uuid.UUID("e0000000-0000-0000-0000-000000000001"),
            name=name,
            zone_type=z_type,
            capacity=cap,
            status="open",
        )
        db.add(z)
        zone_objects.append(z)

    # Downtown Fan Zone
    fan_zones = [
        (uuid.UUID("00000000-0000-0000-0000-000000000008"), "Screening Plaza", "concourse", 8000),
        (
            uuid.UUID("00000000-0000-0000-0000-000000000009"),
            "Food & Beverage Court",
            "concourse",
            3000,
        ),
        (uuid.UUID("00000000-0000-0000-0000-000000000010"), "Transit Egress Gate", "gate", 5000),
    ]
    for z_id, name, z_type, cap in fan_zones:
        z = Zone(
            id=z_id,
            event_id=uuid.UUID("e0000000-0000-0000-0000-000000000002"),
            name=name,
            zone_type=z_type,
            capacity=cap,
            status="open",
        )
        db.add(z)
        zone_objects.append(z)

    # Seed some standard zones for other events to keep datasets linked
    for ev in event_objects[3:]:
        for _suffix, (name, z_type, cap) in enumerate(
            [("North Ingress", "gate", 3000), ("Upper Concourse", "concourse", 6000)]
        ):
            z_id = uuid.uuid4()
            z = Zone(
                id=z_id,
                event_id=ev.id,
                name=f"{ev.name} - {name}",
                zone_type=z_type,
                capacity=cap,
                status="open",
            )
            db.add(z)
            zone_objects.append(z)

    db.commit()

    # Seed Cameras for Lucusa Stadium
    for c_idx, name in enumerate(["Turnstile Cam 1", "Egress Cam 2", "Concourse Cam A"]):
        cam = Camera(
            id=uuid.UUID(f"c0000000-0000-0000-0000-{(c_idx+1):012x}"),
            zone_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            name=name,
            fps=30,
            accuracy=0.94,
            status="active",
        )
        db.add(cam)

    # 6. Seed Volunteers (1000 volunteers)
    names = [
        "Mateo",
        "Sofia",
        "Carlos",
        "Elena",
        "Kenji",
        "Marie",
        "Lucia",
        "Diego",
        "Jean",
        "Anna",
        "Yusuf",
        "Amina",
        "Chloe",
        "Hans",
        "Tariq",
        "Li Wei",
    ]
    surnames = [
        "Silva",
        "Hernandez",
        "Gomez",
        "Rostova",
        "Sato",
        "Dubois",
        "Rossi",
        "Alvarez",
        "Martin",
        "Kowalski",
        "Demir",
        "El-Amin",
        "Muller",
        "Schmidt",
        "Haddad",
        "Wang",
    ]

    for i in range(1000):
        vol_langs = random.sample(LANGUAGES, k=random.randint(1, 3))
        if "Spanish" not in vol_langs and i % 3 == 0:
            vol_langs.append("Spanish")
        vol_skills = random.sample(SKILLS, k=random.randint(1, 2))
        vol = Volunteer(
            id=uuid.uuid4(),
            name=f"{random.choice(names)} {random.choice(surnames)}",
            language=",".join(vol_langs),
            skill=",".join(vol_skills),
            availability="Available" if random.random() > 0.1 else "Unavailable",
            assigned_zone="Fan Zone A" if i % 5 == 0 else "Gate C" if i % 7 == 0 else "VIP Stand",
        )
        db.add(vol)
    db.commit()

    # 7. Seed Incidents (500 incidents)
    for i in range(500):
        ev = random.choice(event_objects)
        inc = Incident(
            id=(
                uuid.uuid4() if i > 0 else uuid.UUID("00000000-0000-0000-0000-000000000000")
            ),  # First incident ID
            event_id=ev.id,
            type=random.choice(INCIDENT_TYPES),
            severity=random.choice(SEVERITIES),
            status=random.choice(["open", "acknowledged", "resolved"]),
            location=f"Concourse {random.choice(['A', 'B', 'C', 'D'])}",
            description="Mock incident details logged for tournament fixtures.",
            responder_name="Medic Team 2" if i % 3 == 0 else None,
            created_at=datetime.now(UTC) - timedelta(minutes=random.randint(10, 1000)),
        )
        db.add(inc)
    db.commit()

    # 8. Seed Historical records (300 records)
    outcomes = [
        "Queue length reduced by 31% within 9 minutes",
        "Crowd stress resolved; queue stabilized in 7 minutes",
        "Train terminal egress cleared 11 minutes faster",
        "Secondary lock bypassed, flow rates optimized",
        "Medics dispatched, arrived in 4.2 minutes",
    ]
    for i in range(300):
        rec = HistoricalRecord(
            id=uuid.uuid4(),
            event_name=f"FIFA World Cup historical fixture match {i+1}",
            action=random.choice(DECISION_ACTIONS),
            outcome=random.choice(outcomes),
            effectiveness=random.randint(70, 98),
            historical_success_rate=f"{random.randint(70, 96)}%",
        )
        db.add(rec)
    db.commit()

    # 9. Seed AI Decisions & Actions (100 decisions / 100 executions)
    for i in range(100):
        # We preserve dec_crowd_001 for autonomous control checks compatibility
        d_id = uuid.UUID("00000000-0000-0000-0000-000000000001") if i == 0 else uuid.uuid4()
        dec = AgentDecision(
            id=d_id,
            agent_name=random.choice(AGENT_NAMES),
            recommendation=random.choice(DECISION_ACTIONS),
            confidence=random.randint(75, 98),
            status="APPROVED" if i % 2 == 0 else "PENDING_APPROVAL",
            created_at=datetime.now(UTC) - timedelta(minutes=random.randint(5, 500)),
            expected_impact=f"Queue delays reduced by {random.randint(15, 40)}%",
            reason=f"Bottleneck warnings registered at Gate {random.choice(['B', 'C', 'D'])}",
            target=f"Gate {random.choice(['B', 'C', 'D'])}",
        )
        db.add(dec)
        db.flush()  # populate ID

        if dec.status == "APPROVED":
            exec_rec = ActionExecution(
                id=uuid.uuid4(),
                decision_id=dec.id,
                action=dec.recommendation,
                result="Success: Operation execution logged by command center",
                execution_time=datetime.now(UTC) - timedelta(minutes=random.randint(1, 4)),
                operator="OPS-Lead",
                impact=dec.expected_impact,
            )
            db.add(exec_rec)

    # 7. Seed Cameras (for computer vision dashboard CCTV feeds)
    camera_seeds = [
        # Lucusa Stadium cameras
        ("CAM-L01", uuid.UUID("00000000-0000-0000-0000-000000000001"), 30, 0.98),
        ("CAM-L02", uuid.UUID("00000000-0000-0000-0000-000000000002"), 25, 0.95),
        ("CAM-L03", uuid.UUID("00000000-0000-0000-0000-000000000003"), 30, 0.97),
        ("CAM-L04", uuid.UUID("00000000-0000-0000-0000-000000000004"), 20, 0.94),
        # City Arena cameras
        ("CAM-A01", uuid.UUID("00000000-0000-0000-0000-000000000005"), 30, 0.96),
        ("CAM-A02", uuid.UUID("00000000-0000-0000-0000-000000000006"), 25, 0.97),
        ("CAM-A03", uuid.UUID("00000000-0000-0000-0000-000000000007"), 30, 0.95),
        # Downtown Fan Zone cameras
        ("CAM-F01", uuid.UUID("00000000-0000-0000-0000-000000000008"), 30, 0.98),
        ("CAM-F02", uuid.UUID("00000000-0000-0000-0000-000000000009"), 20, 0.93),
        ("CAM-F03", uuid.UUID("00000000-0000-0000-0000-000000000010"), 25, 0.94),
    ]
    for name, z_id, fps, acc in camera_seeds:
        cam = Camera(
            id=uuid.uuid4(), zone_id=z_id, name=name, fps=fps, accuracy=acc, status="active"
        )
        db.add(cam)

    db.commit()
    print("Database seeding completed successfully.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
