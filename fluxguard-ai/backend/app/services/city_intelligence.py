def get_city_operations_status() -> dict:
    """Returns real-time diagnostics of external urban systems affecting stadium operations."""
    return {
        "transportation": {
            "metroCongestion": "high",
            "roadTraffic": "medium",
            "shuttleAvailability": "90%",
            "parkingPressure": "high",
        },
        "weather": {
            "rain": "none",
            "temperatureCelsius": 24,
            "visibility": "good",
        },
        "fanZones": [
            {
                "name": "Times Square Viewing Area",
                "currentCrowd": 12500,
                "capacity": 15000,
                "status": "normal",
            },
            {
                "name": "Central Park Fan Plaza",
                "currentCrowd": 18000,
                "capacity": 20000,
                "status": "warning",
            },
        ],
    }


def query_city_impact_prediction(query: str) -> dict:
    """Analyzes a natural language operational scenario and forecasts city impact factors."""
    q = query.lower()

    if "start" in q or "45 minutes" in q or "kickoff" in q:
        return {
            "predictedTimeline": "Within T-45 minutes to Kickoff",
            "predictions": [
                "Metro arrivals projected to surge by +300 pax/min at Stadium Hub station.",
                "North Gate entry turnstile queue pressure will rise from LOW to HIGH in 12 minutes.",
                "Local road traffic delays expected to increase by +15 minutes along Eastern Corridor.",
            ],
            "recommendedActions": [
                "Deploy 5 additional volunteers to Stadium Hub metro exit guidance points.",
                "Open secondary bypass lanes at North Gate turnstiles.",
            ],
        }

    # Default fallback city predictions
    return {
        "predictedTimeline": "General Event Duration State",
        "predictions": [
            "Metro passenger egress streams remain at standard baseline flows.",
            "Weather conditions remain stable; visibility normal.",
            "Local highway speeds within normal parameters.",
        ],
        "recommendedActions": [
            "Monitor traffic feeds.",
            "Ensure digital signage displays general guidance graphics.",
        ],
    }
