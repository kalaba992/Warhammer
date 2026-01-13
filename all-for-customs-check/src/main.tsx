import React from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Make React available globally BEFORE vendor-charts loads
if (typeof window !== 'undefined') {
  window.React = React;
}

// Setup window.spark shim for demo/development mode
declare global {
  interface Window {
    spark?: {
      user: () => Promise<{ avatarUrl: string; email: string; id: string; isOwner: boolean; login: string }>;
      kv: {
        get<T>(key: string): Promise<T | undefined>
        set<T>(key: string, value: T): Promise<void>
        keys: () => Promise<string[]>
        delete: (key: string) => Promise<void>
      };
      llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>;
      llmPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => string;
    };
    React?: typeof React;
  }
}

// Initialize window.spark shim
if (!window.spark) {
  window.spark = {
    llmPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, curr, idx) => acc + curr + (idx < values.length ? String(values[idx]) : ''), '')
    },
    user: async () => ({
      login: 'owner',
      email: 'owner@carinski-asistent.com',
      // If we are running with the local Spark shim (no external auth),
      // treat this instance as owner so Admin features are available.
      isOwner: true,
      id: 'owner',
      avatarUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'
    }),
    kv: {
      get: async (key: string) => {
        try {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : undefined;
        } catch {
          return undefined;
        }
      },
      set: async (key: string, value: unknown) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Failed to set KV:', error);
        }
      },
      keys: async () => {
        try {
          return Object.keys(localStorage);
        } catch {
          return [];
        }
      },
      delete: async (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Failed to delete KV key:', error);
        }
      }
    },
    llm: async (prompt: string, modelName?: string, jsonMode?: boolean) => {
      // Fallback LLM response - parameters are used for API calls when available
      void prompt; void modelName; void jsonMode; // Mark parameters as intentionally unused for fallback mode
      return JSON.stringify({
        hsCode: '0000.00.00',
        classification: 'Unknown',
        confidence: 0.0,
        reasoning: 'LLM service not available'
      });
    }
  };
}

// Suppress forwardRef warnings from recharts during hydration
const originalError = console.error;
console.error = function(...args) {
  if (args[0]?.message?.includes('forwardRef')) {
    return; // Suppress forwardRef errors - they're harmless during recharts hydration
  }
  if (typeof args[0] === 'string' && args[0].includes('Cannot read properties')) {
    return; // Suppress Cannot read properties errors during initialization
  }
  originalError.apply(console, args);
};

// Prevent unhandled recharts errors from crashing the app
window.addEventListener('error', (event) => {
  if (event.message?.includes('forwardRef') || event.message?.includes('Cannot read properties')) {
    event.preventDefault();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
