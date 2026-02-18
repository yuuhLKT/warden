import { useState, useEffect, useCallback } from "react"
import { useProjectStore } from "@/stores/project-store"
import type { ScaffoldTemplate, ScaffoldPackageManager } from "@/types/scaffold"
import { scaffoldApi } from "@/lib/api"
import { useUrlSuffix } from "./use-url-suffix"
import type { Stack, ServiceType } from "@/types/project"

export type ScaffoldStep = "package-manager" | "template" | "configure" | "executing" | "success"

interface ScaffoldState {
  step: ScaffoldStep
  selectedPackageManager: ScaffoldPackageManager | null
  selectedTemplate: ScaffoldTemplate | null
  templates: ScaffoldTemplate[]
  isLoading: boolean
  error: string | null
  commandOutput: string[]
}

interface ScaffoldFormData {
  name: string
  folder: string
  url: string
  port: number
}

interface UseScaffoldReturn {
  state: ScaffoldState
  formData: ScaffoldFormData
  errors: Record<string, string>

  // Actions
  selectPackageManager: (pm: ScaffoldPackageManager) => void
  selectTemplate: (template: ScaffoldTemplate) => void
  updateFormField: (field: keyof ScaffoldFormData, value: string | number) => void
  goBack: () => void
  executeScaffold: () => Promise<void>
  reset: () => void

  // Helpers
  getFilteredTemplates: () => ScaffoldTemplate[]
  getCommandPreview: () => string
}

const initialFormData: ScaffoldFormData = {
  name: "",
  folder: "",
  url: "",
  port: 3000,
}

const initialState: ScaffoldState = {
  step: "package-manager",
  selectedPackageManager: null,
  selectedTemplate: null,
  templates: [],
  isLoading: false,
  error: null,
  commandOutput: [],
}

export function useScaffold(): UseScaffoldReturn {
  const { addProject } = useProjectStore()
  const { urlSuffix } = useUrlSuffix()

  const [state, setState] = useState<ScaffoldState>(initialState)
  const [formData, setFormData] = useState<ScaffoldFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch("/scaffold-templates.json")
        const data = await response.json()
        setState((prev) => ({ ...prev, templates: data.templates }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to load templates",
        }))
      }
    }
    loadTemplates()
  }, [])

  const selectPackageManager = useCallback((pm: ScaffoldPackageManager) => {
    setState((prev) => ({
      ...prev,
      selectedPackageManager: pm,
      step: "template",
    }))
  }, [])

  const selectTemplate = useCallback((template: ScaffoldTemplate) => {
    setState((prev) => ({
      ...prev,
      selectedTemplate: template,
      step: "configure",
    }))
    setFormData((prev) => ({
      ...prev,
      port: template.defaultPort,
    }))
  }, [])

  const updateFormField = useCallback((field: keyof ScaffoldFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => {
      switch (prev.step) {
        case "template":
          return { ...prev, step: "package-manager", selectedPackageManager: null }
        case "configure":
          return { ...prev, step: "template", selectedTemplate: null }
        default:
          return prev
      }
    })
  }, [])

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required"
    }
    if (!formData.folder.trim()) {
      newErrors.folder = "Folder is required"
    }
    if (!formData.url.trim()) {
      newErrors.url = "URL is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const executeScaffold = useCallback(async () => {
    if (!validateForm() || !state.selectedTemplate) return

    setState((prev) => ({ ...prev, step: "executing", isLoading: true }))

    try {
      // Execute scaffold command
      const command = state.selectedTemplate.command.replace(/\{name\}/g, formData.name)

      await scaffoldApi.executeScaffold(formData.folder, command)

      // Add project to database
      const projectPath = `${formData.folder}/${formData.name}`

      // Determine service type based on template category
      const serviceType: ServiceType =
        state.selectedTemplate.category === "frontend"
          ? "frontend"
          : state.selectedTemplate.category === "backend"
            ? "backend"
            : "frontend"

      // Map language to stack
      const stackMap: Record<string, Stack> = {
        typescript: state.selectedTemplate.tags.includes("nextjs")
          ? "next"
          : state.selectedTemplate.tags.includes("react")
            ? "react"
            : "node",
        javascript: "node",
        python: state.selectedTemplate.tags.includes("django")
          ? "django"
          : state.selectedTemplate.tags.includes("flask")
            ? "flask"
            : "node",
        php: "laravel",
        rust: "rust",
        go: "go",
        java: "nestjs",
        kotlin: "nestjs",
        ruby: "rails",
        elixir: "node",
      }

      await addProject({
        name: formData.name,
        folder: projectPath,
        services: [
          {
            name: state.selectedTemplate.name,
            type: serviceType,
            stack: stackMap[state.selectedTemplate.language] || "other",
            path: projectPath,
            url: formData.url,
            port: formData.port,
            command: `${state.selectedTemplate.packageManager} run dev`,
          },
        ],
      })

      setState((prev) => ({
        ...prev,
        step: "success",
        isLoading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to create project",
      }))
    }
  }, [validateForm, state.selectedTemplate, formData, addProject, urlSuffix])

  const reset = useCallback(() => {
    setState(initialState)
    setFormData(initialFormData)
    setErrors({})
  }, [])

  const getFilteredTemplates = useCallback(() => {
    if (!state.selectedPackageManager) return []
    return state.templates.filter((t) => t.packageManager === state.selectedPackageManager)
  }, [state.templates, state.selectedPackageManager])

  const getCommandPreview = useCallback(() => {
    if (!state.selectedTemplate) return ""
    return state.selectedTemplate.command.replace(/\{name\}/g, formData.name || "my-project")
  }, [state.selectedTemplate, formData.name])

  return {
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
  }
}
