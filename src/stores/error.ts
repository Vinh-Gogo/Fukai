import { create } from "zustand";

// Types
export interface AppError {
  id: string;
  type: "network" | "validation" | "auth" | "server" | "unknown";
  title: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  retryable?: boolean;
  retryAction?: () => void | Promise<void>;
}

export interface ErrorState {
  errors: AppError[];
  globalError: AppError | null;
  isErrorBoundaryTriggered: boolean;
}

// Actions
export interface ErrorActions {
  addError: (error: Omit<AppError, "id" | "timestamp">) => string;
  removeError: (id: string) => void;
  clearErrors: () => void;
  setGlobalError: (error: AppError | null) => void;
  clearGlobalError: () => void;
  setErrorBoundaryTriggered: (triggered: boolean) => void;
  retryError: (id: string) => Promise<void>;
}

// Store
export interface ErrorStore extends ErrorState, ErrorActions {}

const initialState: ErrorState = {
  errors: [],
  globalError: null,
  isErrorBoundaryTriggered: false,
};

export const useErrorStore = create<ErrorStore>((set, get) => ({
  ...initialState,

  addError: (error: Omit<AppError, "id" | "timestamp">) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newError: AppError = {
      ...error,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      errors: [...state.errors, newError],
    }));

    // Log error for debugging
    console.error(
      `[${error.type.toUpperCase()}] ${error.title}:`,
      error.message,
      error.details,
    );

    return id;
  },

  removeError: (id: string) => {
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== id),
    }));
  },

  clearErrors: () => {
    set({ errors: [] });
  },

  setGlobalError: (error: AppError | null) => {
    set({ globalError: error });
  },

  clearGlobalError: () => {
    set({ globalError: null });
  },

  setErrorBoundaryTriggered: (triggered: boolean) => {
    set({ isErrorBoundaryTriggered: triggered });
  },

  retryError: async (id: string) => {
    const state = get();
    const error = state.errors.find((e) => e.id === id);

    if (error?.retryable && error.retryAction) {
      try {
        await error.retryAction();
        // Remove the error if retry succeeds
        get().removeError(id);
      } catch (retryError) {
        // Update error with retry failure info
        console.error("Retry failed:", retryError);
      }
    }
  },
}));

// Selectors
export const useErrors = () => useErrorStore((state) => state.errors);
export const useGlobalError = () => useErrorStore((state) => state.globalError);
export const useIsErrorBoundaryTriggered = () =>
  useErrorStore((state) => state.isErrorBoundaryTriggered);

export const useErrorById = (id: string) =>
  useErrorStore((state) => state.errors.find((error) => error.id === id));

export const useHasErrors = () =>
  useErrorStore(
    (state) => state.errors.length > 0 || state.globalError !== null,
  );

// Actions selectors
export const useErrorActions = () =>
  useErrorStore((state) => ({
    addError: state.addError,
    removeError: state.removeError,
    clearErrors: state.clearErrors,
    setGlobalError: state.setGlobalError,
    clearGlobalError: state.clearGlobalError,
    setErrorBoundaryTriggered: state.setErrorBoundaryTriggered,
    retryError: state.retryError,
  }));

// Helper functions
export const createNetworkError = (
  title: string,
  message: string,
  details?: Record<string, unknown>,
  retryAction?: () => void | Promise<void>,
) => ({
  type: "network" as const,
  title,
  message,
  details,
  retryable: !!retryAction,
  retryAction,
});

export const createValidationError = (
  title: string,
  message: string,
  details?: Record<string, unknown>,
) => ({
  type: "validation" as const,
  title,
  message,
  details,
  retryable: false,
});

export const createAuthError = (
  title: string,
  message: string,
  details?: Record<string, unknown>,
) => ({
  type: "auth" as const,
  title,
  message,
  details,
  retryable: false,
});

export const createServerError = (
  title: string,
  message: string,
  details?: Record<string, unknown>,
  retryAction?: () => void | Promise<void>,
) => ({
  type: "server" as const,
  title,
  message,
  details,
  retryable: !!retryAction,
  retryAction,
});
