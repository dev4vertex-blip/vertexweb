/**
 * VERTEX Mobile Bridge
 *
 * Provides native bridge listeners for:
 * - Deep Links / URL schemes (vertex://booking/:id, vertex://offers, etc.)
 * - Native app state changes (resume/pause)
 * - Push notification registration architecture hooks
 */

import { Capacitor } from '@capacitor/core';
import { App as CapApp, URLOpenListenerEvent } from '@capacitor/app';

export interface DeepLinkHandler {
  (route: string, params: Record<string, string>): void;
}

class MobileBridgeService {
  private deepLinkListeners: DeepLinkHandler[] = [];
  private initialized = false;

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    if (Capacitor.isNativePlatform()) {
      // 1. Listen for deep links (e.g., vertex://booking/123, https://vertex.app/...)
      CapApp.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        this.handleIncomingUrl(event.url);
      });

      // 2. Listen for app state changes
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // App returned to foreground, check session freshness or pending updates
        }
      });
    }
  }

  public registerDeepLinkHandler(handler: DeepLinkHandler): () => void {
    this.deepLinkListeners.push(handler);
    return () => {
      this.deepLinkListeners = this.deepLinkListeners.filter((h) => h !== handler);
    };
  }

  private handleIncomingUrl(rawUrl: string) {
    try {
      // Parse custom scheme or https URL
      const url = new URL(rawUrl);
      const pathname = url.pathname || url.hostname; // in vertex://booking/123, hostname may be 'booking'
      const params: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Notify registered handlers
      for (const handler of this.deepLinkListeners) {
        handler(pathname, params);
      }
    } catch {
      // Ignore malformed URLs
    }
  }

  /**
   * Push notification subscription architecture
   * Prepared for FCM (Android) and APNs (iOS) when Google Services/APNs credentials are added.
   */
  public async initializePushNotifications(onTokenReceived?: (token: string) => void): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // Architecture ready: when @capacitor/push-notifications is activated and google-services.json is configured,
    // PushNotifications.requestPermissions() and PushNotifications.register() will be invoked here.
  }
}

export const mobileBridge = new MobileBridgeService();
mobileBridge.init();
