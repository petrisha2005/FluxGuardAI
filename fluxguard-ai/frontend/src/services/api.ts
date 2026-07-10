/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from './config';

export interface BackendEvent {
  id: string;
  name: string;
  description: string;
  status: string;
  startsAt: string;
  endsAt: string;
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
  fetchEvents: () => request<BackendEvent[]>('/api/v1/events'),

  fetchZones: (eventId: string) => request<BackendZone[]>(`/api/v1/events/${eventId}/zones`),

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
};
