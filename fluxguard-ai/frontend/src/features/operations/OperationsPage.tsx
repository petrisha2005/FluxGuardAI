import { useState } from 'react';
import { DashboardHeader } from '../dashboard/components/DashboardHeader';
import { GuidancePanel } from '../dashboard/components/GuidancePanel';
import { LiveEventFeed } from '../dashboard/components/LiveEventFeed';
import { FeedbackPanel } from '../dashboard/components/FeedbackPanel';
import { StaffingPanel } from './components/StaffingPanel';
import { IncidentConsole } from './components/IncidentConsole';
import { useSimulationState } from '@/features/simulation/simulationStore';
import type {
  RiskAssessment,
  CrowdZone,
  SimulationEvent,
  RiskLevel,
} from '@/features/simulation/simulationTypes';
import type {
  AlertSeverity,
  GuidanceRecommendation,
  EventFeedItem,
} from '../dashboard/types/dashboard';
import { api } from '@/services/api';

const EVENT_ID = 'e0000000-0000-0000-0000-000000000000';

const riskToSeverity: Record<RiskLevel, AlertSeverity> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'critical',
};

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

export function OperationsPage() {
  const state = useSimulationState();
  const rawGuidance = getGuidance(state.riskAssessments, state.zones, state.tick);
  const events = toEventFeedItems(state.events);

  const [approvedStatus, setApprovedStatus] = useState<Record<string, string>>({});

  const guidanceId = rawGuidance.id;
  const currentStatus = approvedStatus[guidanceId] || 'PENDING_APPROVAL';

  const guidance = {
    ...rawGuidance,
    status: currentStatus,
  };

  const handleApprove = async () => {
    try {
      await api.approveGuidance(EVENT_ID, guidanceId);
      setApprovedStatus((prev) => ({ ...prev, [guidanceId]: 'APPROVED' }));
    } catch (err) {
      console.error('Failed to approve safety guidance message', err);
    }
  };

  const handleReject = async () => {
    try {
      await api.rejectGuidance(EVENT_ID, guidanceId);
      setApprovedStatus((prev) => ({ ...prev, [guidanceId]: 'REJECTED' }));
    } catch (err) {
      console.error('Failed to reject/archive safety guidance message', err);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        {/* Left Column: Log of events (Live log) & Incident dispatch */}
        <div className="space-y-6">
          <LiveEventFeed items={events} />
          <IncidentConsole />
        </div>

        {/* Right Column: Directives actions & Reports feedback forms */}
        <div className="space-y-6">
          <GuidancePanel guidance={guidance} onApprove={handleApprove} onReject={handleReject} />
          <StaffingPanel />
          <FeedbackPanel />
        </div>
      </div>
    </div>
  );
}
