import { useState, useCallback } from 'react';

export interface PreferencesData {
  autoRefreshInterval: number;
  enableNotifications: boolean;
}

export interface UsePreferencesReturn {
  preferences: PreferencesData;
  setAutoRefreshInterval: (value: number) => void;
  setEnableNotifications: (value: boolean) => void;
  savePreferences: () => { type: 'success' | 'error'; text: string };
}

/**
 * Get initial preferences from localStorage
 * Called during hook initialization to avoid delay
 */
function getInitialPreferences(): PreferencesData {
  if (typeof window === 'undefined') {
    return {
      autoRefreshInterval: 60,
      enableNotifications: true,
    };
  }

  const savedInterval = localStorage.getItem('autoRefreshInterval');
  const savedNotifications = localStorage.getItem('enableNotifications');

  return {
    autoRefreshInterval: savedInterval ? parseInt(savedInterval) : 60,
    enableNotifications: savedNotifications ? savedNotifications === 'true' : true,
  };
}

/**
 * Custom hook for managing user preferences
 * Handles preferences stored in localStorage
 */
export function usePreferences(): UsePreferencesReturn {
  // Initialize preferences from localStorage immediately
  const [preferences, setPreferences] = useState<PreferencesData>(getInitialPreferences);

  const setAutoRefreshInterval = useCallback((value: number) => {
    setPreferences((prev) => ({
      ...prev,
      autoRefreshInterval: value,
    }));
  }, []);

  const setEnableNotifications = useCallback((value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      enableNotifications: value,
    }));
  }, []);

  const savePreferences = useCallback((): { type: 'success' | 'error'; text: string } => {
    try {
      localStorage.setItem('autoRefreshInterval', preferences.autoRefreshInterval.toString());
      localStorage.setItem('enableNotifications', preferences.enableNotifications.toString());
      return { type: 'success', text: 'Preferences saved successfully' };
    } catch (error) {
      return { type: 'error', text: 'Failed to save preferences' };
    }
  }, [preferences]);

  return {
    preferences,
    setAutoRefreshInterval,
    setEnableNotifications,
    savePreferences,
  };
}
