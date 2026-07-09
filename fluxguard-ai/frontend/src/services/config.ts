type FrontendConfig = {
  apiBaseUrl: string;
  appName: string;
};

export const config: FrontendConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  appName: import.meta.env.VITE_APP_NAME ?? 'FluxGuard AI',
};
