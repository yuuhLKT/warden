import { useCallback } from "react"
import { useTranslation } from "@/i18n"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { useProjectStore } from "@/stores/project-store"
import { workspaceApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export function useWorkspace() {
  const { t } = useTranslation()
  const { rootPath, setRootPath } = useWorkspaceStore()
  const { scanWorkspace } = useProjectStore()

  const saveRootPath = useCallback(
    async (path: string) => {
      try {
        setRootPath(path)
        await workspaceApi.saveRootPath(path)
        toast.success(t("workspace.saveSuccess"), {
          description: t("workspace.saveSuccessDescription"),
        })
        // Scan workspace after saving the root path
        await scanWorkspace()
      } catch {
        toast.error(t("workspace.saveError"), {
          description: t("common.tryAgain"),
        })
      }
    },
    [setRootPath, t, scanWorkspace]
  )

  const loadRootPath = useCallback(async () => {
    try {
      const path = await workspaceApi.getRootPath()
      if (path) {
        setRootPath(path)
      }
    } catch {}
  }, [setRootPath])

  return {
    rootPath,
    saveRootPath,
    loadRootPath,
  }
}
