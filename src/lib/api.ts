import { invoke } from "@tauri-apps/api/core"

export const api = {
  async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    try {
      const result = await invoke<T>(command, args)
      return result
    } catch (error) {
      console.error(`API Error [${command}]:`, error)
      throw error
    }
  },
}

export const settingsApi = {
  async saveDefaultIDE(ide: string): Promise<void> {
    console.log("API: Saving default IDE:", ide)
    return api.invoke("save_default_ide", { ide })
  },

  async getDefaultIDE(): Promise<string | null> {
    return api.invoke<string | null>("get_default_ide")
  },
}

export const workspaceApi = {
  async saveRootPath(path: string): Promise<void> {
    console.log("API: Saving root path:", path)
    return api.invoke("save_root_path", { path })
  },

  async getRootPath(): Promise<string | null> {
    return api.invoke<string | null>("get_root_path")
  },
}

export const gitApi = {
  async clone(url: string, destination: string): Promise<string> {
    console.log("API: Cloning repository:", url)
    console.log("API: Destination:", destination)
    return api.invoke("clone", { url, destination })
  },
}

export const urlApi = {
  async setDefaultSuffix(suffix: string): Promise<void> {
    console.log("API: Setting default suffix:", suffix)
    return api.invoke("save_default_suffix", { suffix })
  },
  async getSuffix(): Promise<string | null> {
    return api.invoke<string | null>("get_default_suffix")
  },
}

export const scanDepthApi = {
  async saveScanDepth(depth: number): Promise<void> {
    console.log("API: Saving scan depth:", depth)
    return api.invoke("save_scan_depth", { depth })
  },
  async getScanDepth(): Promise<number> {
    return api.invoke<number>("get_scan_depth")
  },
}

export interface Project {
  id: string
  name: string
  folder: string
  created_at: string
  updated_at: string
}

export interface CreateProjectRequest {
  id: string
  name: string
  folder: string
}

export interface CreateServiceRequest {
  id: string
  project_id: string
  name: string
  service_type: string
  stack: string
  path: string
  url: string
  port: number
  command: string
}

export interface DiscoveredProject {
  name: string
  folder: string
  stack: string
  port: number
}

export interface ServiceResponse {
  id: string
  projectId: string
  name: string
  serviceType: string
  stack: string
  path: string
  url: string
  port: number
  command: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ProjectWithServices {
  id: string
  name: string
  folder: string
  createdAt: string
  updatedAt: string
  services: ServiceResponse[]
}

export const projectApi = {
  async createProject(
    project: CreateProjectRequest,
    services: CreateServiceRequest[]
  ): Promise<Project> {
    console.log("API: Creating project:", project, "with services:", services)
    return api.invoke<Project>("create_project", { project, services })
  },

  async deleteProject(id: string): Promise<boolean> {
    return api.invoke<boolean>("delete_project", { id })
  },

  async getProjects(): Promise<Project[]> {
    return api.invoke<Project[]>("get_projects")
  },

  async getProject(id: string): Promise<Project | null> {
    return api.invoke<Project | null>("get_project", { id })
  },

  async getProjectsWithServices(): Promise<ProjectWithServices[]> {
    return api.invoke<ProjectWithServices[]>("get_projects_with_services")
  },

  async getServicesByProject(projectId: string): Promise<ServiceResponse[]> {
    return api.invoke<ServiceResponse[]>("get_services_by_project", { projectId })
  },

  async scanWorkspace(workspacePath: string): Promise<DiscoveredProject[]> {
    return api.invoke<DiscoveredProject[]>("scan_workspace_projects", { workspacePath })
  },

  async projectExistsByFolder(folder: string): Promise<boolean> {
    return api.invoke<boolean>("project_exists_by_folder", { folder })
  },

  // ============================================================================
  // New advanced scanning APIs
  // ============================================================================

  async scanProjectServices(
    path: string,
    maxDepth: number = 2
  ): Promise<import("@/types/project").DetectedProject> {
    console.log("API: Scanning project services:", path)
    return api.invoke<import("@/types/project").DetectedProject>("scan_project_services", {
      path,
      maxDepth,
    })
  },

  async scanWorkspaceServices(
    workspacePath: string,
    maxDepth: number = 2
  ): Promise<import("@/types/project").DetectedProject[]> {
    console.log("API: Scanning workspace services:", workspacePath)
    return api.invoke<import("@/types/project").DetectedProject[]>("scan_workspace_services", {
      workspacePath,
      maxDepth,
    })
  },

  async getDetectedServices(path: string): Promise<import("@/types/project").DetectedService[]> {
    console.log("API: Getting detected services:", path)
    return api.invoke<import("@/types/project").DetectedService[]>("get_detected_services", {
      path,
    })
  },
}

export const ideApi = {
  async openInIde(path: string, ideCommand: string): Promise<void> {
    console.log("API: Opening in IDE:", path, ideCommand)
    return api.invoke("open_in_ide", { path, ideCommand })
  },
}
