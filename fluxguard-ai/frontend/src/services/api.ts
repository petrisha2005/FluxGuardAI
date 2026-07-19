/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from './config';

export interface BackendEvent {
  id: string;
  name: string;
  description: string;
  status: string;
  startsAt: string;
  endsAt: string;
  venueId?: string;
}

export interface BackendVenue {
  id: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  metadata: {
    latitude?: number;
    longitude?: number;
    [key: string]: any;
  };
}

export interface BackendCamera {
  id: string;
  zoneId: string;
  name: string;
  fps: number;
  accuracy: number;
  status: string;
}

export interface BackendRoutingRecommendation {
  sourceZoneId: string;
  targetZoneId: string;
  reason: string;
  delayReductionMinutes: number;
  confidence: number;
  reliefTimeMinutes: number;
}

export interface BackendZone {
  id: string;
  eventId: string;
  name: string;
  type: string;
  capacity: number;
  parentZoneId: string | null;
  status: string;
}

export interface BackendPrediction {
  id: string;
  zoneId: string;
  horizonMinutes: number;
  predictedDensity: number;
  predictedQueueLength: number;
  predictedFlowRate: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
  generatedAt: string;
  modelVersion: string;
}

export interface BackendRiskScore {
  zoneId: string;
  riskScore: number;
  severity: string;
  drivers: string[];
  predictionHorizonMinutes: number;
  generatedAt: string;
}

export interface BackendAlert {
  id: string;
  zoneId: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  timestamp: string;
  assignee: string | null;
  notes: string | null;
}

export interface BackendGuidance {
  guidanceId: string;
  audienceRole: string;
  severity: string;
  headline: string;
  actions: string[];
  expiresAt: string;
  payload: Record<string, any>;
}

export interface BackendStaffingSuggestion {
  fromZoneId: string;
  toZoneId: string;
  count: number;
  reason: string;
}

export interface BackendStaffingStatus {
  currentStaff: Record<string, number>;
  recommendedStaff: Record<string, number>;
  suggestions: BackendStaffingSuggestion[];
  alerts?: string[];
}

export interface BackendIncident {
  id: string;
  eventId: string;
  zoneId: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  responderName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface BackendIntervention {
  id: string;
  eventId: string;
  zoneId: string;
  type: 'GUIDANCE' | 'STAFF' | 'INCIDENT';
  description: string;
  triggerTick: number;
  preDensity: number;
  preRisk: string;
  postDensity: number | null;
  postRisk: string | null;
  timestamp: string;
}

// Phase 9: Autonomous Operations
export interface AutonomousDecision {
  id: string;
  agent: string;
  action: string;
  target: string;
  confidence: number;
  reason: string;
  expectedImpact: string;
}

export interface ExecutionRecord {
  id: string;
  decisionId: string;
  actionType: string;
  target: string;
  timestamp: string;
  operator: string;
  result: string;
  impact: string;
}

export interface LearningRecord {
  action: string;
  outcome: string;
  effectivenessScore: number;
  historicalSuccessRate: string;
}

export interface VisionAssessResult {
  cameraId: string;
  zone: string;
  estimatedPeople: number;
  density: string;
  riskLevel: string;
  riskScore: number;
  abnormalMovementDetected: boolean;
  operationalRecommendation: string;
}

export type CopilotRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CopilotOperationalContext {
  zones: Array<{
    id: string;
    name: string;
    density: number;
    queueLength: number;
    entryRate: number;
    exitRate: number;
    risk: CopilotRiskLevel;
    lastUpdated: string;
  }>;
  riskAssessments: Array<{
    zoneId: string;
    risk: CopilotRiskLevel;
    reason: string;
    recommendation: string;
    timestamp: string;
  }>;
  events: Array<{
    id: string;
    zoneId: string;
    severity: CopilotRiskLevel;
    title: string;
    description: string;
    timestamp: string;
  }>;
  tick: number;
  lastUpdated: string;
  isEvacuationActive: boolean;
}

export interface CopilotChatRequest {
  message: string;
  venue: string;
  context: CopilotOperationalContext;
}

export interface CopilotChatResponse {
  answer: string;
  confidence: number;
  recommendations: string[];
  risk_level: CopilotRiskLevel;
  affected_zones: string[];
  recovery_time: string;
  priority: string;
  reasoning: string;
  impact: string;
}

export interface CopilotRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
}

