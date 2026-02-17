import { useCallback } from "react"
import { useTranslation } from "@/i18n"
import { useSettingsStore } from "@/stores/settings-store"
import { scanDepthApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export function useScanDepth() {
  const { t } = useTranslation()
  const { scanDepth, setScanDepth } = useSettingsStore()

  const saveDepth = useCallback(
    async (depth: number) => {
      try {
        setScanDepth(depth)
        await scanDepthApi.saveScanDepth(depth)
        toast.success(t("settings.scanDepth.saveSuccess"), {
          description: t("settings.scanDepth.saveSuccessDescription"),
        })
      } catch (error) {
        console.error("Failed to save scan depth:", error)
        toast.error(t("settings.scanDepth.saveError"), {
          description: t("common.tryAgain"),
        })
      }
    },
    [setScanDepth, t]
  )

  const loadDepth = useCallback(async () => {
    try {
      const depth = await scanDepthApi.getScanDepth()
      setScanDepth(depth)
    } catch (error) {
      console.error("Failed to load scan depth:", error)
    }
  }, [setScanDepth])

  return {
    scanDepth,
    saveDepth,
    loadDepth,
  }
}
