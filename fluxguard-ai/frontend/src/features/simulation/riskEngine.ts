import type { CrowdZone, RiskAssessment, RiskLevel } from './simulationTypes';

export function calculateRiskLevel(zone: Pick<CrowdZone, 'density' | 'queueLength'>): RiskLevel {
  if (zone.density > 90 || zone.queueLength > 350) {
    return 'CRITICAL';
  }

  if (zone.density > 75 || zone.queueLength > 200) {
    return 'HIGH';
  }

  if (zone.density > 50) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function getRiskReason(zone: CrowdZone, risk: RiskLevel): string {
  if (risk === 'CRITICAL') {
    return zone.exitRate < zone.entryRate
      ? 'Crowd density is critical while exit flow is reduced'
      : 'Queue length or density has crossed a critical threshold';
  }

  if (risk === 'HIGH') {
    return zone.exitRate < zone.entryRate
      ? 'Crowd density increasing with reduced exit flow'
      : 'Crowd load is elevated and approaching capacity limits';
  }

  if (risk === 'MEDIUM') {
    return 'Crowd density is above normal operating range';
  }

  return 'Crowd flow remains within normal operating range';
}

function getRecommendation(zone: CrowdZone, risk: RiskLevel): string {
  if (risk === 'CRITICAL') {
    return `Hold incoming flow and redirect visitors away from ${zone.name}`;
  }

  if (risk === 'HIGH') {
    return `Redirect incoming visitors to lower-density zones near ${zone.name}`;
  }

  if (risk === 'MEDIUM') {
    return `Monitor ${zone.name} and prepare volunteer support if density continues rising`;
  }

  return `Maintain normal monitoring for ${zone.name}`;
}

export function assessZoneRisk(zone: CrowdZone, timestamp = zone.lastUpdated): RiskAssessment {
  const risk = calculateRiskLevel(zone);

  return {
    zoneId: zone.id,
    risk,
    reason: getRiskReason(zone, risk),
    recommendation: getRecommendation(zone, risk),
    timestamp,
  };
}

export function assessCrowdRisks(zones: CrowdZone[], timestamp: string): RiskAssessment[] {
  return zones.map((zone) => assessZoneRisk(zone, timestamp));
}
