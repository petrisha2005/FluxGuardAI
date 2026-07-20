type FrontendConfig = {
  apiBaseUrl: string;
  appName: string;
  enableDemoAuth: boolean;
};

export const config: FrontendConfig = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "https://fluxguardai.onrender.com",

  appName: import.meta.env.VITE_APP_NAME ?? "FluxGuard AI",

  enableDemoAuth:
    import.meta.env.VITE_ENABLE_DEMO_AUTH !== "false" &&
    (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_AUTH === "true"),
};