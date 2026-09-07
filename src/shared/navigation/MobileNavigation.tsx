import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

export interface NavigationEntry {
  screen: string;
  params?: Record<string, any>;
  title?: string;
}

export interface MobileNavigationContextType {
  currentScreen: string;
  params: Record<string, any>;
  stack: NavigationEntry[];
  canGoBack: boolean;
  push: (screen: string, params?: Record<string, any>, title?: string) => void;
  pop: () => void;
  goBack: () => void;
  replace: (screen: string, params?: Record<string, any>, title?: string) => void;
  reset: (rootScreen: string, params?: Record<string, any>) => void;
}

const MobileNavigationContext = createContext<MobileNavigationContextType | undefined>(undefined);

export interface MobileNavigationProviderProps {
  initialScreen: string;
  initialParams?: Record<string, any>;
  children: React.ReactNode;
}

export const MobileNavigationProvider: React.FC<MobileNavigationProviderProps> = ({
  initialScreen,
  initialParams = {},
  children,
}) => {
  const [stack, setStack] = useState<NavigationEntry[]>([
    { screen: initialScreen, params: initialParams },
  ]);

  const currentEntry = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  const push = useCallback((screen: string, params: Record<string, any> = {}, title?: string) => {
    setStack((prev) => [...prev, { screen, params, title }]);
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen, depth: stack.length }, title || screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stack.length]);

  const pop = useCallback(() => {
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, prev.length - 1);
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1 && canGoBack) {
      window.history.back();
    } else {
      pop();
    }
  }, [canGoBack, pop]);

  const replace = useCallback((screen: string, params: Record<string, any> = {}, title?: string) => {
    setStack((prev) => {
      const next = [...prev];
      next[next.length - 1] = { screen, params, title };
      return next;
    });
    if (typeof window !== 'undefined') {
      window.history.replaceState({ screen, depth: stack.length - 1 }, title || screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stack.length]);

  const reset = useCallback((rootScreen: string, params: Record<string, any> = {}) => {
    setStack([{ screen: rootScreen, params }]);
    if (typeof window !== 'undefined') {
      window.history.replaceState({ screen: rootScreen, depth: 0 }, rootScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Listen for native mobile back events and browser popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setStack((prev) => {
        if (prev.length > 1) {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle Android native hardware back button via Capacitor
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | null = null;

    CapApp.addListener('backButton', () => {
      setStack((prev) => {
        if (prev.length > 1) {
          return prev.slice(0, prev.length - 1);
        } else {
          // If on root screen, exit or minimize the mobile app
          CapApp.exitApp();
          return prev;
        }
      });
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  return (
    <MobileNavigationContext.Provider
      value={{
        currentScreen: currentEntry.screen,
        params: currentEntry.params || {},
        stack,
        canGoBack,
        push,
        pop,
        goBack,
        replace,
        reset,
      }}
    >
      {children}
    </MobileNavigationContext.Provider>
  );
};

export function useMobileNavigation(): MobileNavigationContextType {
  const ctx = useContext(MobileNavigationContext);
  if (!ctx) {
    throw new Error('useMobileNavigation must be used within a MobileNavigationProvider');
  }
  return ctx;
}
