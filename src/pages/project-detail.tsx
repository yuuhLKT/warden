import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "@/i18n"
import { useProjectStore } from "@/stores/project-store"
import { useUIStore } from "@/stores/ui-store"
import { ProjectService, Stack, ServiceType } from "@/types/project"
import { serviceFormSchema, ServiceFormValues } from "@/schemas/project"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { StatusIndicator } from "@/components/common/status-indicator"
import { StackIcon } from "@/components/project/stack-icon"
import {
  Edit2,
  Save,
  X,
  Folder,
  Globe,
  Terminal,
  ArrowLeft,
  Play,
  Square,
  Trash2,
} from "lucide-react"

interface EditingService {
  id: string
  values: ServiceFormValues
}

export function ProjectDetailPage() {
  const { t } = useTranslation()
  const { navigateTo, selectedProjectId } = useUIStore()
  const { projects, updateService, startAllServices, stopAllServices, removeProject } =
    useProjectStore()

  const project = projects.find((p) => p.id === selectedProjectId)
  const [editingService, setEditingService] = useState<EditingService | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      type: "frontend",
      stack: "other",
      path: "",
      url: "",
      port: 3000,
      command: "",
    },
  })

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">{t("projects.noProjects")}</p>
        <Button onClick={() => navigateTo("dashboard")}>
          <ArrowLeft className="mr-2 size-4" />
          {t("common.back")}
        </Button>
      </div>
    )
  }

  const runningServices = project.services.filter((s) => s.status === "running").length
  const totalServices = project.services.length
  const hasRunningServices = runningServices > 0
  const allRunning = runningServices === totalServices && totalServices > 0

  const handleEditService = (service: ProjectService) => {
    const values: ServiceFormValues = {
      name: service.name,
      type: service.type,
      stack: service.stack,
      path: service.path,
      url: service.url,
      port: service.port,
      command: service.command,
    }
    setEditingService({ id: service.id, values })
    reset(values)
  }

  const handleCancelEdit = () => {
    setEditingService(null)
    reset()
  }

  const onSubmit = async (data: ServiceFormValues) => {
    if (!project || !editingService) return

    setIsSaving(true)

    toast.promise(
      updateService(project.id, editingService.id, {
        name: data.name,
        type: data.type,
        stack: data.stack,
        path: data.path,
        url: data.url,
        port: data.port,
        command: data.command,
      })
        .then(() => {
          setEditingService(null)
          reset()
        })
        .finally(() => setIsSaving(false)),
      {
        loading: t("common.saving"),
        success: t("common.success"),
        error: t("common.error"),
      }
    )
  }

  const handleDeleteProject = () => {
    toast.promise(removeProject(project.id), {
      loading: t("common.loading"),
      success: () => {
        navigateTo("dashboard")
        return t("common.success")
      },
      error: t("common.error"),
    })
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

  const serviceTypes: ServiceType[] = ["frontend", "backend"]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateTo("dashboard")}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              {project.name}
              {hasRunningServices && <StatusIndicator status="running" size="sm" />}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Folder className="size-4" />
              <code className="text-xs">{project.folder}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={hasRunningServices ? "default" : "secondary"}
            className={cn(hasRunningServices && "bg-green-500 hover:bg-green-600")}
          >
            {runningServices}/{totalServices} {t("projects.active")}
          </Badge>

          <Button
            variant={allRunning ? "secondary" : "default"}
            size="sm"
            onClick={() =>
              allRunning ? stopAllServices(project.id) : startAllServices(project.id)
            }
          >
            {allRunning ? (
              <>
                <Square className="mr-2 size-4" />
                {t("projects.stopAll")}
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                {t("projects.startAll")}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={handleDeleteProject}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("projectDetail.servicesList")}</h2>
            <Badge variant="secondary">
              {totalServices} {totalServices === 1 ? t("projects.service") : t("projects.services")}
            </Badge>
          </div>

          {project.services.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">{t("projectDetail.noServices")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {project.services.map((service) => (
                <Card
                  key={service.id}
                  className={cn(
                    "transition-all",
                    editingService?.id === service.id && "border-primary"
                  )}
                >
                  {editingService?.id === service.id ? (
                    <CardContent className="p-6">
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{t("services.editService")}</h3>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={isSaving}>
                              <Save className="mr-2 size-4" />
                              {t("common.save")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              <X className="mr-2 size-4" />
                              {t("common.cancel")}
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">{t("services.serviceName")}</Label>
                            <Input
                              id="name"
                              {...register("name")}
                              placeholder={t("services.serviceNamePlaceholder")}
                            />
                            {errors.name && (
                              <p className="text-destructive text-xs">{errors.name.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>{t("services.serviceType")}</Label>
                            <Select
                              value={watch("type")}
                              onValueChange={(value: ServiceType) => setValue("type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {serviceTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {t(`projects.serviceTypes.${type}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>{t("services.stack")}</Label>
                            <Select
                              value={watch("stack")}
                              onValueChange={(value: Stack) => setValue("stack", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stacks.map((stack) => (
                                  <SelectItem key={stack} value={stack}>
                                    {t(`projects.stacks.${stack}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="port">{t("services.port")}</Label>
                            <Input
                              id="port"
                              type="number"
                              {...register("port", { valueAsNumber: true })}
                              placeholder={t("services.portPlaceholder")}
                            />
                            {errors.port && (
                              <p className="text-destructive text-xs">{errors.port.message}</p>
                            )}
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="path">{t("services.path")}</Label>
                            <div className="relative">
                              <Folder className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <Input
                                id="path"
                                {...register("path")}
                                placeholder={t("services.pathPlaceholder")}
                                className="pl-10"
                              />
                            </div>
                            {errors.path && (
                              <p className="text-destructive text-xs">{errors.path.message}</p>
                            )}
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="url">{t("services.url")}</Label>
                            <div className="relative">
                              <Globe className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <Input
                                id="url"
                                {...register("url")}
                                placeholder={t("services.urlPlaceholder")}
                                className="pl-10"
                              />
                            </div>
                            {errors.url && (
                              <p className="text-destructive text-xs">{errors.url.message}</p>
                            )}
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="command">{t("services.command")}</Label>
                            <div className="relative">
                              <Terminal className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <Input
                                id="command"
                                {...register("command")}
                                placeholder={t("services.commandPlaceholder")}
                                className="pl-10 font-mono"
                              />
                            </div>
                            {errors.command && (
                              <p className="text-destructive text-xs">{errors.command.message}</p>
                            )}
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  ) : (
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <StatusIndicator status={service.status} size="md" />
                            <StackIcon stack={service.stack} className="size-5" />
                            <div>
                              <CardTitle className="text-lg">{service.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {t(`projects.serviceTypes.${service.type}`)}
                                </Badge>
                                <Badge variant="secondary">
                                  {t(`projects.stacks.${service.stack}`)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit2 className="mr-2 size-4" />
                              {t("common.edit")}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid gap-4 text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-1 items-center gap-2">
                              <Folder className="text-muted-foreground size-4" />
                              <code className="bg-muted rounded px-2 py-1 text-xs">
                                {service.path}
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <Globe className="text-muted-foreground size-4" />
                              <span>
                                {service.url}:{service.port}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Terminal className="text-muted-foreground size-4" />
                            <code className="bg-muted rounded px-2 py-1 text-xs">
                              {service.command}
                            </code>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
