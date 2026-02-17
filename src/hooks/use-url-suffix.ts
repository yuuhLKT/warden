import { useCallback } from "react"
import { useTranslation } from "@/i18n"
import { useSettingsStore } from "@/stores/settings-store"
import { urlApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export function useUrlSuffix() {
  const { t } = useTranslation()
  const { urlSuffix, setUrlSuffix } = useSettingsStore()

  const saveSuffix = useCallback(
    async (suffix: string) => {
      try {
        setUrlSuffix(suffix)
        await urlApi.setDefaultSuffix(suffix)
        toast.success(t("url.saveSuccess"), {
          description: t("url.saveSuccessDescription"),
        })
      } catch (error) {
        console.error("Failed to save URL Suffix:", error)
        toast.error(t("url.saveError"), {
          description: t("common.tryAgain"),
        })
      }
    },
    [setUrlSuffix, t]
  )

  const loadSuffix = useCallback(async () => {
    try {
      const suffix = await urlApi.getSuffix()
      if (suffix) {
        setUrlSuffix(suffix)
      }
    } catch (error) {
      console.error("Failed to load URL Suffix:", error)
    }
  }, [setUrlSuffix])

  return {
    urlSuffix,
    saveSuffix,
    loadSuffix,
  }
}
