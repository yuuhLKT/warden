import { useState } from "react"
import { useTranslation } from "@/i18n"
import { useSettingsStore } from "@/stores/settings-store"
import { ideApi } from "@/lib/api"
import { toast } from "@/lib/toast"
import type { ProjectService } from "@/types/project"
import { IDE_CONFIGS } from "@/types/settings"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { StatusIndicator } from "@/components/common/status-indicator"
import { StackIcon } from "./stack-icon"
import { Globe, FolderOpen, Code2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ServiceRowProps {
  service: ProjectService
  onToggle: () => void
}

export function ServiceRow({ service, onToggle }: ServiceRowProps) {
  const { t } = useTranslation()
  const { defaultIDE, ideCommand } = useSettingsStore()
  const isRunning = service.status === "running"
  const [isOpeningIde, setIsOpeningIde] = useState(false)

  const handleOpenIde = () => {
    if (isOpeningIde) return

    const command = ideCommand || IDE_CONFIGS[defaultIDE].command
    const ideName = IDE_CONFIGS[defaultIDE].name

    setIsOpeningIde(true)

    toast.promise(
      ideApi.openInIde(service.path, command).finally(() => {
        // Keep the loading state briefly so the animation feels intentional
        setTimeout(() => setIsOpeningIde(false), 600)
      }),
      {
        loading: t("ide.opening", { ide: ideName }),
        success: t("ide.openSuccess", { ide: ideName }),
        error: t("ide.openError"),
      }
    )
  }

  return (
    <div className="bg-card hover:bg-accent/50 flex items-center justify-between gap-2 rounded-lg border p-2 transition-colors lg:gap-4 lg:p-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
        <StatusIndicator status={service.status} size="sm" pulse={false} />
        <StackIcon stack={service.stack} className="size-4 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-medium lg:text-sm">{service.name}</span>
            <Badge variant="outline" className="hidden text-[10px] sm:inline-flex lg:text-xs">
              {t(`projects.serviceTypes.${service.type}`)}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-[10px] lg:gap-2 lg:text-xs">
            <Globe className="size-2.5 shrink-0 lg:size-3" />
            <span className="truncate">{service.url}</span>
            <span className="text-zinc-400">:</span>
            <span>{service.port}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 lg:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 lg:size-8">
              <FolderOpen className="size-3.5 lg:size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <code className="text-xs break-all">{service.path}</code>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7 lg:size-8", isOpeningIde && "text-primary")}
              onClick={handleOpenIde}
              disabled={isOpeningIde}
            >
              {isOpeningIde ? (
                <Loader2 className="size-3.5 animate-spin lg:size-4" />
              ) : (
                <Code2 className="size-3.5 lg:size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isOpeningIde
              ? t("ide.opening", { ide: IDE_CONFIGS[defaultIDE].name })
              : t("projects.openInIde", { ide: IDE_CONFIGS[defaultIDE].name })}
          </TooltipContent>
        </Tooltip>

        <Switch checked={isRunning} onCheckedChange={onToggle} />
      </div>
    </div>
  )
}