let isRefreshing = false;

const mockDb: {
  decisions: AutonomousDecision[];
  executionHistory: ExecutionRecord[];
  incidents: BackendIncident[];
} = {
  decisions: [
    {
      id: 'mock-dec-1',
      agent: 'Crowd Safety Agent',
      action: 'Open Gate C Secondary exits',
      target: 'Gate C corridor',
      confidence: 94,
      reason:
        'Pedestrian arrival surge exceeding transit capacity by 45%. Delay to act results in flow lock.',
      expectedImpact: 'Queue time ↓ 25%, Density clearance in 9m.',
    },
    {
      id: 'mock-dec-2',
      agent: 'Transport Routing Agent',
      action: 'Delay Train Departures',
      target: 'Sector B platforms',
      confidence: 88,
      reason: 'Alleviate platform gridlock while gate capacity is fully saturated.',
      expectedImpact: 'Platform density ↓ 35% in 5m.',
    },
  ],
  executionHistory: [
    {
      id: 'hist-1',
      decisionId: 'mock-dec-prev',
      actionType: 'Divert flow to West Entrance',
      target: 'Main concourse junction',
      timestamp: '14:15:02',
      operator: 'OPS-Lead',
      result: 'Executed successfully',
      impact: 'Gate C queue reduction 15% achieved',
    },
  ],
  incidents: [
    {
      id: 'mock-inc-1',
      eventId: 'mock-event-id',
      zoneId: '00000000-0000-0000-0000-000000000003',
      type: 'Gate C Crowd Surge',
      severity: 'CRITICAL',
      status: 'PENDING',
      description: 'Incoming flow rate spike from transit trains. Heavy congestion.',
      responderName: null,
      createdAt: '14:24:02',
      resolvedAt: null,
    },
  ],
};

