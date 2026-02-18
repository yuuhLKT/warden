import { useState, useCallback } from "react"
import { useTranslation } from "@/i18n"
import { open } from "@tauri-apps/plugin-dialog"

export function useFolderPicker() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const selectFolder = useCallback(async (): Promise<string | null> => {
    setIsLoading(true)
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t("common.selectFolder"),
      })
      return selected as string | null
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [t])

  return { selectFolder, isLoading }
}
