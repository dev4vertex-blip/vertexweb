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
  return false;
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
