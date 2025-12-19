// Enhanced state management with persistence and synchronization
import { useState, useEffect, useCallback, useRef } from 'react';

// Storage interface for persistence
export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear?(): void;
}

// LocalStorage adapter
class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle quota exceeded or other storage errors
      console.warn(`Failed to save ${key} to localStorage`);
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}

// Memory adapter for non-persistent state
class MemoryAdapter implements StorageAdapter {
  private store = new Map<string, unknown>();

  get<T>(key: string): T | null {
    const value = this.store.get(key);
    return value !== undefined ? (value as T) : null;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Enhanced state hook options
interface UseStateOptions<T> {
  key?: string;
  storage?: StorageAdapter;
  defaultValue?: T;
  persist?: boolean;
  syncAcrossTabs?: boolean;
  validate?: (value: T) => boolean;
  onError?: (error: Error) => void;
}

// Enhanced useState hook with persistence and validation
export function useEnhancedState<T>(
  initialValue: T,
  options: UseStateOptions<T> = {}
) {
  const {
    key,
    storage = new LocalStorageAdapter(),
    defaultValue = initialValue,
    persist = false,
    syncAcrossTabs = false,
    validate,
    onError
  } = options;

  // Initialize with default value to avoid hydration mismatch
  const [state, setState] = useState<T>(defaultValue);
  const isInitialized = useRef(false);

  // Load persisted state on mount
  useEffect(() => {
    if (!persist || !key || isInitialized.current) return;

    try {
      const persistedValue = storage.get<T>(key);
      if (persistedValue !== null) {
        // Validate if validator provided
        if (validate && !validate(persistedValue)) {
          console.warn(`Invalid persisted value for ${key}, using default`);
          return;
        }
        setState(persistedValue);
      }
    } catch (error) {
      console.error(`Failed to load persisted state for ${key}:`, error);
      onError?.(error as Error);
    } finally {
      isInitialized.current = true;
    }
  }, [key, persist, storage, validate, onError]);

  // Save state when it changes
  useEffect(() => {
    if (!persist || !key || !isInitialized.current) return;

    try {
      // Validate before saving
      if (validate && !validate(state)) {
        console.warn(`Invalid state value for ${key}, not persisting`);
        return;
      }
      storage.set(key, state);
    } catch (error) {
      console.error(`Failed to persist state for ${key}:`, error);
      onError?.(error as Error);
    }
  }, [state, key, persist, storage, validate, onError]);

  // Handle cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs || !key || !persist) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          if (validate && !validate(newValue)) {
            console.warn(`Invalid sync value for ${key}`);
            return;
          }
          setState(newValue);
        } catch (error) {
          console.error(`Failed to sync state for ${key}:`, error);
          onError?.(error as Error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, syncAcrossTabs, persist, validate, onError]);

  // Enhanced setState with validation
  const enhancedSetState = useCallback((updater: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof updater === 'function' 
        ? (updater as (prev: T) => T)(prevState)
        : updater;

      // Validate if validator provided
      if (validate && !validate(newValue)) {
        console.warn('Invalid state update, rejecting');
        onError?.(new Error('Invalid state update'));
        return prevState;
      }

      return newValue;
    });
  }, [validate, onError]);

  return [state, enhancedSetState] as const;
}

// State manager for complex state with actions
interface StateManagerConfig<T> {
  initialState: T;
  key?: string;
  storage?: StorageAdapter;
  persist?: boolean;
  actions?: Record<string, (state: T, ...args: unknown[]) => T>;
  middleware?: Array<(next: () => T, state: T, action: string, args: unknown[]) => T>;
}

export function createStateManager<T>(config: StateManagerConfig<T>) {
  const {
    initialState,
    key,
    storage = new LocalStorageAdapter(),
    persist = false,
    actions = {},
    middleware = []
  } = config;

  let currentState = initialState;
  const listeners = new Set<(state: T) => void>();

  // Load persisted state
  if (persist && key) {
    const persisted = storage.get<T>(key);
    if (persisted !== null) {
      currentState = persisted;
    }
  }

  // Subscribe to state changes
  const subscribe = (callback: (state: T) => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  };

  // Get current state
  const getState = () => currentState;

  // Dispatch state updates
  const dispatch = (actionName: string, ...args: unknown[]) => {
    const action = actions[actionName];
    if (!action) {
      console.error(`Unknown action: ${actionName}`);
      return;
    }

    const executeAction = () => {
      const newState = action(currentState, ...args);
      
      if (newState !== currentState) {
        currentState = newState;
        
        // Persist if enabled
        if (persist && key) {
          storage.set(key, newState);
        }

        // Notify listeners
        listeners.forEach(listener => listener(newState));
      }

      return newState;
    };

    // Apply middleware
    if (middleware.length > 0) {
      const chain = middleware.reduceRight(
        (next: () => T, middlewareFn) => 
          () => middlewareFn(next, currentState, actionName, args),
        executeAction
      );
      chain();
    } else {
      executeAction();
    }
  };

  // Reset to initial state
  const reset = () => {
    currentState = initialState;
    
    if (persist && key) {
      storage.set(key, initialState);
    }

    listeners.forEach(listener => listener(initialState));
  };

  return {
    getState,
    dispatch,
    subscribe,
    reset
  };
}

// Hook to use state manager in React components
export function useStateManager<T>(manager: ReturnType<typeof createStateManager<T>>) {
  const [state, setState] = useState<T>(manager.getState());

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  const dispatch = useCallback((action: string, ...args: unknown[]) => {
    manager.dispatch(action, ...args);
  }, [manager]);

  const reset = useCallback(() => {
    manager.reset();
  }, [manager]);

  return {
    state,
    dispatch,
    reset
  };
}

// Utility functions for common state patterns
export const createValidationRules = {
  required: (value: unknown) => value !== null && value !== undefined,
  minLength: (min: number) => (value: string | unknown[]) => Array.isArray(value) && value.length >= min,
  maxLength: (max: number) => (value: string | unknown[]) => Array.isArray(value) && value.length <= max,
  pattern: (regex: RegExp) => (value: string) => typeof value === 'string' && regex.test(value),
  range: (min: number, max: number) => (value: number) => typeof value === 'number' && value >= min && value <= max,
  email: (value: string) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value: string) => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
};

// Common middleware
export const loggerMiddleware = <T>(next: () => T, state: T, action: string, args: unknown[]) => {
  console.group(`State Action: ${action}`);
  console.log('Previous state:', state);
  console.log('Action args:', args);
  const result = next();
  console.log('New state:', result);
  console.groupEnd();
  return result;
};

export const debounceMiddleware = <T>(delay: number) => {
  let timeoutId: NodeJS.Timeout;

  return (next: () => T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(next, delay);
    return next(); // Still return immediate result for UI
  };
};

export const localStorageAdapter = new LocalStorageAdapter();
export const memoryAdapter = new MemoryAdapter();
