import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "@/i18n"
import { useProjectStore } from "@/stores/project-store"
import { STACKS, SERVICE_TYPES } from "@/lib/constants"
import type { Project, ProjectService, Stack, ServiceType } from "@/types/project"
import { serviceFormSchema, ServiceFormValues } from "@/schemas/project"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { StatusIndicator } from "@/components/common/status-indicator"
import { StackIcon } from "./stack-icon"
import { Edit2, Save, X, Folder, Globe, Terminal } from "lucide-react"

interface ProjectDetailSheetProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EditingService {
  id: string
  values: ServiceFormValues
}

export function ProjectDetailSheet({ project, open, onOpenChange }: ProjectDetailSheetProps) {
  const { t } = useTranslation()
  const { updateService } = useProjectStore()
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

  if (!project) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg lg:max-w-xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            {project.name}
            {project.services.some((s) => s.status === "running") && (
              <StatusIndicator status="running" size="sm" />
            )}
          </SheetTitle>
          <SheetDescription>
            <div className="flex items-center gap-2 text-xs">
              <Folder className="size-3" />
              <code className="truncate">{project.folder}</code>
            </div>
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="ml-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{t("projectDetail.servicesList")}</h3>
            <Badge variant="secondary">
              {project.services.length}{" "}
              {project.services.length === 1 ? t("projects.service") : t("projects.services")}
            </Badge>
          </div>

          <ScrollArea className="h-[calc(100vh-240px)] pr-4">
            <div className="space-y-4">
              {project.services.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  {t("projectDetail.noServices")}
                </div>
              ) : (
                project.services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "rounded-lg border p-4 transition-all",
                      editingService?.id === service.id
                        ? "border-primary bg-primary/5"
                        : "bg-card hover:bg-accent/50"
                    )}
                  >
                    {editingService?.id === service.id ? (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">{t("services.editService")}</h4>
                          <div className="flex gap-1">
                            <Button
                              type="submit"
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              disabled={isSaving}
                            >
                              <Save className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs">
                              {t("services.serviceName")}
                            </Label>
                            <Input
                              id="name"
                              {...register("name")}
                              placeholder={t("services.serviceNamePlaceholder")}
                              className="h-8 text-sm"
                            />
                            {errors.name && (
                              <p className="text-destructive text-xs">{errors.name.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">{t("services.serviceType")}</Label>
                              <Select
                                value={watch("type")}
                                onValueChange={(value: ServiceType) => setValue("type", value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SERVICE_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {t(`projects.serviceTypes.${type}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">{t("services.stack")}</Label>
                              <Select
                                value={watch("stack")}
                                onValueChange={(value: Stack) => setValue("stack", value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STACKS.map((stack) => (
                                    <SelectItem key={stack} value={stack}>
                                      {t(`projects.stacks.${stack}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="path" className="text-xs">
                              {t("services.path")}
                            </Label>
                            <div className="relative">
                              <Folder className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
                              <Input
                                id="path"
                                {...register("path")}
                                placeholder={t("services.pathPlaceholder")}
                                className="h-8 pl-7 text-sm"
                              />
                            </div>
                            {errors.path && (
                              <p className="text-destructive text-xs">{errors.path.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="url" className="text-xs">
                                {t("services.url")}
                              </Label>
                              <div className="relative">
                                <Globe className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
                                <Input
                                  id="url"
                                  {...register("url")}
                                  placeholder={t("services.urlPlaceholder")}
                                  className="h-8 pl-7 text-sm"
                                />
                              </div>
                              {errors.url && (
                                <p className="text-destructive text-xs">{errors.url.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="port" className="text-xs">
                                {t("services.port")}
                              </Label>
                              <Input
                                id="port"
                                type="number"
                                {...register("port", { valueAsNumber: true })}
                                placeholder={t("services.portPlaceholder")}
                                className="h-8 text-sm"
                              />
                              {errors.port && (
                                <p className="text-destructive text-xs">{errors.port.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="command" className="text-xs">
                              {t("services.command")}
                            </Label>
                            <div className="relative">
                              <Terminal className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
                              <Input
                                id="command"
                                {...register("command")}
                                placeholder={t("services.commandPlaceholder")}
                                className="h-8 pl-7 font-mono text-sm"
                              />
                            </div>
                            {errors.command && (
                              <p className="text-destructive text-xs">{errors.command.message}</p>
                            )}
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIndicator status={service.status} size="sm" />
                            <StackIcon stack={service.stack} className="size-4" />
                            <h4 className="text-sm font-medium">{service.name}</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {t(`projects.serviceTypes.${service.type}`)}
                            </Badge>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => handleEditService(service)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                        </div>

                        <div className="text-muted-foreground grid gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Folder className="size-3" />
                            <code className="truncate">{service.path}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="size-3" />
                            <span>
                              {service.url}:{service.port}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Terminal className="size-3" />
                            <code>{service.command}</code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
