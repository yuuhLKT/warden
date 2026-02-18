import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { IDE, Theme } from "@/types/settings"

interface SettingsState {
  defaultIDE: IDE
  ideCommand: string
  theme: Theme
  language: string
  urlSuffix: string
  scanDepth: number

  setDefaultIDE: (ide: IDE) => void
  setIdeCommand: (command: string) => void
  setTheme: (theme: Theme) => void
  setLanguage: (language: string) => void
  setUrlSuffix: (suffix: string) => void
  setScanDepth: (depth: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultIDE: "vscode",
      ideCommand: "code",
      theme: "dark",
      language: "en",
      urlSuffix: "test",
      scanDepth: 2,

      setDefaultIDE: (ide) => set({ defaultIDE: ide }),
      setIdeCommand: (command) => set({ ideCommand: command }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setUrlSuffix: (suffix) => set({ urlSuffix: suffix }),
      setScanDepth: (depth) => set({ scanDepth: depth }),
    }),
    {
      name: "warden-settings",
    }
  )
)
