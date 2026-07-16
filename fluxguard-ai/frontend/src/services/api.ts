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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer mock-operator',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (errorData as any)?.detail?.error?.message || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  const envelope = await response.json();
  return envelope.data as T;
}

export const api = {
  fetchVenues: () => request<BackendVenue[]>('/api/v1/venues'),

  fetchEventsByVenue: (venueId: string) => request<BackendEvent[]>(`/api/v1/venues/${venueId}/events`),

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
};
