import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { IDE, Theme } from "@/types/settings"

interface SettingsState {
  defaultIDE: IDE
  theme: Theme
  language: string

  // Actions
  setDefaultIDE: (ide: IDE) => void
  setTheme: (theme: Theme) => void
  setLanguage: (language: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultIDE: "vscode",
      theme: "dark",
      language: "en",

      setDefaultIDE: (ide) => set({ defaultIDE: ide }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "warden-settings",
    }
  )
)
