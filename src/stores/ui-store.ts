import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Page } from "@/lib/constants"

export type { Page }

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeModal: string | null
  currentPage: Page
  selectedProjectId: string | null

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  openModal: (id: string) => void
  closeModal: () => void
  navigateTo: (page: Page) => void
  navigateToProject: (projectId: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      activeModal: null,
      currentPage: "dashboard",
      selectedProjectId: null,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
      navigateTo: (page) => set({ currentPage: page, selectedProjectId: null }),
      navigateToProject: (projectId) =>
        set({ currentPage: "project", selectedProjectId: projectId }),
    }),
    {
      name: "warden-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
