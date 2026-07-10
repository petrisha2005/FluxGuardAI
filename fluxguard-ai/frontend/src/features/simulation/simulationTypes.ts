export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CrowdZone {
  id: string;
  name: string;
  density: number;
  queueLength: number;
  entryRate: number;
  exitRate: number;
  risk: RiskLevel;
  lastUpdated: string;
}

export interface RiskAssessment {
  zoneId: string;
  risk: RiskLevel;
  reason: string;
  recommendation: string;
  timestamp: string;
}

export interface SimulationEvent {
  id: string;
  zoneId: string;
  severity: RiskLevel;
  title: string;
  description: string;
  timestamp: string;
}

export interface SimulationState {
  zones: CrowdZone[];
  riskAssessments: RiskAssessment[];
  events: SimulationEvent[];
  tick: number;
  lastUpdated: string;
}
