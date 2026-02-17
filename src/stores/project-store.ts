import { create } from "zustand"
import {
  projectApi,
  CreateProjectRequest,
  CreateServiceRequest,
  DiscoveredProject,
  ProjectWithServices,
  ServiceResponse,
  scanDepthApi,
  urlApi,
} from "@/lib/api"
import { workspaceApi } from "@/lib/api"
import type {
  Project,
  ProjectService,
  ProjectStatus,
  ServiceType,
  DetectedProject as DetectedProjectType,
} from "@/types/project"
import { ProjectFormValues } from "@/schemas/project"

function calculateCategory(services: { type: "frontend" | "backend" }[]): Project["category"] {
  const hasFrontend = services.some((s) => s.type === "frontend")
  const hasBackend = services.some((s) => s.type === "backend")

  if (hasFrontend && hasBackend) return "fullstack"
  if (hasFrontend) return "frontend"
  return "backend"
}

function mapServiceResponseToProjectService(service: ServiceResponse): ProjectService {
  const validStack = [
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
  ] as const
  type StackType = (typeof validStack)[number]

  const stack: StackType = validStack.includes(service.stack as StackType)
    ? (service.stack as StackType)
    : "other"

  const serviceType: ServiceType = service.serviceType === "frontend" ? "frontend" : "backend"

  return {
    id: service.id,
    name: service.name,
    type: serviceType,
    stack: stack,
    path: service.path,
    url: service.url,
    port: service.port,
    command: service.command,
    status: (service.status as ProjectStatus) || "stopped",
  }
}

function mapProjectWithServicesToProject(projectWithServices: ProjectWithServices): Project {
  const services = projectWithServices.services.map(mapServiceResponseToProjectService)
  return {
    id: projectWithServices.id,
    name: projectWithServices.name,
    folder: projectWithServices.folder,
    category: calculateCategory(services),
    services,
    hasDocker: false,
    detectedAt: new Date(projectWithServices.createdAt),
    createdAt: new Date(projectWithServices.createdAt),
    updatedAt: new Date(projectWithServices.updatedAt),
  }
}

