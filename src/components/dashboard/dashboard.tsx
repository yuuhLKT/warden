import { useTranslation } from "@/i18n"
import { useProjectStore } from "@/stores/project-store"
import { ProjectCard } from "@/components/project/project-card"
import { AddProjectDialog } from "@/components/project/add-project-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { StatsCard } from "./stats-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { FolderKanban, Server, Globe, Plus } from "lucide-react"

export function Dashboard() {
  const { t } = useTranslation()
  const { projects, selectedProjectId, getRunningServicesCount } = useProjectStore()

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const runningServices = getRunningServicesCount()
  const totalServices = projects.reduce((acc, p) => acc + p.services.length, 0)
  const uniqueUrls = new Set(projects.flatMap((p) => p.services.map((s) => s.url))).size

  const displayProjects = selectedProject ? [selectedProject] : projects

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {!selectedProject && (
        <div className="grid shrink-0 grid-cols-2 gap-2 p-3 pb-0 sm:gap-2.5 sm:p-4 lg:grid-cols-3 lg:gap-3 lg:p-5">
          <StatsCard
            title={t("dashboard.stats.projects")}
            value={projects.length}
            description={t("dashboard.stats.totalProjects")}
            icon={<FolderKanban className="text-primary size-4" />}
          />
          <StatsCard
            title={t("dashboard.stats.activeServices")}
            value={runningServices}
            description={t("dashboard.stats.ofServices", {
              total: totalServices,
            })}
            icon={<Server className="size-4 text-green-500" />}
          />
          <StatsCard
            title={t("dashboard.stats.activeUrls")}
            value={uniqueUrls}
            description={t("dashboard.stats.testDomains")}
            icon={<Globe className="size-4 text-purple-500" />}
          />
        </div>
      )}

      <ScrollArea className="flex-1 p-3 sm:p-4 lg:p-6">
        {displayProjects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="text-muted-foreground size-8" />}
            title={t("projects.noProjects")}
            description={t("projects.noProjectsDescription")}
            action={
              <AddProjectDialog
                trigger={
                  <Button className="gap-2">
                    <Plus className="size-4" />
                    {t("projects.addFirstProject")}
                  </Button>
                }
              />
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {displayProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
