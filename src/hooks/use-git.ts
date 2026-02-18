import { useCallback, useState } from "react"
import { useTranslation } from "@/i18n"
import { gitApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export function useGit() {
  const { t } = useTranslation()
  const [isCloning, setIsCloning] = useState(false)

  const clone = useCallback(
    async (url: string, destination: string): Promise<boolean> => {
      setIsCloning(true)
      try {
        await gitApi.clone(url, destination)
        toast.success(t("git.cloneSuccess"), {
          description: t("git.cloneSuccessDescription"),
        })
        return true
      } catch {
        toast.error(t("git.cloneError"), {
          description: t("git.cloneErrorDescription"),
        })
        return false
      } finally {
        setIsCloning(false)
      }
    },
    [t]
  )

  return {
    clone,
    isCloning,
  }
}
