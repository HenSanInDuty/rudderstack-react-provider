"use client";

import rudderstackTracking from "./RudderStackTracker";
import React, { createContext, useContext, useEffect, useRef } from "react";

interface RudderAnalyticsContextType {
  isInitialized: boolean;
}

const RudderAnalyticsContext = createContext<RudderAnalyticsContextType>({
  isInitialized: false,
});

export const useRudderAnalytics = () => {
  const context = useContext(RudderAnalyticsContext);
  if (!context) {
    throw new Error("useRudderAnalytics must be used within RudderAnalyticsProvider");
  }
  return context;
};

interface RudderAnalyticsProviderProps {
  children: React.ReactNode;
}

export const RudderAnalyticsProvider: React.FC<RudderAnalyticsProviderProps> = ({
  children,
}) => {
  const cleanupRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }

    const initTracking = async () => {
      try {
        const tracking = await rudderstackTracking();
        if (tracking) {
          cleanupRef.current = tracking.destructRudderstackTracking;
          isInitializedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to initialize RudderStack tracking:", error);
      }
    };

    initTracking();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  const value: RudderAnalyticsContextType = {
    isInitialized: isInitializedRef.current,
  };

  return (
    <RudderAnalyticsContext.Provider value={value}>
      {children}
    </RudderAnalyticsContext.Provider>
  );
};