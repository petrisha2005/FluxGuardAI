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
  reason: 'High queue backlog detected at Gate C. Reroute incoming flow to West Entrance to optimize clearance times.',
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

    if (
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
