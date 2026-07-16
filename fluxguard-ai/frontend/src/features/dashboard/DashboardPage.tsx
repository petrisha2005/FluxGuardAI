import { useState } from 'react';
import { useSimulationState } from '@/features/simulation/simulationStore';
import type {
  CrowdZone,
  RiskLevel,
  SimulationState,
  RiskAssessment,
  SimulationEvent,
} from '@/features/simulation/simulationTypes';
import { CrowdZonePanel } from './components/CrowdZonePanel';
import { DashboardHeader } from './components/DashboardHeader';
import { RiskOverview } from './components/RiskOverview';
import { FlowVisualizer } from './components/FlowVisualizer';
import { CctvFeedGrid } from './components/CctvFeedGrid';
import { CrowdRoutingPanel } from './components/CrowdRoutingPanel';
import { EvacuationControlPanel } from './components/EvacuationControlPanel';
import type {
  DashboardSummary,
  StadiumZone,
  ZoneTrend,
  PredictionPoint,
  GuidanceRecommendation,
  EventFeedItem,
} from './types/dashboard';

import type { AlertSeverity, CrowdRiskState } from '@/components/ui';

const riskToCrowdState: Record<RiskLevel, CrowdRiskState> = {
  LOW: 'green',
  MEDIUM: 'amber',
  HIGH: 'amber',
  CRITICAL: 'red',
};

const riskToSeverity: Record<RiskLevel, AlertSeverity> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'warning',
  CRITICAL: 'critical',
};

function getZoneTrend(zone: CrowdZone): ZoneTrend {
  const flowDelta = zone.entryRate - zone.exitRate;

  if (flowDelta > 6) {
    return 'rising';
  }

  if (flowDelta < -6) {
    return 'falling';
  }

  return 'stable';
}

function toDashboardZones(zones: CrowdZone[]): StadiumZone[] {
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    densityPercentage: zone.density,
    queueLength: zone.queueLength,
    entryRate: zone.entryRate,
    exitRate: zone.exitRate,
    riskState: riskToCrowdState[zone.risk],
    riskLevel: zone.risk,
    trend: getZoneTrend(zone),
    lastUpdated: zone.lastUpdated,
  }));
}

function getDashboardSummary(zones: CrowdZone[]): DashboardSummary {
  const highestDensityZone = zones.reduce((highest, zone) =>
    zone.density > highest.density ? zone : highest,
  );
  const maxQueueLength = Math.max(...zones.map((zone) => zone.queueLength));

  return {
    activeZones: zones.length,
    highestDensity: highestDensityZone.density,
    highestDensityZone: highestDensityZone.name,
    elevatedRiskZones: zones.filter((zone) => zone.risk !== 'LOW').length,
    expectedDelayMinutes: Math.max(4, Math.ceil(maxQueueLength / 18)),
  };
}

function getPredictionData(zones: CrowdZone[]): PredictionPoint[] {
  const averageDensity = Math.round(
    zones.reduce((total, zone) => total + zone.density, 0) / zones.length,
  );
  const averagePressure = zones.reduce((total, zone) => total + zone.entryRate - zone.exitRate, 0);
  const projectedTwenty = Math.min(
    100,
    Math.max(0, Math.round(averageDensity + averagePressure * 0.18)),
  );
  const projectedForty = Math.min(
    100,
    Math.max(0, Math.round(averageDensity + averagePressure * 0.32)),
  );

  return [
    {
      label: 'Current',
      density: averageDensity,
      forecast: averageDensity,
    },
    {
      label: '20 min',
      density: averageDensity,
      forecast: projectedTwenty,
    },
    {
      label: '40 min',
      density: averageDensity,
      forecast: projectedForty,
    },
  ];
}

function getGuidance(
  assessments: RiskAssessment[],
  zones: CrowdZone[],
  tick: number,
): GuidanceRecommendation {
  if (assessments.length === 0) {
    return {
      id: `guidance-empty`,
      message: 'Stadium operations are within safe parameters. No high risk hotspots detected.',
      recommendedActions: ['Continue routine entry/exit monitoring.'],
      confidence: 100,
      risk: 'LOW',
    };
  }

  const highestAssessment = assessments.reduce((highest, assessment) =>
    riskToSeverity[assessment.risk as RiskLevel] === 'critical' ||
    (assessment.risk === 'HIGH' && highest.risk !== 'CRITICAL') ||
    (assessment.risk === 'MEDIUM' && highest.risk === 'LOW')
      ? assessment
      : highest,
  );
  const zone = zones.find((candidate) => candidate.id === highestAssessment.zoneId);

  return {
    id: `guidance-${tick}-${highestAssessment.zoneId}`,
    message: highestAssessment.reason,
    recommendedActions: [
      highestAssessment.recommendation,
      zone ? `Balance entry and exit flow for ${zone.name}.` : 'Maintain active zone monitoring.',
      'Reassess zone posture on the next simulation interval.',
    ],
    confidence: Math.min(
      96,
      72 + tick + (riskToSeverity[highestAssessment.risk as RiskLevel] || 'info').length,
    ),
    risk: highestAssessment.risk as RiskLevel,
  };
}

function toEventFeedItems(events: SimulationEvent[]): EventFeedItem[] {
  return events.map((event) => ({
    id: event.id,
    severity: riskToSeverity[event.severity as RiskLevel] || 'info',
    title: event.title,
    description: event.description,
    timestamp: event.timestamp,
  }));
}

function selectDashboardState(state: SimulationState) {
  return {
    zones: toDashboardZones(state.zones),
    summary: getDashboardSummary(state.zones),
    predictions: getPredictionData(state.zones),
    guidance: getGuidance(state.riskAssessments, state.zones, state.tick),
    events: toEventFeedItems(state.events),
  };
}

export function DashboardPage() {
  const simulationState = useSimulationState();
  const dashboardState = selectDashboardState(simulationState);
  const [activeTab, setActiveTab] = useState<'zones' | 'flow' | 'cctv'>('zones');

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <RiskOverview summary={dashboardState.summary} />
      <CrowdRoutingPanel />
      <EvacuationControlPanel />
      
      {/* Tab select controller */}
      <div className="border-b border-white/10 flex gap-6 pb-px">
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'zones'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Zone Performance Details
        </button>
        <button
          onClick={() => setActiveTab('flow')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'flow'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Digital Twin Flow Visualizer
        </button>
        <button
          onClick={() => setActiveTab('cctv')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'cctv'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          CCTV Video Feeds
        </button>
      </div>

      {activeTab === 'zones' ? (
        <CrowdZonePanel zones={dashboardState.zones} />
      ) : activeTab === 'flow' ? (
        <FlowVisualizer />
      ) : (
        <CctvFeedGrid />
      )}
    </div>
  );
}
