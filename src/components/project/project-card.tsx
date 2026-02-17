import { useTranslation } from "@/i18n"
import { Project } from "@/types/project"
import { useProjectStore } from "@/stores/project-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ServiceRow } from "./service-row"
import { StatusIndicator } from "@/components/common/status-indicator"
import { StackIcon } from "./stack-icon"
import { Layers, Play, Square, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation()
  const { toggleService, startAllServices, stopAllServices, removeProject } = useProjectStore()

  const runningServices = project.services.filter((s) => s.status === "running").length
  const totalServices = project.services.length
  const hasRunningServices = runningServices > 0
  const allRunning = runningServices === totalServices && totalServices > 0

  // Get the first service stack to display as icon, or use a default
  const primaryStack = project.services[0]?.stack || "other"

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-3 lg:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg lg:size-10">
              {project.services.length > 1 ? (
                <Layers className="text-muted-foreground size-4 lg:size-5" />
              ) : (
                <StackIcon stack={primaryStack} className="size-4 lg:size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <span className="truncate">{project.name}</span>
                {hasRunningServices && <StatusIndicator status="running" size="sm" />}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                {project.services.length}{" "}
                {project.services.length === 1 ? t("projects.service") : t("projects.services")}
              </CardDescription>
            </div>
          </div>

          <Badge
            variant={hasRunningServices ? "default" : "secondary"}
            className={cn(
              "shrink-0 text-xs",
              hasRunningServices && "bg-green-500 hover:bg-green-600"
            )}
          >
            {runningServices}/{totalServices} {t("projects.active")}
          </Badge>
        </div>

        <div className="flex items-center gap-2 pt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={allRunning ? "secondary" : "default"}
                size="sm"
                className="gap-1.5 text-xs lg:text-sm"
                onClick={() =>
                  allRunning ? stopAllServices(project.id) : startAllServices(project.id)
                }
              >
                {allRunning ? (
                  <>
                    <Square className="size-3" />
                    <span className="hidden sm:inline">{t("projects.stopAll")}</span>
                    <span className="sm:hidden">{t("common.stop")}</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3" />
                    <span className="hidden sm:inline">{t("projects.startAll")}</span>
                    <span className="sm:hidden">{t("common.start")}</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {allRunning ? t("projects.stopAllServices") : t("projects.startAllServices")}
            </TooltipContent>
          </Tooltip>

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive size-8"
                onClick={() => removeProject(project.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("projects.removeProject")}</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 p-4 pt-0 lg:p-6">
        {project.services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            onToggle={() => toggleService(project.id, service.id)}
          />
        ))}
      </CardContent>
    </Card>
  )
}
