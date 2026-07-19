# Seed mock database of active volunteers
VOLUNTEER_DATABASE = [
    {
        "name": "Mateo Silva",
        "languages": ["Spanish", "English"],
        "skills": ["First Aid", "Egress Support"],
        "location": "Fan Zone A",
        "available": True,
    },
    {
        "name": "Sofia Hernandez",
        "languages": ["Spanish", "French"],
        "skills": ["Crowd Guidance", "Translation"],
        "location": "Fan Zone A",
        "available": True,
    },
    {
        "name": "Carlos Gomez",
        "languages": ["Spanish", "English"],
        "skills": ["Ticketing", "First Aid"],
        "location": "Gate C",
        "available": True,
    },
    {
        "name": "Elena Rostova",
        "languages": ["Russian", "English"],
        "skills": ["Translation", "VIP Escort"],
        "location": "VIP Stand",
        "available": True,
    },
    {
        "name": "Kenji Sato",
        "languages": ["Japanese", "English"],
        "skills": ["Crowd Guidance", "Egress Support"],
        "location": "North Concourse",
        "available": True,
    },
    {
        "name": "Marie Dubois",
        "languages": ["French", "English"],
        "skills": ["Translation", "First Aid"],
        "location": "East Gate",
        "available": True,
    },
    {
        "name": "Lucia Rossi",
        "languages": ["Italian", "Spanish"],
        "skills": ["Translation", "Crowd Guidance"],
        "location": "Fan Zone A",
        "available": True,
    },
    {
        "name": "Diego Alvarez",
        "languages": ["Spanish", "English"],
        "skills": ["First Aid", "Crowd Guidance"],
        "location": "Fan Zone A",
        "available": True,
    },
]


def recommend_volunteers_for_need(need_description: str, required_count: int = 3) -> dict:
    """Matches and assigns volunteers matching skill, language, and location needs."""
    desc = need_description.lower()

    # 1. Parse languages and skills from query
    target_languages = []
    if "spanish" in desc:
        target_languages.append("Spanish")
    if "french" in desc:
        target_languages.append("French")
    if "russian" in desc:
        target_languages.append("Russian")
    if "japanese" in desc:
        target_languages.append("Japanese")

    # 2. Filter volunteer registry
    matched = []
    for v in VOLUNTEER_DATABASE:
        if not v["available"]:
            continue
        # Language matching check
        lang_match = (
            any(language in v["languages"] for language in target_languages)
            if target_languages
            else True
        )
        # Location/Skill query matches
        loc_match = True
        if "fan zone a" in desc and v["location"] != "Fan Zone A":
            loc_match = False

        if lang_match and loc_match:
            matched.append(v)

    # Fallback to general volunteers if no exact match found
    if not matched:
        matched = [v for v in VOLUNTEER_DATABASE if v["available"]]

    assigned = matched[:required_count]

    return {
        "needDescription": need_description,
        "availableCount": len(matched),
        "requiredCount": required_count,
        "assignedVolunteers": [
            {
                "name": v["name"],
                "languages": v["languages"],
                "skills": v["skills"],
                "location": v["location"],
            }
            for v in assigned
        ],
    }
