// Export all stores and their types
export * from './auth'
export * from './ui'
export * from './error'

// Re-export commonly used hooks for convenience
export { useAuthStore, useAuthUser, useAuthToken, useIsAuthenticated, useAuthActions } from './auth'
export { useUIStore, useTheme, useNotifications, useGlobalLoading, useUIActions } from './ui'
export { useErrorStore, useErrors, useGlobalError, useErrorActions, createNetworkError, createValidationError } from './error'
