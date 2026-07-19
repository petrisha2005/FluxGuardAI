/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { vi } from 'vitest';

export const mockBackendEvent = {
  id: 'e0000000-0000-0000-0000-000000000000',
  name: 'FIFA World Cup 2026 - Opening Match',
  description: 'Opening match at the stadium',
  status: 'active',
  startsAt: '2026-06-11T18:00:00Z',
  endsAt: '2026-06-11T22:00:00Z',
};

export const mockBackendVenue = {
  id: 'b0000000-0000-0000-0000-000000000000',
  name: 'Lucusa Stadium',
  city: 'Lucusa',
  country: 'Lusaka',
  timezone: 'UTC',
  metadata: { latitude: -15.4167, longitude: 28.2833 },
};

export const mockBackendCamera = {
  id: 'c0000000-0000-0000-0000-000000000001',
  zoneId: '00000000-0000-0000-0000-000000000001',
  name: 'North Entrance Turnstiles - Cam 1',
  fps: 30,
  accuracy: 0.94,
  status: 'active',
};

export const mockBackendRoutingRecommendation = {
  sourceZoneId: '00000000-0000-0000-0000-000000000003',
  targetZoneId: '00000000-0000-0000-0000-000000000004',
  reason:
    'High queue backlog detected at Gate C. Reroute incoming flow to West Entrance to optimize clearance times.',
  delayReductionMinutes: 12,
  confidence: 0.94,
  reliefTimeMinutes: 8,
};

export const mockBackendZones = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    eventId: 'e0000000-0000-0000-0000-000000000000',
    name: 'North Gate',
    type: 'gate',
    capacity: 2000,
    parentZoneId: null,
    status: 'open',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    eventId: 'e0000000-0000-0000-0000-000000000000',
    name: 'East Concourse',
    type: 'concourse',
    capacity: 5000,
    parentZoneId: null,
    status: 'open',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    eventId: 'e0000000-0000-0000-0000-000000000000',
    name: 'Gate C',
    type: 'gate',
    capacity: 1500,
    parentZoneId: null,
    status: 'open',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    eventId: 'e0000000-0000-0000-0000-000000000000',
    name: 'West Entrance',
    type: 'gate',
    capacity: 1800,
    parentZoneId: null,
    status: 'open',
  },
];

export const mockBackendRiskScores = [
  {
    zoneId: '00000000-0000-0000-0000-000000000001',
    riskScore: 35,
    severity: 'low',
    drivers: ['Normal crowd flow baseline'],
    predictionHorizonMinutes: 20,
    generatedAt: new Date().toISOString(),
  },
  {
    zoneId: '00000000-0000-0000-0000-000000000002',
    riskScore: 45,
    severity: 'medium',
    drivers: ['Moderate crowd accumulation'],
    predictionHorizonMinutes: 20,
    generatedAt: new Date().toISOString(),
  },
  {
    zoneId: '00000000-0000-0000-0000-000000000003',
    riskScore: 78,
    severity: 'high',
    drivers: ['Elevated crowd density forecast', 'Extended queue lengths detected'],
    predictionHorizonMinutes: 20,
    generatedAt: new Date().toISOString(),
  },
  {
    zoneId: '00000000-0000-0000-0000-000000000004',
    riskScore: 25,
    severity: 'low',
    drivers: ['Normal crowd flow baseline'],
    predictionHorizonMinutes: 20,
    generatedAt: new Date().toISOString(),
  },
];

export const mockBackendAlerts = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    zoneId: '00000000-0000-0000-0000-000000000003',
    severity: 'high',
    status: 'unacknowledged',
    title: 'Gate C congestion forecast',
    description:
      'Elevated crowd density forecast. Redirect incoming visitors to lower-density zones.',
    timestamp: new Date().toISOString(),
    assignee: null,
    notes: null,
  },
];

export const mockBackendGuidance = {
  guidanceId: 'g0000000-0000-0000-0000-000000000001',
  audienceRole: 'operator',
  severity: 'high',
  headline: 'Operator Guidance: Gate C',
  actions: ['Redirect visitors away from Gate C', 'Deploy volunteers'],
  expiresAt: new Date().toISOString(),
  payload: {
    incidentSummary: 'High density alerts triggered at Gate C.',
    riskDrivers: ['Gate capacity bottlenecks', 'halftime compression flow'],
    recommendedActions: ['Redirect visitors away from Gate C', 'Deploy volunteers'],
    affectedZones: ['Gate C'],
    confidence: 0.94,
    monitoringPlan: 'Active camera coverage on Gate C turnstiles.',
    escalationOptions: ['Open auxiliary safety gates'],
  },
};

