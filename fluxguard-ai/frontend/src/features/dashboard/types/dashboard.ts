import type { AlertSeverity, CrowdRiskState } from '@/components/ui';
import type { RiskLevel } from '@/features/simulation/simulationTypes';

export type ZoneTrend = 'rising' | 'stable' | 'falling';

export interface StadiumZone {
  id: string;
  name: string;
  densityPercentage: number;
  queueLength: number;
  entryRate: number;
  exitRate: number;
  riskState: CrowdRiskState;
  riskLevel: RiskLevel;
  trend: ZoneTrend;
  lastUpdated: string;
}

export interface PredictionPoint {
  label: 'Current' | '20 min' | '40 min';
  density: number;
  forecast: number;
  confidenceLow?: number;
  confidenceHigh?: number;
}

export interface GuidanceRecommendation {
  id: string;
  message: string;
  recommendedActions: string[];
  confidence: number;
  risk: RiskLevel;
  status?: string;
  headline?: string;
}

export interface EventFeedItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardSummary {
  activeZones: number;
  highestDensity: number;
  highestDensityZone: string;
  elevatedRiskZones: number;
  expectedDelayMinutes: number;
}
