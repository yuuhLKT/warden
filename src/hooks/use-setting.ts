/**
 * Generic setting hook factory
 * Eliminates duplication between use-workspace, use-url-suffix, use-scan-depth, use-ide
 */

import { useState, useCallback, useEffect } from "react"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/i18n"

interface UseSettingOptions<T> {
  load: () => Promise<T | null>
  save: (value: T) => Promise<void>
  messages: {
    saveSuccess?: string
    saveSuccessDescription?: string
    saveError?: string
    saveErrorDescription?: string
  }
}

interface UseSettingReturn<T> {
  value: T | null
  isLoading: boolean
  error: string | null
  loadValue: () => Promise<void>
  saveValue: (value: T) => Promise<void>
}

export function createUseSettingHook<T>(options: UseSettingOptions<T>) {
  return function useSetting(): UseSettingReturn<T> {
    const { t } = useTranslation()
    const [value, setValue] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadValue = useCallback(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await options.load()
        setValue(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setIsLoading(false)
      }
    }, [])

    const saveValue = useCallback(
      async (newValue: T) => {
        try {
          setIsLoading(true)
          setError(null)
          await options.save(newValue)
          setValue(newValue)

          toast.success(
            options.messages.saveSuccess || t("common.success"),
            options.messages.saveSuccessDescription
              ? { description: options.messages.saveSuccessDescription }
              : undefined
          )
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Failed to save"
          setError(errorMsg)

          toast.error(
            options.messages.saveError || t("common.error"),
            options.messages.saveErrorDescription || errorMsg
              ? { description: options.messages.saveErrorDescription || errorMsg }
              : undefined
          )
        } finally {
          setIsLoading(false)
        }
      },
      [t]
    )

    useEffect(() => {
      loadValue()
    }, [loadValue])

    return {
      value,
      isLoading,
      error,
      loadValue,
      saveValue,
    }
  }
}

// Pre-configured hooks using the factory
import { workspaceApi, urlApi, scanDepthApi } from "@/lib/api"

export const useWorkspaceSetting = createUseSettingHook<string>({
  load: workspaceApi.getRootPath,
  save: workspaceApi.saveRootPath,
  messages: {
    saveSuccess: "workspace.saveSuccess",
    saveSuccessDescription: "workspace.saveSuccessDescription",
    saveError: "workspace.saveError",
  },
})

export const useUrlSuffixSetting = createUseSettingHook<string>({
  load: urlApi.getSuffix,
  save: urlApi.setDefaultSuffix,
  messages: {
    saveSuccess: "url.saveSuccess",
    saveSuccessDescription: "url.saveSuccessDescription",
    saveError: "url.saveError",
  },
})

export const useScanDepthSetting = createUseSettingHook<number>({
  load: scanDepthApi.getScanDepth,
  save: scanDepthApi.saveScanDepth,
  messages: {
    saveSuccess: "scanDepth.saveSuccess",
    saveSuccessDescription: "scanDepth.saveSuccessDescription",
    saveError: "scanDepth.saveError",
  },
})
