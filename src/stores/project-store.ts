import { create } from "zustand"
import {
  projectApi,
  type CreateProjectRequest,
  type CreateServiceRequest,
  type ProjectWithServices,
  type ServiceRow,
  scanDepthApi,
  urlApi,
} from "@/lib/api"
import { workspaceApi } from "@/lib/api"
import { useSettingsStore } from "@/stores/settings-store"
import type {
  Project,
  ProjectService,
  ProjectStatus,
  DetectedProject as DetectedProjectType,
} from "@/types/project"
import type { ProjectFormValues } from "@/schemas/project"
import {
  calculateProjectCategory,
  validateStack,
  categoryToServiceType,
  toggleServiceStatus,
  updateServiceStatus,
  updateAllServicesStatus,
  updateServiceInProject,
  countTotalRunningServices,
} from "@/stores/utils"

function mapServiceRowToProjectService(service: ServiceRow): ProjectService {
  return {
    id: service.id,
    name: service.name,
    type: service.serviceType === "frontend" ? "frontend" : "backend",
    stack: validateStack(service.stack),
    path: service.path,
    url: service.url,
    port: service.port,
    command: service.command,
    status: (service.status as ProjectStatus) || "stopped",
  }
}

function mapProjectWithServicesToProject(projectWithServices: ProjectWithServices): Project {
  const services = projectWithServices.services.map(mapServiceRowToProjectService)
  return {
    id: projectWithServices.id,
    name: projectWithServices.name,
    folder: projectWithServices.folder,
    category: calculateProjectCategory(services),
    services,
    hasDocker: false,
    detectedAt: new Date(projectWithServices.createdAt),
    createdAt: new Date(projectWithServices.createdAt),
    updatedAt: new Date(projectWithServices.updatedAt),
  }
}

function mapDetectedProjectToProject(detected: DetectedProjectType, urlSuffix: string): Project {
  const services: ProjectService[] = detected.services.map((s) => ({
    id: crypto.randomUUID(),
    name: s.name,
    type: categoryToServiceType(s.category),
    stack: validateStack(s.stack),
    path: s.path,
    url: `${detected.name.toLowerCase().replace(/\s+/g, "-")}.${urlSuffix}`,
    port: s.port ?? 3000,
    command: s.devCommand ?? "npm run dev",
    status: "stopped" as ProjectStatus,
  }))

  return {
    id: crypto.randomUUID(),
    name: detected.name,
    folder: detected.path,
    category: calculateProjectCategory(services),
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
  removeProject: (id: string) => Promise<void>
  updateProject: (id: string, data: { name: string; folder: string }) => Promise<void>
  selectProject: (id: string | null) => void

  toggleService: (projectId: string, serviceId: string) => void
  updateService: (
    projectId: string,
    serviceId: string,
    updates: Partial<Omit<ProjectService, "id" | "status">>
  ) => Promise<void>
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
      set({ isLoading: false })
    }
  },

  scanWorkspace: async () => {
    try {
      const rootPath = await workspaceApi.getRootPath()
      if (!rootPath) {
        return
      }

      const scanDepth = await scanDepthApi.getScanDepth()
      const urlSuffix =
        useSettingsStore.getState().urlSuffix || (await urlApi.getSuffix()) || "test"

      const detectedProjects = await projectApi.scanWorkspaceServices(rootPath, scanDepth)

      for (const detected of detectedProjects) {
        const exists = await projectApi.projectExistsByFolder(detected.path)
        if (exists) {
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
        } catch {}
      }
    } catch {}
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
        category: calculateProjectCategory(data.services),
        services: data.services.map((service, index) => ({
          ...service,
          id: servicesRequest[index].id,
          status: "stopped" as ProjectStatus,
        })),
        hasDocker: false,
        detectedAt: new Date(apiProject.createdAt),
        createdAt: new Date(apiProject.createdAt),
        updatedAt: new Date(apiProject.updatedAt),
      }

      set((state) => ({
        projects: [...state.projects, newProject],
      }))
    } catch (error) {
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
      throw error
    }
  },

  updateProject: async (id, data) => {
    try {
      await projectApi.updateProject(id, data.name, data.folder)
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, name: data.name, folder: data.folder, updatedAt: new Date() } : p
        ),
      }))
    } catch (error) {
      throw error
    }
  },

  updateService: async (projectId, serviceId, updates) => {
    try {
      await projectApi.updateService(serviceId, {
        name: updates.name,
        serviceType: updates.type,
        stack: updates.stack,
        path: updates.path,
        url: updates.url,
        port: updates.port,
        command: updates.command,
      })
      set((state) => ({
        projects: updateServiceInProject(state.projects, projectId, serviceId, updates),
      }))
    } catch (error) {
      throw error
    }
  },

  selectProject: (id) => {
    set({ selectedProjectId: id })
  },

  toggleService: (projectId, serviceId) => {
    set((state) => ({
      projects: toggleServiceStatus(state.projects, projectId, serviceId),
    }))
  },

  updateServiceStatus: (projectId, serviceId, status) => {
    set((state) => ({
      projects: updateServiceStatus(state.projects, projectId, serviceId, status),
    }))
  },

  startAllServices: (projectId) => {
    set((state) => ({
      projects: updateAllServicesStatus(state.projects, projectId, "running"),
    }))
  },

  stopAllServices: (projectId) => {
    set((state) => ({
      projects: updateAllServicesStatus(state.projects, projectId, "stopped"),
    }))
  },

  getSelectedProject: () => {
    const state = get()
    return state.projects.find((p) => p.id === state.selectedProjectId)
  },

  getRunningServicesCount: () => {
    return countTotalRunningServices(get().projects)
  },
}))
