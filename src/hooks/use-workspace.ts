import { useCallback } from "react"
import { useTranslation } from "@/i18n"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { workspaceApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export function useWorkspace() {
  const { t } = useTranslation()
  const { rootPath, setRootPath } = useWorkspaceStore()

  const saveRootPath = useCallback(
    async (path: string) => {
      try {
        setRootPath(path)
        await workspaceApi.saveRootPath(path)
        toast.success(t("workspace.saveSuccess"), {
          description: t("workspace.saveSuccessDescription"),
        })
      } catch (error) {
        console.error("Failed to save root path:", error)
        toast.error(t("workspace.saveError"), {
          description: t("common.tryAgain"),
        })
      }
    },
    [setRootPath, t]
  )

  const loadRootPath = useCallback(async () => {
    try {
      const path = await workspaceApi.getRootPath()
      if (path) {
        setRootPath(path)
      }
    } catch (error) {
      console.error("Failed to load root path:", error)
    }
  }, [setRootPath])

  return {
    rootPath,
    saveRootPath,
    loadRootPath,
  }
}
