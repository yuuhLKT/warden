import { useState } from "react"
import { useTranslation } from "@/i18n"
import { useProjectStore } from "@/stores/project-store"
import { useProjectForm } from "@/hooks/use-project-form"
import { useIsMobile } from "@/hooks/use-media-query"
import { useWorkspace } from "@/hooks/use-workspace"
import { useFolderPicker } from "@/hooks/use-folder-picker"
import { useGit } from "@/hooks/use-git"
import { useUrlSuffix } from "@/hooks/use-url-suffix"
import type { Stack, ServiceType } from "@/types/project"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StackIcon } from "@/components/project/stack-icon"
import { Plus, Trash2, FolderOpen, Github, FolderKanban, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = "choose" | "new-project" | "github"

interface AddProjectDialogProps {
  trigger?: React.ReactNode
}

const stacks: Stack[] = [
  "react",
  "next",
  "vue",
  "angular",
  "svelte",
  "node",
  "express",
  "nestjs",
  "laravel",
  "php",
  "django",
  "flask",
  "rails",
  "go",
  "rust",
  "other",
]

export function AddProjectDialog({ trigger }: AddProjectDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("choose")
  const isMobile = useIsMobile()
  const { addProject } = useProjectStore()
  const { rootPath } = useWorkspace()
  const { selectFolder, isLoading: isSelectingFolder } = useFolderPicker()
  const { clone: cloneRepo, isCloning } = useGit()
  const { urlSuffix } = useUrlSuffix()
  const {
    formData,
    errors,
    updateField,
    updateServiceField,
    addService,
    removeService,
    validate,
    reset,
  } = useProjectForm()

  const [githubData, setGithubData] = useState({
    name: "",
    gitUrl: "",
    folder: rootPath || "",
  })
  const [githubErrors, setGithubErrors] = useState<Record<string, string>>({})

  const handleSelectProjectFolder = async () => {
    const folder = await selectFolder()
    if (folder) {
      updateField("folder", folder)
    }
  }

  const handleSelectGithubFolder = async () => {
    const folder = await selectFolder()
    if (folder) {
      setGithubData((prev) => ({ ...prev, folder }))
      setGithubErrors((prev) => ({ ...prev, folder: "" }))
    }
  }

  const handleSelectServiceFolder = async (index: number) => {
    const folder = await selectFolder()
    if (folder) {
      updateServiceField(index, "path", folder)
    }
  }

  const handleSubmit = () => {
    if (validate()) {
      addProject(formData)
      handleClose()
    }
  }

  const handleGithubSubmit = async () => {
    const newErrors: Record<string, string> = {}
    if (!githubData.name) {
      newErrors.name = t("validation.required")
    }
    if (!githubData.gitUrl) {
      newErrors.gitUrl = t("validation.required")
    } else if (!githubData.gitUrl.startsWith("https://github.com/")) {
      newErrors.gitUrl = t("validation.invalidGithubUrl")
    }
    if (!githubData.folder) {
      newErrors.folder = t("validation.required")
    }

    if (Object.keys(newErrors).length > 0) {
      setGithubErrors(newErrors)
      return
    }

    const success = await cloneRepo(githubData.gitUrl, githubData.folder)
    if (success) {
      // Criar projeto no banco após clonar
      try {
        await addProject({
          name: githubData.name,
          folder: githubData.folder,
          services: [
            {
              name: "main",
              type: "backend",
              stack: "node",
              path: githubData.folder,
              url: `${githubData.name.toLowerCase().replace(/\s+/g, "-")}.${urlSuffix}`,
              port: 3000,
              command: "npm run dev",
            },
          ],
        })
        handleClose()
      } catch (error) {
        console.error("Failed to create project after clone:", error)
      }
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setStep("choose")
      reset()
      setGithubData({ name: "", gitUrl: "", folder: rootPath || "" })
      setGithubErrors({})
    }, 200)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    } else {
      setOpen(true)
    }
  }

  const renderChooseStep = () => (
    <div className="grid grid-cols-2 gap-4 py-4">
      <button
        type="button"
        onClick={() => setStep("new-project")}
        className="hover:bg-accent flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors"
      >
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
          <FolderKanban className="text-primary size-6" />
        </div>
        <div className="text-center">
          <p className="font-medium">{t("projects.newProject")}</p>
          <p className="text-muted-foreground text-xs">{t("projects.newProjectDescription")}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setStep("github")}
        className="hover:bg-accent flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors"
      >
        <div className="flex size-12 items-center justify-center rounded-lg bg-black dark:bg-white">
          <Github className="size-6 text-white dark:text-black" />
        </div>
        <div className="text-center">
          <p className="font-medium">{t("projects.cloneFromGithub")}</p>
          <p className="text-muted-foreground text-xs">
            {t("projects.cloneFromGithubDescription")}
          </p>
        </div>
      </button>
    </div>
  )

  const renderGithubStep = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="github-name">{t("projects.projectName")}</Label>
        <Input
          id="github-name"
          placeholder={t("projects.projectNamePlaceholder")}
          value={githubData.name}
          onChange={(e) => {
            setGithubData((prev) => ({ ...prev, name: e.target.value }))
            setGithubErrors((prev) => ({ ...prev, name: "" }))
          }}
          className={githubErrors.name ? "border-destructive" : ""}
        />
        {githubErrors.name && <p className="text-destructive text-xs">{githubErrors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="gitUrl">{t("projects.gitUrl")}</Label>
        <Input
          id="gitUrl"
          placeholder={t("projects.gitUrlPlaceholder")}
          value={githubData.gitUrl}
          onChange={(e) => {
            setGithubData((prev) => ({ ...prev, gitUrl: e.target.value }))
            setGithubErrors((prev) => ({ ...prev, gitUrl: "" }))
          }}
          className={githubErrors.gitUrl ? "border-destructive" : ""}
        />
        {githubErrors.gitUrl && <p className="text-destructive text-xs">{githubErrors.gitUrl}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="github-folder">{t("projects.clonePath")}</Label>
        <div className="relative">
          <Input
            id="github-folder"
            placeholder={t("projects.defaultClonePathPlaceholder")}
            value={githubData.folder}
            onChange={(e) => {
              setGithubData((prev) => ({ ...prev, folder: e.target.value }))
              setGithubErrors((prev) => ({ ...prev, folder: "" }))
            }}
            className={cn("pr-10", githubErrors.folder ? "border-destructive" : "")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 size-9"
            onClick={handleSelectGithubFolder}
            disabled={isSelectingFolder}
          >
            <FolderOpen className="size-4" />
          </Button>
        </div>
        {githubErrors.folder && <p className="text-destructive text-xs">{githubErrors.folder}</p>}
      </div>
    </div>
  )

  const renderNewProjectStep = () => (
    <ScrollArea className={cn(isMobile ? "h-[calc(100dvh-200px)]" : "max-h-[60vh]")}>
      <div className="space-y-6 py-4 pr-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("projects.projectName")}</Label>
            <Input
              id="name"
              placeholder={t("projects.projectNamePlaceholder")}
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder">{t("projects.selectFolder")}</Label>
            <div className="relative">
              <Input
                id="folder"
                placeholder={t("projects.defaultFolderPlaceholder")}
                value={formData.folder}
                onChange={(e) => updateField("folder", e.target.value)}
                className={cn("pr-10", errors.folder ? "border-destructive" : "")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 size-9"
                onClick={handleSelectProjectFolder}
                disabled={isSelectingFolder}
              >
                <FolderOpen className="size-4" />
              </Button>
            </div>
            {errors.folder && <p className="text-destructive text-xs">{errors.folder}</p>}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">{t("services.title")}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addService}
              className="gap-1"
            >
              <Plus className="size-3" />
              {t("services.addService")}
            </Button>
          </div>

          <div className="space-y-6">
            {formData.services.map((service, index) => (
              <div key={index} className="bg-muted/30 space-y-5 rounded-lg border p-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                    {t("projects.serviceNumber", { number: index + 1 })}
                  </Badge>
                  {formData.services.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 size-7"
                      onClick={() => removeService(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                {/* Linha 1: Stack, Nome, Tipo, Porta */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("services.stack")}</Label>
                    <Select
                      value={service.stack}
                      onValueChange={(value) => updateServiceField(index, "stack", value as Stack)}
                    >
                      <SelectTrigger className="h-10 w-full [&>span]:line-clamp-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stacks.map((stack) => (
                          <SelectItem key={stack} value={stack}>
                            <div className="flex items-center gap-2">
                              <StackIcon stack={stack} className="size-4" />
                              <span>{t(`projects.stacks.${stack}`)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("services.serviceName")}</Label>
                    <Input
                      placeholder={t("services.serviceNamePlaceholder")}
                      value={service.name}
                      onChange={(e) => updateServiceField(index, "name", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("services.serviceType")}</Label>
                    <Select
                      value={service.type}
                      onValueChange={(value) =>
                        updateServiceField(index, "type", value as ServiceType)
                      }
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frontend">
                          {t("projects.serviceTypes.frontend")}
                        </SelectItem>
                        <SelectItem value="backend">
                          {t("projects.serviceTypes.backend")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("services.port")}</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={t("services.portPlaceholder")}
                      value={service.port}
                      onChange={(e) =>
                        updateServiceField(index, "port", parseInt(e.target.value) || 3000)
                      }
                      className="h-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Linha 2: Caminho e URL */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("services.path")}</Label>
                    <div className="relative">
                      <Input
                        placeholder={t("services.pathPlaceholder")}
                        value={service.path}
                        onChange={(e) => updateServiceField(index, "path", e.target.value)}
                        className="h-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-10 w-10"
                        onClick={() => handleSelectServiceFolder(index)}
                        disabled={isSelectingFolder}
                      >
                        <FolderOpen className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("services.url")}</Label>
                    <Input
                      placeholder={t("services.urlPlaceholder")}
                      value={service.url}
                      onChange={(e) => updateServiceField(index, "url", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Linha 3: Comando */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t("services.command")}</Label>
                  <Input
                    placeholder={t("services.commandPlaceholder")}
                    value={service.command}
                    onChange={(e) => updateServiceField(index, "command", e.target.value)}
                    className="h-10 font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          {errors.services && <p className="text-destructive text-xs">{errors.services}</p>}
        </div>
      </div>
    </ScrollArea>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("projects.addProject")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-w-2xl",
          isMobile && "h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none p-4"
        )}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "choose" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setStep("choose")}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <DialogTitle>
              {step === "choose" && t("projects.addProject")}
              {step === "new-project" && t("projects.newProject")}
              {step === "github" && t("projects.cloneFromGithub")}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === "choose" && t("projects.dialog.chooseDescription")}
            {step === "new-project" && t("projects.dialog.newProjectDescription")}
            {step === "github" && t("projects.dialog.githubDescription")}
          </DialogDescription>
        </DialogHeader>

        {step === "choose" && renderChooseStep()}
        {step === "github" && renderGithubStep()}
        {step === "new-project" && renderNewProjectStep()}

        {step !== "choose" && (
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("choose")}
              className="w-full sm:w-auto"
            >
              {t("common.back")}
            </Button>
            <Button
              onClick={step === "github" ? handleGithubSubmit : handleSubmit}
              disabled={step === "github" && isCloning}
              className="w-full sm:w-auto"
            >
              {step === "github" ? t("projects.cloneProject") : t("projects.createProject")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
