import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Page = "dashboard" | "monitor" | "settings"

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeModal: string | null
  currentPage: Page

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  openModal: (id: string) => void
  closeModal: () => void
  navigateTo: (page: Page) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      activeModal: null,
      currentPage: "dashboard",

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
      navigateTo: (page) => set({ currentPage: page }),
    }),
    {
      name: "warden-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
