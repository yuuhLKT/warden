import { useTranslation } from "@/i18n"
import { useSettingsStore } from "@/stores/settings-store"
import { useFolderPicker } from "@/hooks/use-folder-picker"
import { useIDE } from "@/hooks/use-ide"
import { useWorkspace } from "@/hooks/use-workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IDE_CONFIGS, type IDE, type Theme } from "@/types/settings"
import { Settings, Monitor, FolderOpen, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useSettingsStore()
  const { defaultIDE, saveIDE } = useIDE()
  const { rootPath, saveRootPath } = useWorkspace()
  const { selectFolder, isLoading } = useFolderPicker()

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const handleSelectFolder = async () => {
    const folder = await selectFolder()
    if (folder) {
      await saveRootPath(folder)
    }
  }

  const handleSelectIDE = async (ide: IDE) => {
    await saveIDE(ide)
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-muted-foreground">{t("settings.description")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              {t("settings.general.title")}
            </CardTitle>
            <CardDescription>{t("settings.general.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.general.theme")}</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("light")}
                >
                  {t("settings.general.themeLight")}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("dark")}
                >
                  {t("settings.general.themeDark")}
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("system")}
                >
                  {t("settings.general.themeSystem")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="size-5" />
              {t("settings.ide.title")}
            </CardTitle>
            <CardDescription>{t("settings.ide.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(IDE_CONFIGS) as IDE[]).map((ide) => (
                <button
                  key={ide}
                  onClick={() => handleSelectIDE(ide)}
                  className={cn(
                    "hover:bg-accent flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                    defaultIDE === ide && "border-primary bg-accent"
                  )}
                >
                  <span className="text-sm font-medium">{IDE_CONFIGS[ide].name}</span>
                  {defaultIDE === ide && <Check className="text-primary size-4" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="size-5" />
              {t("settings.workspace.title")}
            </CardTitle>
            <CardDescription>{t("settings.workspace.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground flex-1 truncate rounded-lg border bg-transparent px-3 py-2 text-sm">
                {rootPath || t("settings.workspace.noFolderSelected")}
              </div>
              <Button variant="outline" onClick={handleSelectFolder} disabled={isLoading}>
                <FolderOpen className="size-4" />
                {t("settings.workspace.changeFolder")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
