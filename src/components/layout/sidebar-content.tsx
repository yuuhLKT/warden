import { useTranslation } from "@/i18n"
import { useProjectStore } from "@/stores/project-store"
import { useUIStore, type Page } from "@/stores/ui-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StackIcon } from "@/components/project/stack-icon"
import { StatusIndicator } from "@/components/common/status-indicator"
import { AddProjectDialog } from "@/components/project/add-project-dialog"
import {
  Shield,
  LayoutDashboard,
  Settings,
  Activity,
  Plus,
  Folder,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

function getProjectMainStack(project: Project) {
  if (project.services.length === 0) return null
  return project.services[0].stack
}

interface SidebarContentProps {
  onNavigate?: () => void
  collapsed?: boolean
}

export function SidebarContent({ onNavigate, collapsed = false }: SidebarContentProps) {
  const { t } = useTranslation()
  const { projects, selectedProjectId, selectProject, getRunningServicesCount } = useProjectStore()
  const { setSidebarOpen, currentPage, navigateTo, sidebarCollapsed, toggleSidebarCollapsed } =
    useUIStore()

  const runningCount = getRunningServicesCount()

  const handleSelectProject = (id: string | null) => {
    selectProject(id)
    navigateTo("dashboard")
    onNavigate?.()
    setSidebarOpen(false)
  }

  const handleNavClick = (page: Page) => {
    selectProject(null)
    navigateTo(page)
    onNavigate?.()
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 items-center border-b",
          collapsed ? "justify-center px-2" : "gap-2 px-4"
        )}
      >
        <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Shield className="text-primary-foreground size-4" />
        </div>
        {!collapsed && (
          <>
            <span className="text-lg font-semibold">{t("common.appName")}</span>
            {runningCount > 0 && (
              <Badge variant="secondary" className="ml-auto bg-green-500/10 text-green-500">
                {runningCount} {runningCount > 1 ? t("projects.actives") : t("projects.active")}
              </Badge>
            )}
          </>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-2">
        <Button
          variant="ghost"
          className={cn(
            collapsed ? "justify-center" : "justify-start gap-2",
            currentPage === "dashboard" && "bg-accent"
          )}
          onClick={() => handleNavClick("dashboard")}
          title={collapsed ? t("nav.dashboard") : undefined}
        >
          <LayoutDashboard className="size-4" />
          {!collapsed && t("nav.dashboard")}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            collapsed ? "justify-center" : "justify-start gap-2",
            currentPage === "monitor" && "bg-accent"
          )}
          onClick={() => handleNavClick("monitor")}
          title={collapsed ? t("nav.monitor") : undefined}
        >
          <Activity className="size-4" />
          {!collapsed && t("nav.monitor")}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            collapsed ? "justify-center" : "justify-start gap-2",
            currentPage === "settings" && "bg-accent"
          )}
          onClick={() => handleNavClick("settings")}
          title={collapsed ? t("nav.settings") : undefined}
        >
          <Settings className="size-4" />
          {!collapsed && t("nav.settings")}
        </Button>
      </nav>

      <Separator className="my-2" />

      <div
        className={cn(
          "flex items-center justify-between py-2",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        {!collapsed && (
          <span className="text-muted-foreground text-xs font-medium uppercase">
            {t("nav.projects")}
          </span>
        )}
        <AddProjectDialog
          trigger={
            <Button variant="ghost" size="icon" className="size-6">
              <Plus className="size-3" />
            </Button>
          }
        />
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {projects.length === 0
            ? !collapsed && (
                <p className="text-muted-foreground px-2 py-4 text-center text-xs">
                  {t("projects.noProjects")}
                </p>
              )
            : projects.map((project) => {
                const runningServices = project.services.filter(
                  (s) => s.status === "running"
                ).length
                const isSelected = selectedProjectId === project.id && currentPage === "dashboard"
                const mainStack = getProjectMainStack(project)

                return (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className={cn(
                      "hover:bg-accent flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors",
                      isSelected && "bg-accent",
                      collapsed ? "justify-center px-2" : "px-3"
                    )}
                    title={collapsed ? project.name : undefined}
                  >
                    {mainStack ? (
                      <StackIcon stack={mainStack} className="size-4 shrink-0" />
                    ) : (
                      <Folder className="size-4 shrink-0" />
                    )}
                    {!collapsed && (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{project.name}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {project.services.length}{" "}
                            {project.services.length > 1
                              ? t("projects.services")
                              : t("projects.service")}
                          </p>
                        </div>
                        {runningServices > 0 && <StatusIndicator status="running" size="sm" />}
                      </>
                    )}
                  </button>
                )
              })}
        </div>
      </ScrollArea>

      <Separator className="my-2" />

      <div className={cn("p-2", collapsed ? "flex justify-center" : "flex justify-end px-4")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-muted-foreground text-xs">
            {t("common.appName")} {t("common.version")}
          </p>
        </div>
      )}
    </div>
  )
}
