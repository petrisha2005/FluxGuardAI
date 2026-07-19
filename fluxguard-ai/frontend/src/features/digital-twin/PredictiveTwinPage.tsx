import { useSimulationState } from '@/features/simulation/simulationStore';
import { StadiumTwinView } from './StadiumTwinView';
import { ZoneHeatmap } from './ZoneHeatmap';
import { CrowdFlowVisualization } from './CrowdFlowVisualization';
import { IncidentOverlay } from './IncidentOverlay';
import { RiskForecastTimeline } from '../prediction/RiskForecastTimeline';
import { ScenarioSimulator } from '../prediction/ScenarioSimulator';
import { HistoricalInsightPanel } from '../prediction/HistoricalInsightPanel';
import { PredictionCard } from '../prediction/PredictionCard';
import { DashboardHeader } from '../dashboard/components/DashboardHeader';

export function PredictiveTwinPage() {
  const sim = useSimulationState();

  // Map store zones to digital twin zones format
  const mappedZones = sim.zones.map((z) => ({
    id: z.id,
    name: z.name,
    density: z.density,
    capacity: z.capacity,
    risk: z.risk,
  }));

  // Map store events to incident overlay items
  const mappedIncidents = sim.events.map((e) => ({
    id: e.id,
    type: e.title,
    zoneId: e.zoneId,
    severity: e.severity,
    description: e.description,
  }));

  // Calculate dynamic metrics for PredictionCards
  const highestDensity =
    mappedZones.length > 0 ? Math.max(...mappedZones.map((z) => z.density)) : 0;
  const staffRequired =
    mappedZones.length > 0
      ? mappedZones.reduce((acc, curr) => acc + (curr.density > 75 ? 22 : 8), 0)
      : 16;
  const avgIncidentProb =
    mappedZones.length > 0
      ? Math.round(
          mappedZones.reduce((acc, curr) => acc + curr.density * 0.8, 0) / mappedZones.length,
        )
      : 10;

  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* Primary KPI widgets grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <PredictionCard
          title="Peak Predictive Density"
          value={`${highestDensity}%`}
          horizon="+20 Mins"
          trend={highestDensity > 75 ? 'UP' : 'STABLE'}
        />
        <PredictionCard
          title="Optimal Staff Required"
          value={`${staffRequired} agents`}
          subValue="Allocated: 42"
          horizon="+40 Mins"
          trend="STABLE"
        />
        <PredictionCard
          title="Average Incident Probability"
          value={`${avgIncidentProb}%`}
          horizon="+10 Mins"
          trend={avgIncidentProb > 50 ? 'UP' : 'DOWN'}
        />
        <PredictionCard
          title="Egress Safety Status"
          value={sim.isEvacuationActive ? 'EVACUATING' : 'SECURE'}
          horizon="Current State"
          trend="STABLE"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Map twin and timelines */}
        <div className="md:col-span-8 space-y-6">
          <StadiumTwinView zones={mappedZones} />
          <RiskForecastTimeline />
        </div>

        {/* Right Column: Simulators and metrics */}
        <div className="md:col-span-4 space-y-6">
          <ScenarioSimulator />
          <ZoneHeatmap zones={mappedZones} />
          <CrowdFlowVisualization />
          <IncidentOverlay incidents={mappedIncidents} />
          <HistoricalInsightPanel />
        </div>
      </div>
    </div>
  );
}
