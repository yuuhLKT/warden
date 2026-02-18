import { useCallback } from "react"
import { useTranslation } from "@/i18n"
import { useSettingsStore } from "@/stores/settings-store"
import { settingsApi } from "@/lib/api"
import { IDE_CONFIGS } from "@/types/settings"
import { toast } from "@/lib/toast"
import type { IDE } from "@/types/settings"

export function useIDE() {
  const { t } = useTranslation()
  const { defaultIDE, ideCommand, setDefaultIDE, setIdeCommand } = useSettingsStore()

  const saveIDE = useCallback(
    async (ide: IDE) => {
      try {
        const defaultCommand = IDE_CONFIGS[ide].command
        setDefaultIDE(ide)
        setIdeCommand(defaultCommand)
        await settingsApi.saveDefaultIDE(ide)
        await settingsApi.saveIdeCommand(defaultCommand)
        toast.success(t("ide.saveSuccess"), {
          description: t("ide.saveSuccessDescription", {
            ide: ide.charAt(0).toUpperCase() + ide.slice(1),
          }),
        })
      } catch {
        toast.error(t("ide.saveError"), {
          description: t("common.tryAgain"),
        })
      }
    },
    [setDefaultIDE, setIdeCommand, t]
  )

  const saveIdeCommandOverride = useCallback(
    async (command: string) => {
      try {
        setIdeCommand(command)
        await settingsApi.saveIdeCommand(command)
        toast.success(t("ide.commandSaveSuccess"), {
          description: t("ide.commandSaveSuccessDescription"),
        })
      } catch {
        toast.error(t("ide.saveError"), {
          description: t("common.tryAgain"),
        })
      }
    },
    [setIdeCommand, t]
  )

  const loadIDE = useCallback(async () => {
    try {
      const [ide, command] = await Promise.all([
        settingsApi.getDefaultIDE(),
        settingsApi.getIdeCommand(),
      ])
      if (ide) {
        setDefaultIDE(ide as IDE)
      }
      if (command) {
        setIdeCommand(command)
      }
    } catch {}
  }, [setDefaultIDE, setIdeCommand])

  return {
    defaultIDE,
    ideCommand,
    saveIDE,
    saveIdeCommandOverride,
    loadIDE,
  }
}
