import { lazy, Suspense, useEffect } from 'react';

import { Panel, Skeleton } from '@/components/ui';
import type { AlertSeverity, CrowdRiskState } from '@/components/ui';
import { startSimulation, useSimulationState } from '@/features/simulation/simulationStore';
import type {
  CrowdZone,
  RiskAssessment,
  RiskLevel,
  SimulationEvent,
  SimulationState,
} from '@/features/simulation/simulationTypes';
import { CrowdZonePanel } from './components/CrowdZonePanel';
import { DashboardHeader } from './components/DashboardHeader';
import { FeedbackPanel } from './components/FeedbackPanel';
import { GuidancePanel } from './components/GuidancePanel';
import { LiveEventFeed } from './components/LiveEventFeed';
import { RiskOverview } from './components/RiskOverview';
import type {
  DashboardSummary,
  EventFeedItem,
  GuidanceRecommendation,
  PredictionPoint,
  StadiumZone,
  ZoneTrend,
} from './types/dashboard';

const PredictionTimeline = lazy(() =>
  import('./components/PredictionTimeline').then((module) => ({
    default: module.PredictionTimeline,
  })),
);

function PredictionTimelineFallback() {
  return (
    <Panel
      eyebrow="Predictive analytics"
      title="Density forecast timeline"
      aria-label="Prediction timeline loading"
    >
      <Skeleton label="Loading prediction timeline" className="h-72" />
    </Panel>
  );
}

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
  const highestAssessment = assessments.reduce((highest, assessment) =>
    riskToSeverity[assessment.risk] === 'critical' ||
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
    confidence: Math.min(96, 72 + tick + riskToSeverity[highestAssessment.risk].length),
    risk: highestAssessment.risk,
  };
}

function toEventFeedItems(events: SimulationEvent[]): EventFeedItem[] {
  return events.map((event) => ({
    id: event.id,
    severity: riskToSeverity[event.severity],
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

  useEffect(() => startSimulation(), []);

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <RiskOverview summary={dashboardState.summary} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <CrowdZonePanel zones={dashboardState.zones} />
        <GuidancePanel guidance={dashboardState.guidance} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Suspense fallback={<PredictionTimelineFallback />}>
          <PredictionTimeline predictions={dashboardState.predictions} />
        </Suspense>
        <div className="space-y-6">
          <LiveEventFeed items={dashboardState.events} />
          <FeedbackPanel />
        </div>
      </div>
    </div>
  );
}
