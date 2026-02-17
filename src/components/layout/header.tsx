import { useEffect, useState } from "react"
import { useTranslation } from "@/i18n"
import { useProjectStore } from "@/stores/project-store"
import { useUIStore } from "@/stores/ui-store"
import { useIsDesktop } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddProjectDialog } from "@/components/project/add-project-dialog"
import { Shield, Search, Moon, Sun, Menu, Plus } from "lucide-react"

export function Header() {
  const { t } = useTranslation()
  const { getSelectedProject } = useProjectStore()
  const { toggleSidebar, currentPage } = useUIStore()
  const isDesktop = useIsDesktop()
  const selectedProject = getSelectedProject()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  const getPageTitle = () => {
    if (selectedProject && currentPage === "dashboard") {
      return selectedProject.name
    }
    return t(`nav.${currentPage}`)
  }

  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {!isDesktop && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
            <Menu className="size-5" />
          </Button>
        )}

        {!isDesktop && (
          <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-primary flex size-7 items-center justify-center rounded-lg">
              <Shield className="text-primary-foreground size-3.5" />
            </div>
            <span className="font-semibold">{t("common.appName")}</span>
          </div>
        )}

        {isDesktop && <h1 className="text-lg font-semibold">{getPageTitle()}</h1>}
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 px-4 lg:gap-3">
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input placeholder={t("projects.searchProjects")} className="w-full pl-9" />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <AddProjectDialog
          trigger={
            isDesktop ? (
              <Button className="gap-2">
                <Plus className="size-4" />
                {t("projects.addProject")}
              </Button>
            ) : (
              <Button size="icon">
                <Plus className="size-4" />
              </Button>
            )
          }
        />
      </div>
    </header>
  )
}
