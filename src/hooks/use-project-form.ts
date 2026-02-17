import { useState, useCallback } from "react"
import { ProjectFormValues, ServiceFormValues, projectFormSchema } from "@/schemas/project"
import type { Stack, ServiceType } from "@/types/project"
import { useWorkspaceStore } from "@/stores/workspace-store"

const createDefaultService = (rootPath: string | null): ServiceFormValues => ({
  name: "",
  type: "frontend",
  stack: "react",
  path: rootPath || "",
  url: "",
  port: 3000,
  command: "npm run dev",
})

const createInitialFormState = (rootPath: string | null): ProjectFormValues => ({
  name: "",
  folder: rootPath || "",
  services: [createDefaultService(rootPath)],
})

export function useProjectForm() {
  const { rootPath } = useWorkspaceStore()
  const [formData, setFormData] = useState<ProjectFormValues>(() =>
    createInitialFormState(rootPath)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = useCallback(
    <K extends keyof ProjectFormValues>(field: K, value: ProjectFormValues[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: "", services: "" }))
    },
    []
  )

  const updateService = useCallback((index: number, service: ServiceFormValues) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s, i) => (i === index ? service : s)),
    }))
    setErrors((prev) => ({ ...prev, services: "" }))
  }, [])

  const updateServiceField = useCallback(
    <K extends keyof ServiceFormValues>(index: number, field: K, value: ServiceFormValues[K]) => {
      setFormData((prev) => ({
        ...prev,
        services: prev.services.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
      }))
      setErrors((prev) => ({ ...prev, services: "" }))
    },
    []
  )

  const addService = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          ...createDefaultService(rootPath),
          port: 3000 + prev.services.length,
          type: prev.services.length === 0 ? "frontend" : ("backend" as ServiceType),
          stack: prev.services.length === 0 ? "react" : ("node" as Stack),
        },
      ],
    }))
  }, [rootPath])

  const removeService = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }))
  }, [])

  const validate = useCallback((): boolean => {
    const result = projectFormSchema.safeParse(formData)

    if (!result.success) {
      const newErrors: Record<string, string> = {}
      const issues = result.error.issues
      issues.forEach((issue) => {
        const path = issue.path.join(".")
        newErrors[path] = issue.message
      })
      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }, [formData])

  const reset = useCallback(() => {
    setFormData(createInitialFormState(rootPath))
    setErrors({})
  }, [rootPath])

  return {
    formData,
    errors,
    updateField,
    updateService,
    updateServiceField,
    addService,
    removeService,
    validate,
    reset,
  }
}