function mapDiscoveredToProject(discovered: DiscoveredProject, urlSuffix: string): Project {
  const validStack = [
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
  ] as const
  type StackType = (typeof validStack)[number]

  const stack: StackType = validStack.includes(discovered.stack as StackType)
    ? (discovered.stack as StackType)
    : "other"

  return {
    id: crypto.randomUUID(),
    name: discovered.name,
    folder: discovered.folder,
    category: "backend",
    services: [
      {
        id: crypto.randomUUID(),
        name: "main",
        type: "backend",
        stack: stack,
        path: discovered.folder,
        url: `${discovered.name.toLowerCase().replace(/\s+/g, "-")}.${urlSuffix}`,
        port: discovered.port,
        command: "npm run dev",
        status: "stopped",
      },
    ],
    hasDocker: false,
    detectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Map DetectedProject (from advanced scan) to Project
function mapDetectedProjectToProject(detected: DetectedProjectType, urlSuffix: string): Project {
  const validStack = [
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
  ] as const
  type StackType = (typeof validStack)[number]

  const services: ProjectService[] = detected.services.map((s) => {
    const stack: StackType = validStack.includes(s.stack as StackType)
      ? (s.stack as StackType)
      : "other"

    const serviceType: ServiceType =
      s.category === "frontend" || s.category === "mobile" ? "frontend" : "backend"

    return {
      id: crypto.randomUUID(),
      name: s.name,
      type: serviceType,
      stack: stack,
      path: s.path,
      url: `${detected.name.toLowerCase().replace(/\s+/g, "-")}.${urlSuffix}`,
      port: s.port ?? 3000,
      command: s.devCommand ?? "npm run dev",
      status: "stopped" as ProjectStatus,
    }
  })

  return {
    id: crypto.randomUUID(),
    name: detected.name,
    folder: detected.path,
    category: calculateCategory(services),
    services,
    hasDocker: detected.hasDocker,
    detectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

interface ProjectState {
  projects: Project[]
  selectedProjectId: string | null
  isLoading: boolean

  loadProjects: () => Promise<void>
  scanWorkspace: () => Promise<void>
  addProject: (data: ProjectFormValues) => Promise<void>
  addDiscoveredProject: (discovered: DiscoveredProject) => Promise<void>
  removeProject: (id: string) => Promise<void>
  selectProject: (id: string | null) => void

  toggleService: (projectId: string, serviceId: string) => void
  updateServiceStatus: (projectId: string, serviceId: string, status: ProjectStatus) => void
  startAllServices: (projectId: string) => void
  stopAllServices: (projectId: string) => void

  getSelectedProject: () => Project | undefined
  getRunningServicesCount: () => number
}

const generateId = () => crypto.randomUUID()

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true })
    try {
      const projectsWithServices = await projectApi.getProjectsWithServices()
      const projects = projectsWithServices.map(mapProjectWithServicesToProject)
      set({ projects, isLoading: false })
    } catch (error) {
      console.error("Failed to load projects:", error)
      set({ isLoading: false })
    }
  },

  scanWorkspace: async () => {
    try {
      const rootPath = await workspaceApi.getRootPath()
      if (!rootPath) {
        console.log("No workspace root path configured")
        return
      }

      const scanDepth = await scanDepthApi.getScanDepth()
      const urlSuffix = await urlApi.getSuffix()
      console.log("Scanning workspace with advanced detection:", rootPath, "depth:", scanDepth)

      const detectedProjects = await projectApi.scanWorkspaceServices(rootPath, scanDepth)
      console.log("Detected projects:", detectedProjects)

      for (const detected of detectedProjects) {
        const exists = await projectApi.projectExistsByFolder(detected.path)
        if (exists) {
          console.log("Project already exists:", detected.name)
          continue
        }

        try {
          const project = mapDetectedProjectToProject(detected, urlSuffix || "test")

          const projectRequest: CreateProjectRequest = {
            id: project.id,
            name: project.name,
            folder: project.folder,
          }

          const servicesRequest: CreateServiceRequest[] = project.services.map((s) => ({
            id: s.id,
            project_id: project.id,
            name: s.name,
            service_type: s.type,
            stack: s.stack,
            path: s.path,
            url: s.url,
            port: s.port,
            command: s.command,
          }))

          await projectApi.createProject(projectRequest, servicesRequest)

          set((currentState) => ({
            projects: [...currentState.projects, project],
          }))

          console.log("Project saved with", project.services.length, "services:", project.name)
        } catch (error) {
          console.error("Failed to save detected project:", detected.name, error)
        }
      }
    } catch (error) {
      console.error("Failed to scan workspace:", error)
    }
  },

  addProject: async (data) => {
    const projectId = generateId()

    const projectRequest: CreateProjectRequest = {
      id: projectId,
      name: data.name,
      folder: data.folder,
    }

    const servicesRequest: CreateServiceRequest[] = data.services.map((service) => ({
      id: generateId(),
      project_id: projectId,
      name: service.name,
      service_type: service.type,
      stack: service.stack,
      path: service.path,
      url: service.url,
      port: service.port,
      command: service.command,
    }))

    try {
      const apiProject = await projectApi.createProject(projectRequest, servicesRequest)

      const newProject: Project = {
        id: apiProject.id,
        name: apiProject.name,
        folder: apiProject.folder,
        category: calculateCategory(data.services),
        services: data.services.map((service, index) => ({
          ...service,
          id: servicesRequest[index].id,
          status: "stopped" as ProjectStatus,
        })),
        hasDocker: false,
        detectedAt: new Date(apiProject.created_at),
        createdAt: new Date(apiProject.created_at),
        updatedAt: new Date(apiProject.updated_at),
      }

      set((state) => ({
        projects: [...state.projects, newProject],
      }))
    } catch (error) {
      console.error("Failed to create project:", error)
      throw error
    }
  },

  addDiscoveredProject: async (discovered) => {
    const urlSuffix = await urlApi.getSuffix()
    const project = mapDiscoveredToProject(discovered, urlSuffix || "test")
    const projectRequest: CreateProjectRequest = {
      id: project.id,
      name: project.name,
      folder: project.folder,
    }
    const servicesRequest: CreateServiceRequest[] = project.services.map((s) => ({
      id: s.id,
      project_id: project.id,
      name: s.name,
      service_type: s.type,
      stack: s.stack,
      path: s.path,
      url: s.url,
      port: s.port,
      command: s.command,
    }))
    try {
      await projectApi.createProject(projectRequest, servicesRequest)
      set((state) => ({
        projects: [...state.projects, project],
      }))
    } catch (error) {
      console.error("Failed to add discovered project:", error)
      throw error
    }
  },

  removeProject: async (id) => {
    try {
      await projectApi.deleteProject(id)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
      }))
    } catch (error) {
      console.error("Failed to delete project:", error)
      throw error
    }
  },

  selectProject: (id) => {
    set({ selectedProjectId: id })
  },

  toggleService: (projectId, serviceId) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p

        return {
          ...p,
          services: p.services.map((s) => {
            if (s.id !== serviceId) return s
            return {
              ...s,
              status: s.status === "running" ? "stopped" : "running",
            }
          }),
          updatedAt: new Date(),
        }
      }),
    }))
  },

  updateServiceStatus: (projectId, serviceId, status) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p

        return {
          ...p,
          services: p.services.map((s) => (s.id === serviceId ? { ...s, status } : s)),
          updatedAt: new Date(),
        }
      }),
    }))
  },

  startAllServices: (projectId) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p

        return {
          ...p,
          services: p.services.map((s) => ({
            ...s,
            status: "running" as ProjectStatus,
          })),
          updatedAt: new Date(),
        }
      }),
    }))
  },

  stopAllServices: (projectId) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p

        return {
          ...p,
          services: p.services.map((s) => ({
            ...s,
            status: "stopped" as ProjectStatus,
          })),
          updatedAt: new Date(),
        }
      }),
    }))
  },

  getSelectedProject: () => {
    const state = get()
    return state.projects.find((p) => p.id === state.selectedProjectId)
  },

  getRunningServicesCount: () => {
    const state = get()
    return state.projects.reduce(
      (acc, p) => acc + p.services.filter((s) => s.status === "running").length,
      0
    )
  },
}))
