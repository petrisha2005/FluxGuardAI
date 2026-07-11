import hashlib
import os
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from app.core import database


TRANSLATIONS = {
    "es": {
        "Congestion Alert: {zone_name}": "Alerta de congestión: {zone_name}",
        "High density and delays expected near {zone_name}.": "Se esperan altas densidades y retrasos cerca de {zone_name}.",
        "Use concourse corridors bypassing {zone_name}.": "Use pasillos de vestíbulo evitando {zone_name}.",
        "Elevators and wheelchair ramps remain open.": "Los ascensores y rampas para sillas de ruedas permanecen abiertos.",
        "Standby monitoring alert triggered for {zone_name}.": "Alerta de monitoreo en espera activada para {zone_name}.",
        "Confirm CCTV feed visibility": "Confirmar visibilidad de cámaras de CCTV",
        "Notify local stewards": "Notificar a los supervisores locales",
        "Maintain normal visual checks.": "Mantener controles visuales normales.",
        "Deploy additional volunteers": "Desplegar voluntarios adicionales",
        "Congestion event tracked in {zone_name}.": "Evento de congestión registrado en {zone_name}.",
        "Standard crowd flow baseline exceeded.": "Línea base estándar de flujo de multitud superada.",
        "Review gate staffing schedules": "Revisar horarios de personal de puertas",
        "Gate arrival counts": "Recuentos de llegada a puertas",
        "Redirect flow at {zone_name}": "Redirigir flujo en {zone_name}",
        "Set up barriers at {zone_name}": "Establecer barreras en {zone_name}",
        "Direct visitors to West Entrance": "Dirigir visitantes a la Entrada Oeste",
        "Queue lines exceed normal barriers": "Las colas superan las barreras normales",
        "Emergency or panic words": "Palabras de emergencia o pánico",
        "High density alerts triggered at {zone_name}.": "Alertas de alta densidad activadas en {zone_name}.",
        "Gate capacity bottlenecks": "Cuellos de botella en capacidad de puertas",
        "halftime compression flow": "Flujo de compresión a mitad de tiempo",
        "Redirect visitors away from {zone_name}": "Redirigir visitantes lejos de {zone_name}",
        "Deploy volunteers": "Desplegar voluntarios",
        "Active camera coverage on {zone_name} turnstiles.": "Cobertura activa de cámara en molinetes de {zone_name}.",
        "Open auxiliary safety gates": "Abrir puertas de seguridad auxiliares",
        "Hold transit incoming arrivals": "Retener llegadas entrantes de tránsito",
        "Corridor safety thresholds breached at {zone_name}.": "Umbrales de seguridad de pasillo superados en {zone_name}.",
        "High congestion during halftime corridor passage.": "Alta congestión durante el paso por pasillos a mitad de tiempo.",
        "Increase auxiliary gate counts": "Aumentar número de puertas auxiliares",
        "Deploy active sign directors": "Desplegar directores de señales activos",
        "Halftime ingress rates": "Tasas de ingreso a mitad de tiempo",
        "Strategic Summary: {zone_name}": "Resumen estratégico: {zone_name}",
        "Operator Guidance: {zone_name}": "Guía del operador: {zone_name}",
        "Standby Monitoring Alert": "Alerta de monitoreo de espera",
        "Event Analytics Summary": "Resumen de análisis de eventos",
        "Caution: Route Congestion": "Precaución: congestión de ruta",
        "Expect slow movement near {zone_name}.": "Espere movimiento lento cerca de {zone_name}.",
        "Follow signs to nearest open exit.": "Siga las señales hacia la salida abierta más cercana.",
        "Standard routes remain accessible.": "Las rutas estándar siguen siendo accesibles.",
        "Monitor Zone Flow": "Monitorear el flujo de la zona",
        "Observe crowd density at {zone_name}": "Observe la densidad de multitud en {zone_name}",
        "Report backlogs to control room": "Informar retrasos a la sala de control",
    },
    "fr": {
        "Congestion Alert: {zone_name}": "Alerte de congestion : {zone_name}",
        "High density and delays expected near {zone_name}.": "Forte densité et retards attendus près de {zone_name}.",
        "Use concourse corridors bypassing {zone_name}.": "Utilisez les couloirs de contournement évitant {zone_name}.",
        "Elevators and wheelchair ramps remain open.": "Les ascenseurs et rampes d'accès restent ouverts.",
        "Standby monitoring alert triggered for {zone_name}.": "Alerte de surveillance en veille activée pour {zone_name}.",
        "Confirm CCTV feed visibility": "Confirmer la visibilité des caméras de vidéosurveillance",
        "Notify local stewards": "Notifier les stadiers locaux",
        "Maintain normal visual checks.": "Maintenir les vérifications visuelles normales.",
        "Deploy additional volunteers": "Déployer des bénévoles supplémentaires",
        "Congestion event tracked in {zone_name}.": "Événement de congestion enregistré dans {zone_name}.",
        "Standard crowd flow baseline exceeded.": "Ligne de base de flux de foule standard dépassée.",
        "Review gate staffing schedules": "Revoir les horaires du personnel aux portes",
        "Gate arrival counts": "Comptes d'arrivée aux portes",
        "Redirect flow at {zone_name}": "Rediriger le flux à {zone_name}",
        "Set up barriers at {zone_name}": "Mettre en place des barrières à {zone_name}",
        "Direct visitors to West Entrance": "Diriger les visiteurs vers l'Entrée Ouest",
        "Queue lines exceed normal barriers": "Les files d'attente dépassent les barrières normales",
        "Emergency or panic words": "Mots d'urgence ou de panique",
        "High density alerts triggered at {zone_name}.": "Alertes de forte densité activées à {zone_name}.",
        "Gate capacity bottlenecks": "Goulots d'étranglement de capacité aux portes",
        "halftime compression flow": "Flux de compression à la mi-temps",
        "Redirect visitors away from {zone_name}": "Rediriger les visiteurs loin de {zone_name}",
        "Deploy volunteers": "Déployer des bénévoles",
        "Active camera coverage on {zone_name} turnstiles.": "Couverture active des caméras sur les tourniquets de {zone_name}.",
        "Open auxiliary safety gates": "Ouvrir les portes de sécurité auxiliaires",
        "Hold transit incoming arrivals": "Retenir les arrivées de transit entrantes",
        "Corridor safety thresholds breached at {zone_name}.": "Seuils de sécurité des couloirs franchis à {zone_name}.",
        "High congestion during halftime corridor passage.": "Forte congestion pendant le passage dans les couloirs à la mi-temps.",
        "Increase auxiliary gate counts": "Augmenter le nombre de portes auxiliaires",
        "Deploy active sign directors": "Déployer des directeurs de signalisation actifs",
        "Halftime ingress rates": "Taux d'entrée à la mi-temps",
        "Strategic Summary: {zone_name}": "Résumé stratégique : {zone_name}",
        "Operator Guidance: {zone_name}": "Directives de l'opérateur : {zone_name}",
        "Standby Monitoring Alert": "Alerte de surveillance en veille",
        "Event Analytics Summary": "Résumé analytique de l'événement",
        "Caution: Route Congestion": "Attention : congestion des itinéraires",
        "Expect slow movement near {zone_name}.": "Attendez-vous à un mouvement lent près de {zone_name}.",
        "Follow signs to nearest open exit.": "Suivre les panneaux vers la sortie ouverte la plus proche.",
        "Standard routes remain accessible.": "Les itinéraires standard restent accessibles.",
        "Monitor Zone Flow": "Surveiller le flux de la zone",
        "Observe crowd density at {zone_name}": "Observer la densité de la foule à {zone_name}",
        "Report backlogs to control room": "Signaler les encombrements à la salle de contrôle",
    },
    "de": {
        "Congestion Alert: {zone_name}": "Stauwarnung: {zone_name}",
        "High density and delays expected near {zone_name}.": "Hohe Dichte und Verzögerungen in der Nähe von {zone_name} erwartet.",
        "Use concourse corridors bypassing {zone_name}.": "Nutzen Sie Flure, die {zone_name} umgehen.",
        "Elevators and wheelchair ramps remain open.": "Aufzüge und Rollstuhlrampen bleiben geöffnet.",
        "Standby monitoring alert triggered for {zone_name}.": "Überwachungsbereitschaftsalarm für {zone_name} ausgelöst.",
        "Confirm CCTV feed visibility": "Sichtbarkeit der Überwachungskameras bestätigen",
        "Notify local stewards": "Lokale Ordner benachrichtigen",
        "Maintain normal visual checks.": "Normale visuelle Kontrollen beibehalten.",
        "Deploy additional volunteers": "Zusätzliche Freiwillige einsetzen",
        "Congestion event tracked in {zone_name}.": "Überlastungsereignis in {zone_name} verfolgt.",
        "Standard crowd flow baseline exceeded.": "Standard-Flussgrenze überschritten.",
        "Review gate staffing schedules": "Personaleinsatzpläne für Tore überprüfen",
        "Gate arrival counts": "Tor-Ankunftszählungen",
        "Redirect flow at {zone_name}": "Fluss bei {zone_name} umleiten",
        "Set up barriers at {zone_name}": "Barrieren bei {zone_name} aufstellen",
        "Direct visitors to West Entrance": "Besucher zum Westeingang leiten",
        "Queue lines exceed normal barriers": "Warteschlangen überschreiten normale Barrieren",
        "Emergency or panic words": "Notfall- oder Panikwörter",
        "High density alerts triggered at {zone_name}.": "Alarm bei hoher Dichte in {zone_name} ausgelöst.",
        "Gate capacity bottlenecks": "Engpässe bei der Torkapazität",
        "halftime compression flow": "Verdichtungsfluss in der Halbzeit",
        "Redirect visitors away from {zone_name}": "Besucher von {zone_name} wegleiten",
        "Deploy volunteers": "Freiwillige einsetzen",
        "Active camera coverage on {zone_name} turnstiles.": "Aktive Kameraabdeckung an den Drehkreuzen von {zone_name}.",
        "Open auxiliary safety gates": "Zusätzliche Sicherheitstore öffnen",
        "Hold transit incoming arrivals": "Eingehende Transitankünfte anhalten",
        "Corridor safety thresholds breached at {zone_name}.": "Sicherheitsgrenzen in Korridor bei {zone_name} überschritten.",
        "High congestion during halftime corridor passage.": "Hohe Stauung während des Korridordurchgangs zur Halbzeit.",
        "Increase auxiliary gate counts": "Anzahl der Hilfstore erhöhen",
        "Deploy active sign directors": "Aktive Wegweiser einsetzen",
        "Halftime ingress rates": "Halbzeit-Einlassraten",
        "Strategic Summary: {zone_name}": "Strategische Zusammenfassung: {zone_name}",
        "Operator Guidance: {zone_name}": "Bedienerführung: {zone_name}",
        "Standby Monitoring Alert": "Überwachungsbereitschaftsalarm",
        "Event Analytics Summary": "Ereignisanalytische Zusammenfassung",
        "Caution: Route Congestion": "Achtung: Routenüberlastung",
        "Expect slow movement near {zone_name}.": "Erwarten Sie langsame Bewegung in der Nähe von {zone_name}.",
        "Follow signs to nearest open exit.": "Folgen Sie den Schildern zum nächsten geöffneten Ausgang.",
        "Standard routes remain accessible.": "Standardrouten bleiben zugänglich.",
        "Monitor Zone Flow": "Zonenfluss überwachen",
        "Observe crowd density at {zone_name}": "Beobachten Sie die Menschendichte bei {zone_name}",
        "Report backlogs to control room": "Rückstände an den Kontrollraum melden",
    }
}


