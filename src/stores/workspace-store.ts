import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WorkspaceState {
  rootPath: string | null
  isOnboardingComplete: boolean
  recentPaths: string[]

  // Actions
  setRootPath: (path: string) => void
  completeOnboarding: () => void
  addRecentPath: (path: string) => void
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      rootPath: null,
      isOnboardingComplete: false,
      recentPaths: [],

      setRootPath: (path) =>
        set((state) => ({
          rootPath: path,
          recentPaths: [path, ...state.recentPaths.filter((p) => p !== path)].slice(0, 5),
        })),

      completeOnboarding: () =>
        set({
          isOnboardingComplete: true,
        }),

      addRecentPath: (path) =>
        set((state) => ({
          recentPaths: [path, ...state.recentPaths.filter((p) => p !== path)].slice(0, 5),
        })),

      reset: () =>
        set({
          rootPath: null,
          isOnboardingComplete: false,
          recentPaths: [],
        }),
    }),
    {
      name: "warden-workspace",
    }
  )
)
