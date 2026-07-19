# Seeding dynamic operational logs from similar past events
HISTORICAL_MATCHES = [
    {
        "event_type": "Football Cup Qualifier",
        "date": "2024-11-14",
        "crowd_size": 48500,
        "weather": "Rainy",
        "incidents": 2,
        "actions_taken": "Opened auxiliary Gate B secondary turnstiles",
        "outcome": "Reduced queue delays at Gate B by 28% on average",
    },
    {
        "event_type": "Derby Championship Match",
        "date": "2025-03-22",
        "crowd_size": 52000,
        "weather": "Clear",
        "incidents": 3,
        "actions_taken": "Redeployed 12 security stewards to East Concourse",
        "outcome": "Stabilized quadrant crowd density within 11 minutes",
    },
    {
        "event_type": "International Friendly Match",
        "date": "2025-05-09",
        "crowd_size": 35000,
        "weather": "Clear",
        "incidents": 1,
        "actions_taken": "Enabled detour digital signage routing near Gate C",
        "outcome": "Diverted 24% of flow, avoiding safety limit warnings",
    },
    {
        "event_type": "High Attendance Music Festival",
        "date": "2025-08-19",
        "crowd_size": 60000,
        "weather": "Rainy",
        "incidents": 4,
        "actions_taken": "Deactivated secondary gate entry, directed exits to North Gate",
        "outcome": "Averted major overcrowding stampede hazard zones",
    },
]


def find_similar_historical_events(
    weather_query: str | None = None, crowd_min: int | None = None
) -> list[dict]:
    """Queries and returns historical event profiles matching active match telemetry variables."""
    matches = HISTORICAL_MATCHES

    if weather_query:
        w_query = weather_query.lower()
        matches = [m for m in matches if w_query in m["weather"].lower()]

    if crowd_min:
        matches = [m for m in matches if m["crowd_size"] >= crowd_min]

    # Return at least a couple of fallback profiles if filters are too restrictive
    if not matches:
        return HISTORICAL_MATCHES[:2]

    return matches