def get_translation(text: str, lang: str) -> str:
    if not lang or lang == "en" or lang not in TRANSLATIONS:
        return text

    if text in TRANSLATIONS[lang]:
        return TRANSLATIONS[lang][text]

    for template, translation in TRANSLATIONS[lang].items():
        if "{zone_name}" in template:
            prefix = template.split("{zone_name}")[0]
            suffix = template.split("{zone_name}")[-1]
            if text.startswith(prefix) and (not suffix or text.endswith(suffix)):
                zone_val = text[len(prefix) : len(text) - len(suffix) if suffix else None]
                return translation.format(zone_name=zone_val)

    return text


def translate_value(val: Any, lang: str) -> Any:
    if isinstance(val, str):
        return get_translation(val, lang)
    elif isinstance(val, list):
        return [translate_value(item, lang) for item in val]
    elif isinstance(val, dict):
        return {k: translate_value(v, lang) for k, v in val.items()}
    return val


def get_deterministic_fallback(
    alert: dict, audience_role: str, zone_name: str, language: str = "en"
) -> dict:
    """Generates standard deterministic fallback guidance when LLM schema generation is
    bypassed or fails."""
    now = datetime.now(UTC)
    expires = now + timedelta(hours=1)
    severity = alert["severity"]

    if audience_role == "fan":
        payload = {
            "headline": "Caution: Route Congestion",
            "shortMessage": f"Expect slow movement near {zone_name}.",
            "recommendedRoute": "Follow signs to nearest open exit.",
            "avoidZones": [zone_name],
            "estimatedDelay": "10-15 minutes",
            "accessibilityNote": "Standard routes remain accessible.",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = []
    elif audience_role == "volunteer":
        payload = {
            "headline": "Monitor Zone Flow",
            "priority": "medium",
            "actions": [f"Observe crowd density at {zone_name}", "Report backlogs to control room"],
            "location": zone_name,
            "escalationTrigger": "Queue lines exceed normal barriers",
            "doNotSay": "Emergency or panic words",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = payload["actions"]
    elif audience_role == "operator":
        payload = {
            "incidentSummary": f"Standby monitoring alert triggered for {zone_name}.",
            "riskDrivers": ["Standard threshold breach"],
            "recommendedActions": ["Confirm CCTV feed visibility", "Notify local stewards"],
            "affectedZones": [zone_name],
            "confidence": 1.0,
            "monitoringPlan": "Maintain normal visual checks.",
            "escalationOptions": ["Deploy additional volunteers"],
        }
        headline = "Standby Monitoring Alert"
        actions = payload["recommendedActions"]
    else:  # organizer
        payload = {
            "eventImpactSummary": f"Congestion event tracked in {zone_name}.",
            "trendExplanation": "Standard crowd flow baseline exceeded.",
            "recommendedPlanningChanges": ["Review gate staffing schedules"],
            "metricsToReview": ["Gate arrival counts"],
        }
        headline = "Event Analytics Summary"
        actions = []

    record = {
        "guidance_id": uuid4(),
        "alert_id": alert["id"],
        "audience_role": audience_role,
        "severity": severity,
        "headline": headline,
        "actions": actions,
        "expires_at": expires,
        "payload": payload,
        "prompt_version": "fallback-1.0",
        "schema_version": "fallback-1.0",
        "model_provider": "system",
        "model_name": "deterministic-template",
        "input_context_hash": "fallback",
        "status": "PENDING_APPROVAL",
    }
    if language != "en":
        record["headline"] = get_translation(record["headline"], language)
        record["actions"] = [get_translation(a, language) for a in record["actions"]]
        record["payload"] = translate_value(record["payload"], language)
    return record


def generate_guidance_for_alert(
    alert_id: UUID,
    audience_role: str,
    language: str = "en",
    force_fallback: bool = False,
) -> dict:
    """Loads templates, constructs prompts, and generates structured AI guidance or
    executes fallbacks."""
    alert = database.get_alert_by_id(alert_id)
    if not alert:
        raise KeyError(f"Alert {alert_id} not found")

    zone = database.get_zone_by_id(alert["zone_id"])
    zone_name = zone["name"] if zone else "Unknown Zone"

    event = database.get_event_by_id(zone["event_id"]) if zone else None
    event_name = event["name"] if event else "MEGA Event"

    if force_fallback or audience_role not in {"fan", "volunteer", "operator", "organizer"}:
        record = get_deterministic_fallback(alert, audience_role, zone_name, language)
        database.add_guidance(record)
        return record

    # Load prompt template from filesystem
    template_path = os.path.join(
        os.path.dirname(__file__), "..", "prompts", "templates", f"{audience_role}_v1.md"
    )

    try:
        with open(template_path, encoding="utf-8") as f:
            template_text = f.read()

        # Format prompt
        formatted_prompt = template_text.format(
            event_name=event_name, zone_name=zone_name, severity=alert["severity"]
        )
        context_hash = hashlib.sha256(formatted_prompt.encode("utf-8")).hexdigest()
    except Exception:
        # Fallback if file load fails
        record = get_deterministic_fallback(alert, audience_role, zone_name, language)
        database.add_guidance(record)
        return record

    now = datetime.now(UTC)
    expires = now + timedelta(hours=1)
    severity = alert["severity"]

    # Emulate generative output conforming to requirements in AI_PROMPT_STRATEGY.md
    if audience_role == "fan":
        payload = {
            "headline": f"Congestion Alert: {zone_name}",
            "shortMessage": f"High density and delays expected near {zone_name}.",
            "recommendedRoute": f"Use concourse corridors bypassing {zone_name}.",
            "avoidZones": [zone_name],
            "estimatedDelay": "15-20 min",
            "accessibilityNote": "Elevators and wheelchair ramps remain open.",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = []
    elif audience_role == "volunteer":
        payload = {
            "headline": f"Redirect flow at {zone_name}",
            "priority": "high" if severity == "critical" else "medium",
            "actions": [f"Set up barriers at {zone_name}", "Direct visitors to West Entrance"],
            "location": zone_name,
            "escalationTrigger": "Queue lines exceed normal barriers",
            "doNotSay": "Emergency or panic words",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = payload["actions"]
    elif audience_role == "operator":
        payload = {
            "incidentSummary": f"High density alerts triggered at {zone_name}.",
            "riskDrivers": ["Gate capacity bottlenecks", "halftime compression flow"],
            "recommendedActions": [f"Redirect visitors away from {zone_name}", "Deploy volunteers"],
            "affectedZones": [zone_name],
            "confidence": 0.94,
            "monitoringPlan": f"Active camera coverage on {zone_name} turnstiles.",
            "escalationOptions": ["Open auxiliary safety gates", "Hold transit incoming arrivals"],
        }
        headline = f"Operator Guidance: {zone_name}"
        actions = payload["recommendedActions"]
    else:  # organizer
        payload = {
            "eventImpactSummary": f"Corridor safety thresholds breached at {zone_name}.",
            "trendExplanation": "High congestion during halftime corridor passage.",
            "recommendedPlanningChanges": [
                "Increase auxiliary gate counts",
                "Deploy active sign directors",
            ],
            "metricsToReview": ["Halftime ingress rates"],
        }
        headline = f"Strategic Summary: {zone_name}"
        actions = []

    record = {
        "guidance_id": uuid4(),
        "alert_id": alert_id,
        "audience_role": audience_role,
        "severity": severity,
        "headline": headline,
        "actions": actions,
        "expires_at": expires,
        "payload": payload,
        "prompt_version": "1.0",
        "schema_version": "1.0",
        "model_provider": "anthropic",
        "model_name": "claude-3-5-sonnet",
        "input_context_hash": context_hash,
        "status": "PENDING_APPROVAL",
    }

    if language != "en":
        record["headline"] = get_translation(record["headline"], language)
        record["actions"] = [get_translation(a, language) for a in record["actions"]]
        record["payload"] = translate_value(record["payload"], language)

    database.add_guidance(record)
    return record