async function handleDemoRequest(path: string, options?: RequestInit): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (path === '/api/copilot/chat') {
    const body = typeof options?.body === 'string' ? JSON.parse(options.body) : {};
    const requestContext = body.context as CopilotOperationalContext | undefined;
    const zones = requestContext?.zones ?? [];
    const worstZone = [...zones].sort((a, b) => b.density - a.density)[0];
    return {
      answer: worstZone
        ? `Live simulation indicates ${worstZone.name} is the current focus zone at ${worstZone.density}% density. Redirecting arrivals toward lower-density gates is the safest immediate operator action.`
        : 'Telemetry is not available yet. Verify simulator state before issuing operational guidance.',
      confidence: worstZone ? 0.84 : 0.42,
      recommendations: worstZone
        ? [
            `Validate ${worstZone.name} queue conditions with the floor captain`,
            'Redirect incoming visitors to the lowest-density available entrance',
            'Keep signage changes pending operator confirmation',
          ]
        : ['Verify telemetry ingestion', 'Keep manual radio checks active'],
      risk_level: worstZone?.risk ?? 'MEDIUM',
      affected_zones: worstZone ? [worstZone.name] : [],
      recovery_time: worstZone && worstZone.density > 75 ? '10-18 minutes' : 'Monitor next update',
      priority: worstZone && worstZone.density > 75 ? 'ACTIVE_MITIGATION' : 'MONITOR',
      reasoning: worstZone
        ? `Derived from density=${worstZone.density}, queueLength=${worstZone.queueLength}, entryRate=${worstZone.entryRate}, exitRate=${worstZone.exitRate}.`
        : 'No zone context was provided.',
      impact: 'Improves operator situational awareness while preserving human approval.',
    } satisfies CopilotChatResponse;
  }

  if (path === '/api/v1/venues') {
    return [
      {
        id: 'mock-venue-id',
        name: 'Lucusa Stadium (Demo)',
        city: 'Lusaka',
        country: 'Zambia',
        timezone: 'Africa/Lusaka',
        metadata: { latitude: -15.3875, longitude: 28.3228 },
      },
    ];
  }

  if (path.includes('/events') && path.endsWith('/events')) {
    return [
      {
        id: 'mock-event-id',
        name: 'Lucusa Egress Simulation',
        description: 'Simulated operational demo event',
        status: 'ACTIVE',
        startsAt: new Date().toISOString(),
        endsAt: new Date().toISOString(),
        venueId: 'mock-venue-id',
      },
    ];
  }

  if (path.includes('/zones')) {
    return [
      {
        id: '00000000-0000-0000-0000-000000000001',
        eventId: 'mock-event-id',
        name: 'North Gate',
        type: 'ENTRY',
        capacity: 15000,
        parentZoneId: null,
        status: 'NORMAL',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        eventId: 'mock-event-id',
        name: 'East Concourse',
        type: 'CONCOURSE',
        capacity: 20000,
        parentZoneId: null,
        status: 'NORMAL',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        eventId: 'mock-event-id',
        name: 'Gate C',
        type: 'ENTRY',
        capacity: 10000,
        parentZoneId: null,
        status: 'STRESSED',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        eventId: 'mock-event-id',
        name: 'West Entrance',
        type: 'ENTRY',
        capacity: 15000,
        parentZoneId: null,
        status: 'NORMAL',
      },
    ];
  }

  if (path.includes('/risk-scores')) {
    return [
      {
        zoneId: '00000000-0000-0000-0000-000000000001',
        riskScore: 24,
        severity: 'LOW',
        drivers: [],
        predictionHorizonMinutes: 20,
        generatedAt: new Date().toISOString(),
      },
      {
        zoneId: '00000000-0000-0000-0000-000000000002',
        riskScore: 42,
        severity: 'MEDIUM',
        drivers: ['concourse_delay'],
        predictionHorizonMinutes: 20,
        generatedAt: new Date().toISOString(),
      },
      {
        zoneId: '00000000-0000-0000-0000-000000000003',
        riskScore: 86,
        severity: 'CRITICAL',
        drivers: ['pedestrian_surge', 'transit_delay'],
        predictionHorizonMinutes: 20,
        generatedAt: new Date().toISOString(),
      },
      {
        zoneId: '00000000-0000-0000-0000-000000000004',
        riskScore: 18,
        severity: 'LOW',
        drivers: [],
        predictionHorizonMinutes: 20,
        generatedAt: new Date().toISOString(),
      },
    ];
  }

  if (path.includes('/alerts')) {
    return [
      {
        id: 'mock-alert-1',
        zoneId: '00000000-0000-0000-0000-000000000003',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'Gate C Crowd Surge Threshold',
        description:
          'Density spike at 86% capacity triggers automatic flow redistribution directives.',
        timestamp: '14:24:02',
        assignee: null,
        notes: null,
      },
    ];
  }

  if (path.includes('/integrations')) {
    return {
      weather: {
        status: 'WARNING',
        exit_rate_modifier: 0.8,
        description: 'Heavy Rainfall Warning',
        temperature_celsius: 17,
      },
      transit: {
        status: 'SURGE',
        next_arrival: '3 mins',
        passenger_count: 450,
        description: 'Surge arrival at main metro platforms',
      },
      ticketScans: {
        total_scans_last_minute: 182,
        active_turnstiles: 12,
        average_scans_per_turnstile: 15.2,
        status: 'HIGH',
      },
    };
  }

  if (path.includes('/incidents')) {
    if (path.endsWith('/incidents')) {
      return mockDb.incidents;
    }
    if (path.includes('/dispatch')) {
      const parts = path.split('/');
      const incidentId = parts[parts.indexOf('incidents') + 1];
      const body = options?.body ? JSON.parse(options.body as string) : {};
      const inc = mockDb.incidents.find((i) => i.id === incidentId);
      if (inc) {
        inc.responderName = body.responderName || 'OPS-Lead';
        inc.status = 'DISPATCHED';
      }
      return inc;
    }
    if (path.includes('/resolve')) {
      const parts = path.split('/');
      const incidentId = parts[parts.indexOf('incidents') + 1];
      const inc = mockDb.incidents.find((i) => i.id === incidentId);
      if (inc) {
        inc.status = 'RESOLVED';
        inc.resolvedAt = new Date().toLocaleTimeString();
      }
      return inc;
    }
  }

  if (path === '/api/autonomous/decisions') {
    return mockDb.decisions;
  }

  if (path.includes('/decisions/') && path.endsWith('/approve')) {
    const parts = path.split('/');
    const decId = parts[parts.indexOf('decisions') + 1];
    const dec = mockDb.decisions.find((d) => d.id === decId);
    const body = options?.body ? JSON.parse(options.body as string) : {};
    if (dec) {
      mockDb.decisions = mockDb.decisions.filter((d) => d.id !== decId);
      const record = {
        id: `rec-${Date.now()}`,
        decisionId: dec.id,
        actionType: dec.action,
        target: dec.target,
        timestamp: new Date().toLocaleTimeString(),
        operator: body.operatorName || 'OPS-Lead',
        result: 'Executed successfully',
        impact: dec.expectedImpact,
      };
      mockDb.executionHistory.unshift(record);
      return record;
    }
  }

  if (path.includes('/decisions/') && path.endsWith('/reject')) {
    const parts = path.split('/');
    const decId = parts[parts.indexOf('decisions') + 1];
    mockDb.decisions = mockDb.decisions.filter((d) => d.id !== decId);
    return { status: 'OK', message: 'Rejected' };
  }

  if (path === '/api/autonomous/history') {
    return mockDb.executionHistory;
  }

  if (path === '/api/autonomous/learning') {
    return [
      {
        action: 'Gate C diversion route',
        outcome: 'Density drop 22%',
        effectivenessScore: 94,
        historicalSuccessRate: '92%',
      },
      {
        action: 'Platform egress delay',
        outcome: 'Departures spread',
        effectivenessScore: 86,
        historicalSuccessRate: '89%',
      },
    ];
  }

  if (path === '/api/autonomous/mode') {
    return { enabled: true };
  }

  if (path === '/api/vision/assess') {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    return {
      cameraId: body.cameraId || 'CAM-101',
      zone: body.zone || 'Gate A Ingress',
      estimatedPeople: body.estimatedPeople || 1200,
      density: body.density || 'MEDIUM',
      riskLevel: body.density === 'HIGH' ? 'CRITICAL' : 'SAFE',
      riskScore: body.density === 'HIGH' ? 88 : 34,
      abnormalMovementDetected: body.density === 'HIGH',
      operationalRecommendation:
        body.density === 'HIGH'
          ? 'Initiate queue load redistribution'
          : 'Normal surveillance monitoring',
    };
  }

  if (path.includes('/digital-twin/overview')) {
    return {
      stadiumCapacity: 85000,
      currentAttendance: 75200,
      densityPercent: 88,
      riskLevel: 'HIGH',
      activeIncidents: 1,
      gateStatus: 'Restricted',
      emergencyLevel: 'YELLOW',
      weather: {
        temp: 17.5,
        rain: '2.4mm',
        wind: '14km/h',
        visibility: '8km',
        description: 'Showers',
      },
    };
  }

  if (path.includes('/digital-twin/zones')) {
    return [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'North Stand',
        density: 65,
        capacity: 15000,
        risk: 65,
        status: 'MEDIUM',
        occupancy: 9750,
        queueLength: 8,
        riskScore: 65,
        openIncidents: 0,
        aiRecommendation: 'Stable crowd flow. No action required.',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'East Stand',
        density: 45,
        capacity: 18000,
        risk: 45,
        status: 'LOW',
        occupancy: 8100,
        queueLength: 0,
        riskScore: 45,
        openIncidents: 0,
        aiRecommendation: 'Stable crowd flow. No action required.',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Gate C',
        density: 86,
        capacity: 10000,
        risk: 86,
        status: 'CRITICAL',
        occupancy: 8600,
        queueLength: 28,
        riskScore: 86,
        openIncidents: 1,
        aiRecommendation: 'Open Gate C overflow corridors immediately to drain congestion.',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'West Stand',
        density: 55,
        capacity: 12000,
        risk: 55,
        status: 'LOW',
        occupancy: 6600,
        queueLength: 2,
        riskScore: 55,
        openIncidents: 0,
        aiRecommendation: 'Stable crowd flow. No action required.',
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'Concourse',
        density: 72,
        capacity: 20000,
        risk: 72,
        status: 'HIGH',
        occupancy: 14400,
        queueLength: 12,
        riskScore: 72,
        openIncidents: 0,
        aiRecommendation: 'Deploy 3 additional stewards to Concourse sectors.',
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        name: 'Parking Lot',
        density: 30,
        capacity: 10000,
        risk: 30,
        status: 'LOW',
        occupancy: 3000,
        queueLength: 0,
        riskScore: 30,
        openIncidents: 0,
        aiRecommendation: 'Stable conditions.',
      },
    ];
  }

  if (path.includes('/digital-twin/incidents')) {
    return [
      {
        id: 'dt-inc-1',
        type: 'CROWD_FLOW',
        zoneId: '00000000-0000-0000-0000-000000000003',
        zoneName: 'Gate C',
        severity: 'CRITICAL',
        description: 'Surge congestion at entry corridors.',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  if (path.includes('/digital-twin/heatmap')) {
    return [
      {
        zoneId: '00000000-0000-0000-0000-000000000001',
        zoneName: 'North Stand',
        density: 65,
        riskLevel: 'MEDIUM',
      },
      {
        zoneId: '00000000-0000-0000-0000-000000000002',
        zoneName: 'East Stand',
        density: 45,
        riskLevel: 'LOW',
      },
      {
        zoneId: '00000000-0000-0000-0000-000000000003',
        zoneName: 'Gate C',
        density: 86,
        riskLevel: 'CRITICAL',
      },
      {
        zoneId: '00000000-0000-0000-0000-000000000004',
        zoneName: 'West Stand',
        density: 55,
        riskLevel: 'LOW',
      },
      {
        zoneId: '00000000-0000-0000-0000-000000000005',
        zoneName: 'Concourse',
        density: 72,
        riskLevel: 'HIGH',
      },
    ];
  }

  if (path.includes('/digital-twin/cameras')) {
    return [
      {
        id: 'dt-cam-1',
        name: 'North Stand Upper - Cam 101',
        status: 'active',
        fps: 30,
        accuracy: 0.94,
        zoneId: '00000000-0000-0000-0000-000000000001',
      },
      {
        id: 'dt-cam-2',
        name: 'East Stand Gate E - Cam 102',
        status: 'active',
        fps: 24,
        accuracy: 0.96,
        zoneId: '00000000-0000-0000-0000-000000000002',
      },
      {
        id: 'dt-cam-3',
        name: 'Gate C Turnstiles - Cam 103',
        status: 'active',
        fps: 30,
        accuracy: 0.95,
        zoneId: '00000000-0000-0000-0000-000000000003',
      },
      {
        id: 'dt-cam-4',
        name: 'West Stand Egress - Cam 104',
        status: 'active',
        fps: 24,
        accuracy: 0.92,
        zoneId: '00000000-0000-0000-0000-000000000004',
      },
    ];
  }

  if (path.includes('/digital-twin/crowd-flow')) {
    return [
      {
        sourceZoneId: '00000000-0000-0000-0000-000000000003',
        sourceZoneName: 'Gate C',
        targetZoneId: '00000000-0000-0000-0000-000000000005',
        targetZoneName: 'Concourse',
        flowRate: 120,
        velocity: 0.8,
        status: 'SLOWED',
      },
      {
        sourceZoneId: '00000000-0000-0000-0000-000000000001',
        sourceZoneName: 'North Stand',
        targetZoneId: '00000000-0000-0000-0000-000000000005',
        targetZoneName: 'Concourse',
        flowRate: 75,
        velocity: 1.6,
        status: 'NORMAL',
      },
      {
        sourceZoneId: '00000000-0000-0000-0000-000000000004',
        sourceZoneName: 'West Stand',
        targetZoneId: '00000000-0000-0000-0000-000000000005',
        targetZoneName: 'Concourse',
        flowRate: 60,
        velocity: 1.8,
        status: 'NORMAL',
      },
    ];
  }

  if (path.includes('/digital-twin/live')) {
    return [
      {
        timestamp: '14:24:02',
        message: 'Surge congestion at Gate C turnstiles - 86% density.',
        severity: 'CRITICAL',
      },
      {
        timestamp: '14:23:15',
        message: 'Medical coordinate dispatch to North Stand row 12.',
        severity: 'MEDIUM',
      },
      {
        timestamp: '14:21:40',
        message: 'AI recommends redirecting inflow to West Stand gates.',
        severity: 'HIGH',
      },
      {
        timestamp: '14:18:00',
        message: 'Transit line delays: train arrivals frequency drop (12 mins).',
        severity: 'LOW',
      },
    ];
  }

  return undefined;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isDemo = localStorage.getItem('fluxguard_demo_mode') === 'true';
  if (isDemo) {
    const intercepted = await handleDemoRequest(path, options);
    if (intercepted !== undefined) {
      return intercepted as T;
    }
  }

  const accessToken = localStorage.getItem('fluxguard_access_token');
  const authHeader = accessToken ? `Bearer ${accessToken}` : 'Bearer mock-operator';

  const url = `${config.apiBaseUrl}${path}`;
  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      ...options?.headers,
    },
  });

  if (response.status === 401 && !isRefreshing) {
    const refreshToken = localStorage.getItem('fluxguard_refresh_token');
    if (refreshToken) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${config.apiBaseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const session = await refreshResponse.json();
          localStorage.setItem('fluxguard_access_token', session.access_token);
          localStorage.setItem('fluxguard_refresh_token', session.refresh_token);

          // Retry request with new token
          response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              ...options?.headers,
            },
          });
        } else {
          // Refresh failed
          localStorage.removeItem('fluxguard_access_token');
          localStorage.removeItem('fluxguard_refresh_token');
          window.dispatchEvent(new Event('fluxguard-logout'));
        }
      } catch (err) {
        console.error('Interceptor failed to refresh session:', err);
        localStorage.removeItem('fluxguard_access_token');
        localStorage.removeItem('fluxguard_refresh_token');
        window.dispatchEvent(new Event('fluxguard-logout'));
      } finally {
        isRefreshing = false;
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (errorData as any)?.detail?.error?.message ||
      (errorData as any)?.detail ||
      `HTTP error! status: ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  const envelope = await response.json();
  return envelope.data as T;
}

function validateCopilotResponse(payload: unknown): CopilotChatResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Copilot returned an invalid response.');
  }

  const record = payload as Record<string, unknown>;
  const riskLevel = record.risk_level;
  const recommendations = record.recommendations;

  if (
    typeof record.answer !== 'string' ||
    !record.answer.trim() ||
    typeof record.confidence !== 'number' ||
    !Array.isArray(recommendations) ||
    !recommendations.every((item) => typeof item === 'string') ||
    !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(riskLevel))
  ) {
    throw new Error('Copilot response failed validation.');
  }

  return {
    answer: record.answer,
    confidence: Math.max(0, Math.min(1, record.confidence)),
    recommendations,
    risk_level: riskLevel as CopilotRiskLevel,
    affected_zones: Array.isArray(record.affected_zones)
      ? record.affected_zones.filter((item): item is string => typeof item === 'string')
      : [],
    recovery_time:
      typeof record.recovery_time === 'string' ? record.recovery_time : 'Monitor next update',
    priority: typeof record.priority === 'string' ? record.priority : 'MONITOR',
    reasoning:
      typeof record.reasoning === 'string' ? record.reasoning : 'Derived from operational context.',
    impact: typeof record.impact === 'string' ? record.impact : 'Improves situational awareness.',
  };
}

async function submitCommandCenterCopilotMessage(
  payload: CopilotChatRequest,
  options: CopilotRequestOptions = {},
): Promise<CopilotChatResponse> {
  const isDemo = localStorage.getItem('fluxguard_demo_mode') === 'true';
  const path = '/api/copilot/chat';
  if (isDemo) {
    const intercepted = await handleDemoRequest(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (intercepted !== undefined) {
      return validateCopilotResponse(intercepted);
    }
  }

  const timeoutMs = options.timeoutMs ?? 12_000;
  const retries = options.retries ?? 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const accessToken = localStorage.getItem('fluxguard_access_token');
      const authHeader = accessToken ? `Bearer ${accessToken}` : 'Bearer mock-operator';
      const response = await fetch(`${config.apiBaseUrl}${path}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const detail = errorData.detail;
        throw new Error(
          typeof detail === 'string' ? detail : `Copilot request failed (${response.status}).`,
        );
      }

      return validateCopilotResponse(await response.json());
    } catch (error) {
      lastError = error;
      if (
        options.signal?.aborted ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        throw error;
      }
    } finally {
      window.clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', onAbort);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Copilot request failed. Please try again.');
}

