import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Types
export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: number
}

export interface ModalState {
  isOpen: boolean
  type?: string
  data?: Record<string, unknown>
}

export interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean

  // Modals
  modals: Record<string, ModalState>

  // Notifications
  notifications: NotificationItem[]

  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>

  // Navigation
  activeRoute: string
  breadcrumbs: Array<{ label: string; path?: string }>
}

// Actions
export interface UIActions {
  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Sidebar
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Modals
  openModal: (type: string, data?: Record<string, unknown>) => void
  closeModal: (type: string) => void
  closeAllModals: () => void

  // Notifications
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Loading states
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  removeLoadingState: (key: string) => void

  // Navigation
  setActiveRoute: (route: string) => void
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; path?: string }>) => void
}

// Store
export interface UIStore extends UIState, UIActions {}

const initialState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  modals: {},
  notifications: [],
  globalLoading: false,
  loadingStates: {},
  activeRoute: '/',
  breadcrumbs: [],
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Theme
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme })
      },

      // Sidebar
      toggleSidebar: () => {
        const current = get().sidebarCollapsed
        set({ sidebarCollapsed: !current })
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed })
      },

      // Modals
      openModal: (type: string, data?: Record<string, unknown>) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [type]: { isOpen: true, type, data },
          },
        }))
      },

      closeModal: (type: string) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [type]: { ...state.modals[type], isOpen: false },
          },
        }))
      },

      closeAllModals: () => {
        set((state) => ({
          modals: Object.keys(state.modals).reduce((acc, key) => ({
            ...acc,
            [key]: { ...state.modals[key], isOpen: false },
          }), {}),
        }))
      },

      // Notifications
      addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newNotification: NotificationItem = {
          ...notification,
          id,
          timestamp: Date.now(),
        }

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }))

        // Auto-remove notification after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration || 5000)
        }

        return id
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      // Loading states
      setGlobalLoading: (loading: boolean) => {
        set({ globalLoading: loading })
      },

      setLoadingState: (key: string, loading: boolean) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        }))
      },

      removeLoadingState: (key: string) => {
        set((state) => {
          const { [key]: _, ...rest } = state.loadingStates
          return { loadingStates: rest }
        })
      },

      // Navigation
      setActiveRoute: (route: string) => {
        set({ activeRoute: route })
      },

      setBreadcrumbs: (breadcrumbs: Array<{ label: string; path?: string }>) => {
        set({ breadcrumbs })
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// Selectors
export const useTheme = () => useUIStore((state) => state.theme)
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed)
export const useNotifications = () => useUIStore((state) => state.notifications)
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading)
export const useActiveRoute = () => useUIStore((state) => state.activeRoute)
export const useBreadcrumbs = () => useUIStore((state) => state.breadcrumbs)

export const useIsLoading = (key: string) => useUIStore((state) => state.loadingStates[key] || false)
export const useModalState = (type: string) => useUIStore((state) => state.modals[type])

// Actions selectors
export const useUIActions = () => useUIStore((state) => ({
  setTheme: state.setTheme,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
  setGlobalLoading: state.setGlobalLoading,
  setLoadingState: state.setLoadingState,
  removeLoadingState: state.removeLoadingState,
  setActiveRoute: state.setActiveRoute,
  setBreadcrumbs: state.setBreadcrumbs,
}))
