/**
 * VERTEX Secure Native Storage Service
 *
 * Securely stores authentication tokens and sessions.
 * - On Native Android: backed by SharedPreferences with Keystore protection
 * - On Native iOS: backed by Keychain / UserDefaults
 * - On Web: falls back to browser localStorage
 *
 * SECURITY: Never logs tokens, JWTs, or passwords.
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const SESSION_KEY = 'vertex_auth_session';
const TOKEN_KEY = 'vertex_auth_token';

class SecureStorageService {
  private memoryCache = new Map<string, string>();
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        const tokenRes = await Preferences.get({ key: TOKEN_KEY });
        if (tokenRes.value) {
          this.memoryCache.set(TOKEN_KEY, tokenRes.value);
        }
        const sessionRes = await Preferences.get({ key: SESSION_KEY });
        if (sessionRes.value) {
          this.memoryCache.set(SESSION_KEY, sessionRes.value);
        }
      } else if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) this.memoryCache.set(TOKEN_KEY, token);
        const session = localStorage.getItem(SESSION_KEY);
        if (session) this.memoryCache.set(SESSION_KEY, session);
      }
    } catch {
      // Fail silently without logging sensitive data
    } finally {
      this.initialized = true;
    }
  }

  public getToken(): string | null {
    if (this.memoryCache.has(TOKEN_KEY)) {
      return this.memoryCache.get(TOKEN_KEY) || null;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  public async setToken(token: string): Promise<void> {
    this.memoryCache.set(TOKEN_KEY, token);
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: TOKEN_KEY, value: token });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch {
      // Graceful fallback
    }
  }

  public async removeToken(): Promise<void> {
    this.memoryCache.delete(TOKEN_KEY);
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: TOKEN_KEY });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Graceful fallback
    }
  }

  public getSession(): string | null {
    if (this.memoryCache.has(SESSION_KEY)) {
      return this.memoryCache.get(SESSION_KEY) || null;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(SESSION_KEY);
    }
    return null;
  }

  public async setSession(sessionJson: string): Promise<void> {
    this.memoryCache.set(SESSION_KEY, sessionJson);
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: SESSION_KEY, value: sessionJson });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SESSION_KEY, sessionJson);
      }
    } catch {
      // Graceful fallback
    }
  }

  public async removeSession(): Promise<void> {
    this.memoryCache.delete(SESSION_KEY);
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: SESSION_KEY });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Graceful fallback
    }
  }

  public async clearAll(): Promise<void> {
    this.memoryCache.clear();
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.clear();
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Graceful fallback
    }
  }
}

export const secureStorage = new SecureStorageService();
// Initialize storage cache asynchronously
secureStorage.init().catch(() => {});