export function setupFetchMocks() {
  const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    let responseData: any = { data: {} };

    if (url.includes('/api/copilot/chat')) {
      responseData = {
        answer: 'Live simulation indicates Gate C is the current focus zone at 86% density.',
        confidence: 0.84,
        recommendations: ['Validate Gate C queue conditions', 'Redirect arrivals to West Entrance'],
        risk_level: 'HIGH',
        affected_zones: ['Gate C'],
        recovery_time: '10-18 minutes',
        priority: 'ACTIVE_MITIGATION',
        reasoning: 'Derived from live simulated density and queue length.',
        impact: 'Reduces localized queue pressure.',
      };
    } else if (
      url.includes('/api/v1/events') &&
      !url.includes('/zones') &&
      !url.includes('/predictions') &&
      !url.includes('/risk-scores') &&
      !url.includes('/alerts') &&
      !url.includes('/feedback') &&
      !url.includes('/guidance') &&
      !url.includes('/measurements') &&
      !url.includes('/integrations') &&
      !url.includes('/cameras') &&
      !url.includes('/routing-recommendations')
    ) {
      responseData = { data: [mockBackendEvent] };
    } else if (url.includes('/api/v1/venues') && !url.includes('/events')) {
      responseData = { data: [mockBackendVenue] };
    } else if (url.includes('/api/v1/venues') && url.includes('/events')) {
      responseData = { data: [mockBackendEvent] };
    } else if (url.includes('/zones')) {
      responseData = { data: mockBackendZones };
    } else if (url.includes('/cameras')) {
      responseData = { data: [mockBackendCamera] };
    } else if (url.includes('/routing-recommendations')) {
      responseData = { data: [mockBackendRoutingRecommendation] };
    } else if (url.includes('/predictions/run')) {
      responseData = { data: [] };
    } else if (url.includes('/measurements')) {
      responseData = { data: { success: true } };
    } else if (url.includes('/risk-scores')) {
      responseData = { data: mockBackendRiskScores };
    } else if (url.includes('/alerts') && !url.includes('/acknowledge')) {
      responseData = { data: mockBackendAlerts };
    } else if (url.includes('/guidance/generate')) {
      responseData = { data: mockBackendGuidance };
    } else if (url.includes('/guidance/active')) {
      responseData = { data: [] };
    } else if (url.includes('/feedback')) {
      responseData = { data: { success: true } };
    } else if (url.includes('/integrations')) {
      responseData = {
        data: {
          weather: {
            status: 'clear',
            exit_rate_modifier: 1.0,
            description: 'Clear sky',
            temperature_celsius: 22.0,
          },
          transit: {
            status: 'on_time',
            next_arrival: '15s',
            passenger_count: 0,
            description: 'No active surges',
          },
          ticketScans: {
            total_scans_last_minute: 120,
            active_turnstiles: 16,
            average_scans_per_turnstile: 7.5,
            status: 'normal',
          },
        },
      };
    } else if (url.includes('/api/stadiums') || url.includes('/api/v1/stadiums')) {
      responseData = {
        status: 'success',
        data: [
          {
            id: 'stadium_001',
            name: 'MetLife Stadium',
            city: 'New York',
            country: 'USA',
            capacity: 82000,
            currentAttendance: 72000,
            riskLevel: 'high',
            predictionStatus: 'Critical congestion in 18 minutes',
          },
          {
            id: 'stadium_002',
            name: 'SoFi Stadium',
            city: 'Los Angeles',
            country: 'USA',
            capacity: 70000,
            currentAttendance: 65000,
            riskLevel: 'low',
            predictionStatus: 'Standard crowd flow',
          },
          {
            id: 'stadium_003',
            name: 'Mercedes-Benz Stadium',
            city: 'Atlanta',
            country: 'USA',
            capacity: 71000,
            currentAttendance: 68000,
            riskLevel: 'low',
            predictionStatus: 'Stable exit patterns',
          },
          {
            id: 'stadium_004',
            name: 'Hard Rock Stadium',
            city: 'Miami',
            country: 'USA',
            capacity: 65000,
            currentAttendance: 59000,
            riskLevel: 'medium',
            predictionStatus: 'Moderate queue delays',
          },
        ],
      };
    } else if (url.includes('/predictions/timeline')) {
      responseData = {
        status: 'success',
        data: [
          {
            zone_name: 'North Gate',
            current_risk: 'LOW',
            predicted_risk: 'MEDIUM',
            horizon_minutes: 20,
            predicted_density: 55,
            predicted_queue_length: 120,
            predicted_flow_rate: 45,
            incident_probability: 22,
            staff_requirement: 8,
            confidence: 87,
            reason: 'Transient arrival surges',
            timeframe: '+20 minutes',
          },
          {
            zone_name: 'Gate C',
            current_risk: 'HIGH',
            predicted_risk: 'CRITICAL',
            horizon_minutes: 60,
            predicted_density: 90,
            predicted_queue_length: 350,
            predicted_flow_rate: 70,
            incident_probability: 80,
            staff_requirement: 22,
            confidence: 71,
            reason: 'Bottleneck congestion',
            timeframe: '+60 minutes',
          },
        ],
      };
    } else if (url.includes('/scenarios/simulate')) {
      responseData = {
        status: 'success',
        data: {
          predictedImpact: 'Risk escalates to CRITICAL; queue increases +35%',
          recoveryTime: '18 minutes',
          recommendations: ['Open temporary checkpoint at North Gate'],
        },
      };
    } else if (url.includes('/history/similar-events')) {
      responseData = {
        status: 'success',
        data: [
          {
            event_type: 'Football Cup Qualifier',
            date: '2024-11-14',
            crowd_size: 48500,
            weather: 'Rainy',
            incidents: 2,
            actions_taken: 'Opened auxiliary Gate B secondary turnstiles',
            outcome: 'Reduced queue delays at Gate B by 28% on average',
          },
        ],
      };
    } else if (url.includes('/autonomous/mode')) {
      responseData = {
        status: 'success',
        data: { enabled: false },
      };
    } else if (url.includes('/autonomous/decisions')) {
      responseData = {
        status: 'success',
        data: [
          {
            id: 'dec_mock_1',
            agent: 'Crowd Control Agent',
            action: 'OPEN_GATE',
            target: 'Gate B',
            confidence: 94,
            reason: 'Gate C density exceeds safety threshold',
            expectedImpact: 'Queue duration reduced by 28%',
          },
        ],
      };
    } else if (url.includes('/autonomous/history')) {
      responseData = {
        status: 'success',
        data: [
          {
            id: 'exec_mock_1',
            decisionId: 'dec_mock_1',
            actionType: 'OPEN_GATE',
            target: 'Gate B',
            timestamp: '2026-07-17T18:00:00Z',
            operator: 'OPS-Lead',
            result: 'Success: Gates bypassed',
            impact: 'Density decreased by 14%',
          },
        ],
      };
    } else if (url.includes('/autonomous/learning')) {
      responseData = {
        status: 'success',
        data: [
          {
            action: 'OPEN_GATE (Gate B)',
            outcome: 'Queue length reduced by 31%',
            effectivenessScore: 94,
            historicalSuccessRate: '92%',
          },
        ],
      };
    } else if (url.includes('/digital-twin/overview')) {
      responseData = {
        status: 'success',
        data: {
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
        },
      };
    } else if (url.includes('/digital-twin/zones')) {
      responseData = {
        status: 'success',
        data: [
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
        ],
      };
    } else if (url.includes('/digital-twin/incidents')) {
      responseData = {
        status: 'success',
        data: [
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
        ],
      };
    } else if (url.includes('/digital-twin/heatmap')) {
      responseData = {
        status: 'success',
        data: [
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
        ],
      };
    } else if (url.includes('/digital-twin/cameras')) {
      responseData = {
        status: 'success',
        data: [
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
        ],
      };
    } else if (url.includes('/digital-twin/crowd-flow')) {
      responseData = {
        status: 'success',
        data: [
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
        ],
      };
    } else if (url.includes('/digital-twin/live')) {
      responseData = {
        status: 'success',
        data: [
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
        ],
      };
    } else if (url.includes('/vision/assess')) {
      responseData = {
        status: 'success',
        data: {
          cameraId: 'CAM-101',
          zone: 'Gate A Ingress',
          estimatedPeople: 1200,
          density: 'MEDIUM',
          riskLevel: 'MEDIUM',
          riskScore: 54,
          abnormalMovementDetected: false,
          operationalRecommendation: 'Deploy roaming stewards',
        },
      };
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseData),
    });
  });

  class MockWebSocket {
    url: string;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror: ((err: any) => void) | null = null;

    constructor(url: string) {
      this.url = url;
      setTimeout(() => {
        if (this.onopen) this.onopen();
      }, 0);
    }

    send(data: string) {}
    close() {
      setTimeout(() => {
        if (this.onclose) this.onclose();
      }, 0);
    }
  }

  global.fetch = fetchMock as any;
  (global as any).WebSocket = MockWebSocket;
  return fetchMock;
}
