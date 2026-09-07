/**
 * Shared Application Configuration & Feature Flags
 * Controls build targets, production security constraints, and demo login visibility.
 */

declare global {
  interface ImportMeta {
    env: Record<string, any>;
  }
}

export type AppTarget = 'admin' | 'customer' | 'technician' | 'all';

/**
 * Check if demo login helpers, demo persona selectors, and quick-fill buttons are enabled.
 * In development: defaults to true unless explicitly disabled via VITE_DEMO_LOGIN_ENABLED='false'.
 * In production: strictly disabled when VITE_DEMO_LOGIN_ENABLED='false' or NODE_ENV === 'production'.
 */
export function isDemoLoginEnabled(): boolean {
  // 1. Check Node / server environment variables if available
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.DEMO_LOGIN_ENABLED === 'false' || process.env.VITE_DEMO_LOGIN_ENABLED === 'false') {
      return false;
    }
    if (process.env.NODE_ENV === 'production' && process.env.DEMO_LOGIN_ENABLED !== 'true') {
      return false;
    }
  }

  // 2. Check client-side Vite environment variable
  const viteDemoFlag = import.meta.env?.VITE_DEMO_LOGIN_ENABLED;
  if (viteDemoFlag === 'false') {
    return false;
  }

  // 3. Check production environment: strictly disable unless explicitly set to 'true'
  if (import.meta.env?.PROD || import.meta.env?.MODE === 'production') {
    return viteDemoFlag === 'true';
  }

  // Enabled by default in local dev environment for rapid testing
  return true;
}

/**
 * Get active application target.
 * Can be configured via VITE_APP_TARGET ('admin' | 'customer' | 'technician' | 'all')
 * or determined dynamically via route path in unified dev mode.
 */
export function getAppTarget(): AppTarget {
  const envTarget = (import.meta.env?.VITE_APP_TARGET as AppTarget) || 'all';
  if (['admin', 'customer', 'technician'].includes(envTarget)) {
    return envTarget;
  }
  return 'all';
}
