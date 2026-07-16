type FrontendConfig = {
  apiBaseUrl: string;
  appName: string;
};

export const config: FrontendConfig = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ??
    (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : 'http://localhost:8000'),
  appName: import.meta.env.VITE_APP_NAME ?? 'FluxGuard AI',
};
