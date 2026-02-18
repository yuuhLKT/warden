import { useState } from "react"
import { useTranslation } from "@/i18n"
import { useScaffold } from "@/hooks/use-scaffold"
import { useWorkspace } from "@/hooks/use-workspace"
import { useFolderPicker } from "@/hooks/use-folder-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  PACKAGE_MANAGER_CONFIGS,
  LANGUAGE_CONFIGS,
  SCAFFOLD_PACKAGE_MANAGERS,
} from "@/lib/constants"
import { Plus, ArrowLeft, FolderOpen, Loader2, Check, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScaffoldProjectDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function ScaffoldProjectDialog({ trigger, onSuccess }: ScaffoldProjectDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { rootPath } = useWorkspace()
  const { selectFolder, isLoading: isSelectingFolder } = useFolderPicker()
  const {
    state,
    formData,
    errors,
    selectPackageManager,
    selectTemplate,
    updateFormField,
    goBack,
    executeScaffold,
    reset,
    getFilteredTemplates,
    getCommandPreview,
  } = useScaffold()

  const handleSelectFolder = async () => {
    const folder = await selectFolder()
    if (folder) {
      updateFormField("folder", folder)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false)
      setTimeout(() => {
        reset()
      }, 200)
    } else {
      if (rootPath && !formData.folder) {
        updateFormField("folder", rootPath)
      }
      setOpen(true)
    }
  }

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
    setTimeout(() => reset(), 200)
  }

  const renderPackageManagerStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t("scaffold.selectPackageManager")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("scaffold.selectPackageManagerDescription")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {SCAFFOLD_PACKAGE_MANAGERS.map((pm) => {
          const config = PACKAGE_MANAGER_CONFIGS[pm]
          return (
            <button
              key={pm}
              onClick={() => selectPackageManager(pm)}
              className="hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors"
            >
              <span className="text-2xl">{config.icon}</span>
              <span className="text-sm font-medium">{config.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderTemplateStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold">{t("scaffold.selectTemplate")}</h3>
          <p className="text-muted-foreground text-sm">{t("scaffold.selectTemplateDescription")}</p>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid gap-3 pr-4">
          {getFilteredTemplates().map((template) => (
            <Card
              key={template.id}
              className="hover:border-primary cursor-pointer transition-colors"
              onClick={() => selectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-lg text-lg"
                      style={{
                        backgroundColor: `${LANGUAGE_CONFIGS[template.language].color}20`,
                      }}
                    >
                      {PACKAGE_MANAGER_CONFIGS[template.packageManager].icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  const renderConfigureStep = () => {
    if (!state.selectedTemplate) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{t("scaffold.configureProject")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("scaffold.configureProjectDescription")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">{t("scaffold.projectName")}</Label>
            <Input
              id="project-name"
              placeholder="my-awesome-project"
              value={formData.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-folder">{t("scaffold.projectFolder")}</Label>
            <div className="relative">
              <Input
                id="project-folder"
                placeholder={t("projects.defaultFolderPlaceholder")}
                value={formData.folder}
                onChange={(e) => updateFormField("folder", e.target.value)}
                className={cn("pr-10", errors.folder && "border-destructive")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 size-9"
                onClick={handleSelectFolder}
                disabled={isSelectingFolder}
              >
                <FolderOpen className="size-4" />
              </Button>
            </div>
            {errors.folder && <p className="text-destructive text-xs">{errors.folder}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-url">{t("scaffold.projectUrl")}</Label>
              <Input
                id="project-url"
                placeholder="my-project.test"
                value={formData.url}
                onChange={(e) => updateFormField("url", e.target.value)}
                className={cn(errors.url && "border-destructive")}
              />
              {errors.url && <p className="text-destructive text-xs">{errors.url}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-port">{t("scaffold.projectPort")}</Label>
              <Input
                id="project-port"
                type="number"
                value={formData.port}
                onChange={(e) => updateFormField("port", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <Separator />

          <div className="bg-muted rounded-lg p-4">
            <div className="mb-2 flex items-center gap-2">
              <Terminal className="size-4" />
              <span className="text-sm font-medium">{t("scaffold.commandPreview")}</span>
            </div>
            <code className="block overflow-x-auto rounded bg-black px-3 py-2 text-xs break-all whitespace-pre-wrap text-green-400">
              {getCommandPreview()}
            </code>
          </div>
        </div>
      </div>
    )
  }

  const renderExecutingStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="text-primary mb-4 size-12 animate-spin" />
      <h3 className="text-lg font-semibold">{t("scaffold.creatingProject")}</h3>
      <p className="text-muted-foreground text-sm">{t("scaffold.pleaseWait")}</p>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10">
        <Check className="size-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold">{t("scaffold.successTitle")}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{t("scaffold.successDescription")}</p>
      <Button onClick={handleSuccess}>{t("common.close")}</Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="size-4" />
            <span>{t("scaffold.title")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {state.step !== "package-manager" &&
              state.step !== "executing" &&
              state.step !== "success" && (
                <Button variant="ghost" size="icon" onClick={goBack}>
                  <ArrowLeft className="size-4" />
                </Button>
              )}
            <DialogTitle>
              {state.step === "package-manager" && t("scaffold.title")}
              {state.step === "template" && t("scaffold.selectTemplate")}
              {state.step === "configure" && t("scaffold.configureProject")}
              {state.step === "executing" && t("scaffold.creatingProject")}
              {state.step === "success" && t("scaffold.successTitle")}
            </DialogTitle>
          </div>
          <DialogDescription>
            {state.step === "package-manager" && t("scaffold.selectPackageManagerDescription")}
            {state.step === "template" && t("scaffold.selectTemplateDescription")}
            {state.step === "configure" && t("scaffold.configureProjectDescription")}
          </DialogDescription>
        </DialogHeader>

        {state.step === "package-manager" && renderPackageManagerStep()}
        {state.step === "template" && renderTemplateStep()}
        {state.step === "configure" && renderConfigureStep()}
        {state.step === "executing" && renderExecutingStep()}
        {state.step === "success" && renderSuccessStep()}

        {state.step === "configure" && (
          <DialogFooter>
            <Button variant="outline" onClick={goBack}>
              {t("common.back")}
            </Button>
            <Button onClick={executeScaffold} disabled={state.isLoading}>
              {t("scaffold.createProject")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
