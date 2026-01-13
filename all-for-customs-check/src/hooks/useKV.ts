/**
 * React hooks for key-value storage and state management
 */

import { useState, useCallback } from 'react';

export interface KeyValueStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

/**
 * React hook for interacting with key-value storage
 * Provides persistence layer for component state
 */
export function useKV<T>(storageKey: string, initialValue?: T): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void] {
  const [value, setValue] = useState<T | null>(() => {
    try {
      const stored = typeof window !== 'undefined' ? 
        localStorage.getItem(storageKey) : 
        null;
      return stored ? JSON.parse(stored) : (initialValue ?? null);
    } catch {
      console.warn(`Failed to load value for key: ${storageKey}`);
      return initialValue ?? null;
    }
  });

  const setStoredValue = useCallback((newValue: T | null | ((prev: T | null) => T | null)) => {
    try {
      setValue(prev => {
        const updatedValue =
          typeof newValue === 'function'
            ? (newValue as (p: T | null) => T | null)(prev)
            : newValue;

        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(updatedValue));
        }

        return updatedValue;
      });
    } catch (error) {
      console.error(`Failed to store value for key: ${storageKey}`, error);
    }
  }, [storageKey]);

  return [value, setStoredValue];
}

/**
 * React hook for accessing a key-value store instance
 */
export function useStore(): KeyValueStore {
  return {
    get: (key: string) => {
      try {
        const value = typeof window !== 'undefined' ? 
          localStorage.getItem(key) : 
          null;
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    set: (key: string, value: unknown) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Failed to set value for key: ${key}`, error);
      }
    },
    remove: (key: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    },
    clear: () => {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    },
    keys: () => {
      if (typeof window !== 'undefined') {
        return Object.keys(localStorage);
      }
      return [];
    }
  };
}

export default {
  useKV,
  useStore
};
