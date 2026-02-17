import { useCallback } from "react"
import { useTranslation } from "@/i18n"
import { useSettingsStore } from "@/stores/settings-store"
import { settingsApi } from "@/lib/api"
import { toast } from "@/lib/toast"
import type { IDE } from "@/types/settings"

export function useIDE() {
  const { t } = useTranslation()
  const { defaultIDE, setDefaultIDE } = useSettingsStore()

  const saveIDE = useCallback(
    async (ide: IDE) => {
      try {
        setDefaultIDE(ide)
        await settingsApi.saveDefaultIDE(ide)
        toast.success(t("ide.saveSuccess"), {
          description: t("ide.saveSuccessDescription", {
            ide: ide.charAt(0).toUpperCase() + ide.slice(1),
          }),
        })
      } catch (error) {
        console.error("Failed to save IDE:", error)
        toast.error(t("ide.saveError"), {
          description: t("common.tryAgain"),
        })
      }
    },
    [setDefaultIDE, t]
  )

  const loadIDE = useCallback(async () => {
    try {
      const ide = await settingsApi.getDefaultIDE()
      if (ide) {
        setDefaultIDE(ide as IDE)
      }
    } catch (error) {
      console.error("Failed to load IDE:", error)
    }
  }, [setDefaultIDE])

  return {
    defaultIDE,
    saveIDE,
    loadIDE,
  }
}