export const api = {
  fetchVenues: () => request<BackendVenue[]>('/api/v1/venues'),

  fetchEventsByVenue: (venueId: string) =>
    request<BackendEvent[]>(`/api/v1/venues/${venueId}/events`),

  fetchEvents: () => request<BackendEvent[]>('/api/v1/events'),

  fetchZones: (eventId: string) => request<BackendZone[]>(`/api/v1/events/${eventId}/zones`),

  fetchCameras: (eventId: string) => request<BackendCamera[]>(`/api/v1/events/${eventId}/cameras`),

  fetchRoutingRecommendations: (eventId: string) =>
    request<BackendRoutingRecommendation[]>(`/api/v1/events/${eventId}/routing-recommendations`),

  runPredictionsCycle: (eventId: string) =>
    request<BackendPrediction[]>(`/api/v1/events/${eventId}/predictions/run`, {
      method: 'POST',
    }),

  postMeasurement: (eventId: string, measurement: Record<string, any>) =>
    request<unknown>(`/api/v1/events/${eventId}/measurements`, {
      method: 'POST',
      body: JSON.stringify(measurement),
    }),

  fetchRiskScores: (eventId: string) =>
    request<BackendRiskScore[]>(`/api/v1/events/${eventId}/risk-scores`),

  fetchAlerts: (eventId: string) => request<BackendAlert[]>(`/api/v1/events/${eventId}/alerts`),

  acknowledgeAlert: (eventId: string, alertId: string, assignee: string) =>
    request<BackendAlert>(`/api/v1/events/${eventId}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ assignee }),
    }),

  resolveAlert: (eventId: string, alertId: string, notes: string) =>
    request<BackendAlert>(`/api/v1/events/${eventId}/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  generateGuidance: (eventId: string, alertId: string, audienceRole: string, language = 'en') =>
    request<BackendGuidance>(`/api/v1/events/${eventId}/guidance/generate`, {
      method: 'POST',
      body: JSON.stringify({ alertId, audienceRole, language }),
    }),

  submitFeedback: (eventId: string, zoneId: string, rating: number, comment: string) =>
    request<unknown>(`/api/v1/events/${eventId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ zoneId, rating, comment }),
    }),

  getWebSocketUrl: (eventId: string): string => {
    const baseUrl = config.apiBaseUrl;
    const wsProto = baseUrl.startsWith('https:') ? 'wss:' : 'ws:';
    const host = baseUrl.replace(/^https?:\/\//, '');
    return `${wsProto}//${host}/ws/events/${eventId}`;
  },

  fetchIntegrationsStatus: (eventId: string) =>
    request<{
      weather: {
        status: string;
        exit_rate_modifier: number;
        description: string;
        temperature_celsius: number;
      };
      transit: {
        status: string;
        next_arrival: string;
        passenger_count: number;
        description: string;
      };
      ticketScans: {
        total_scans_last_minute: number;
        active_turnstiles: number;
        average_scans_per_turnstile: number;
        status: string;
      };
    }>(`/api/v1/events/${eventId}/integrations`),

  submitCopilotMessage: (eventId: string, message: string) =>
    request<{
      response: string;
      suggested_actions: string[];
    }>(`/api/v1/events/${eventId}/copilot/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  submitCommandCenterCopilotMessage,

  approveGuidance: (eventId: string, guidanceId: string) =>
    request<{
      guidanceId: string;
      status: string;
    }>(`/api/v1/events/${eventId}/guidance/${guidanceId}/approve`, {
      method: 'POST',
    }),

  rejectGuidance: (eventId: string, guidanceId: string) =>
    request<{
      guidanceId: string;
      status: string;
    }>(`/api/v1/events/${eventId}/guidance/${guidanceId}/reject`, {
      method: 'POST',
    }),

  getActiveGuidance: (eventId: string) =>
    request<
      {
        guidanceId: string;
        alertId: string;
        audienceRole: string;
        severity: string;
        headline: string;
        actions: string[];
        expiresAt: string;
        payload: any;
        status: string;
      }[]
    >(`/api/v1/events/${eventId}/guidance/active`),

  getStaffingStatus: (eventId: string) =>
    request<BackendStaffingStatus>(`/api/v1/events/${eventId}/staffing`),

  redeployStaff: (eventId: string, fromZoneId: string, toZoneId: string, count: number) =>
    request<{
      status: string;
      currentStaff: Record<string, number>;
    }>(`/api/v1/events/${eventId}/staffing/redeploy`, {
      method: 'POST',
      body: JSON.stringify({ fromZoneId, toZoneId, count }),
    }),

  fetchIncidents: (eventId: string) =>
    request<BackendIncident[]>(`/api/v1/events/${eventId}/incidents`),

  createIncident: (
    eventId: string,
    zoneId: string,
    type: string,
    severity: string,
    description: string,
  ) =>
    request<BackendIncident>(`/api/v1/events/${eventId}/incidents`, {
      method: 'POST',
      body: JSON.stringify({ zoneId, type, severity, description }),
    }),

  dispatchResponder: (eventId: string, incidentId: string, responderName: string) =>
    request<BackendIncident>(`/api/v1/events/${eventId}/incidents/${incidentId}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({ responderName }),
    }),

  resolveIncident: (eventId: string, incidentId: string) =>
    request<BackendIncident>(`/api/v1/events/${eventId}/incidents/${incidentId}/resolve`, {
      method: 'POST',
    }),

  fetchInterventions: (eventId: string) =>
    request<BackendIntervention[]>(`/api/v1/events/${eventId}/analytics/interventions`),

  // Phase 9: Autonomous Operations
  fetchPendingDecisions: () => request<AutonomousDecision[]>('/api/autonomous/decisions'),

  approveDecision: (decisionId: string, operatorName: string) =>
    request<ExecutionRecord>(`/api/autonomous/decisions/${decisionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ operatorName }),
    }),

  rejectDecision: (decisionId: string) =>
    request<{ status: string; message: string }>(`/api/autonomous/decisions/${decisionId}/reject`, {
      method: 'POST',
    }),

  fetchExecutionHistory: () => request<ExecutionRecord[]>('/api/autonomous/history'),

  fetchLearningRecords: () => request<LearningRecord[]>('/api/autonomous/learning'),

  assessCameraFeed: (payload: {
    cameraId: string;
    zone: string;
    estimatedPeople: number;
    density: string;
  }) =>
    request<VisionAssessResult>('/api/vision/assess', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  fetchAutonomousMode: () => request<{ enabled: boolean }>('/api/autonomous/mode'),

  toggleAutonomousMode: (enabled: boolean) =>
    request<{ enabled: boolean }>('/api/autonomous/mode', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  fetchDigitalTwinOverview: (eventId?: string) =>
    request<any>(
      eventId
        ? `/api/v1/digital-twin/overview?eventId=${eventId}`
        : '/api/v1/digital-twin/overview',
    ),

  fetchDigitalTwinZones: (eventId?: string) =>
    request<any[]>(
      eventId ? `/api/v1/digital-twin/zones?eventId=${eventId}` : '/api/v1/digital-twin/zones',
    ),

  fetchDigitalTwinIncidents: (eventId?: string) =>
    request<any[]>(
      eventId
        ? `/api/v1/digital-twin/incidents?eventId=${eventId}`
        : '/api/v1/digital-twin/incidents',
    ),

  fetchDigitalTwinHeatmap: (eventId?: string) =>
    request<any[]>(
      eventId ? `/api/v1/digital-twin/heatmap?eventId=${eventId}` : '/api/v1/digital-twin/heatmap',
    ),

  fetchDigitalTwinCameras: (eventId?: string) =>
    request<any[]>(
      eventId ? `/api/v1/digital-twin/cameras?eventId=${eventId}` : '/api/v1/digital-twin/cameras',
    ),

  fetchDigitalTwinCrowdFlow: (eventId?: string) =>
    request<any[]>(
      eventId
        ? `/api/v1/digital-twin/crowd-flow?eventId=${eventId}`
        : '/api/v1/digital-twin/crowd-flow',
    ),

  fetchDigitalTwinLiveFeed: (eventId?: string) =>
    request<any[]>(
      eventId ? `/api/v1/digital-twin/live?eventId=${eventId}` : '/api/v1/digital-twin/live',
    ),
};
