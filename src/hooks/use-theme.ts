import { useCallback } from "react"
import { useSettingsStore } from "@/stores/settings-store"
import type { Theme } from "@/types/settings"

export const useTheme = () => {
  const { theme, setTheme } = useSettingsStore()

  const saveTheme = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme)
    },
    [setTheme]
  )

  return { theme, saveTheme }
}
