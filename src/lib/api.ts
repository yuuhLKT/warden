import { invoke } from "@tauri-apps/api/core"

export const api = {
  async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    return invoke<T>(command, args)
  },
}

export const settingsApi = {
  async saveDefaultIDE(ide: string): Promise<void> {
    return api.invoke("save_default_ide", { ide })
  },

  async getDefaultIDE(): Promise<string | null> {
    return api.invoke<string | null>("get_default_ide")
  },

  async saveIdeCommand(command: string): Promise<void> {
    return api.invoke("save_ide_command", { command })
  },

  async getIdeCommand(): Promise<string | null> {
    return api.invoke<string | null>("get_ide_command")
  },
}

export const workspaceApi = {
  async saveRootPath(path: string): Promise<void> {
    return api.invoke("save_root_path", { path })
  },

  async getRootPath(): Promise<string | null> {
    return api.invoke<string | null>("get_root_path")
  },
}

export const gitApi = {
  async clone(url: string, destination: string): Promise<string> {
    return api.invoke("clone", { url, destination })
  },
}

export const urlApi = {
  async setDefaultSuffix(suffix: string): Promise<void> {
    return api.invoke("save_default_suffix", { suffix })
  },
  async getSuffix(): Promise<string | null> {
    return api.invoke<string | null>("get_default_suffix")
  },
}

export const scanDepthApi = {
  async saveScanDepth(depth: number): Promise<void> {
    return api.invoke("save_scan_depth", { depth })
  },
  async getScanDepth(): Promise<number> {
    return api.invoke<number>("get_scan_depth")
  },
}

/** Row returned by `create_project` / `get_project` / `get_projects` */
export interface ProjectRow {
  id: string
  name: string
  folder: string
  createdAt: string
  updatedAt: string
}

/** @deprecated Use ProjectRow instead */
export type Project = ProjectRow

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

/** Row returned by `get_services_by_project` and embedded in ProjectWithServices */
export interface ServiceRow {
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

/** @deprecated Use ServiceRow instead */
export type ServiceResponse = ServiceRow

export interface ProjectWithServices {
  id: string
  name: string
  folder: string
  createdAt: string
  updatedAt: string
  services: ServiceRow[]
}

export const projectApi = {
  async createProject(
    project: CreateProjectRequest,
    services: CreateServiceRequest[]
  ): Promise<ProjectRow> {
    return api.invoke<ProjectRow>("create_project", { project, services })
  },

  async updateProject(id: string, name?: string, folder?: string): Promise<ProjectRow> {
    return api.invoke<ProjectRow>("update_project", { id, project: { name, folder } })
  },

  async updateService(
    id: string,
    updates: {
      name?: string
      serviceType?: string
      stack?: string
      path?: string
      url?: string
      port?: number
      command?: string
    }
  ): Promise<ServiceRow> {
    return api.invoke<ServiceRow>("update_service", {
      id,
      service: {
        name: updates.name,
        service_type: updates.serviceType,
        stack: updates.stack,
        path: updates.path,
        url: updates.url,
        port: updates.port,
        command: updates.command,
      },
    })
  },

  async deleteProject(id: string): Promise<boolean> {
    return api.invoke<boolean>("delete_project", { id })
  },

  async getProjects(): Promise<ProjectRow[]> {
    return api.invoke<ProjectRow[]>("get_projects")
  },

  async getProject(id: string): Promise<ProjectRow | null> {
    return api.invoke<ProjectRow | null>("get_project", { id })
  },

  async getProjectsWithServices(): Promise<ProjectWithServices[]> {
    return api.invoke<ProjectWithServices[]>("get_projects_with_services")
  },

  async getServicesByProject(projectId: string): Promise<ServiceRow[]> {
    return api.invoke<ServiceRow[]>("get_services_by_project", { projectId })
  },

  async projectExistsByFolder(folder: string): Promise<boolean> {
    return api.invoke<boolean>("project_exists_by_folder", { folder })
  },

  async scanProjectServices(
    path: string,
    maxDepth: number = 2
  ): Promise<import("@/types/project").DetectedProject> {
    return api.invoke<import("@/types/project").DetectedProject>("scan_project_services", {
      path,
      maxDepth,
    })
  },

  async scanWorkspaceServices(
    workspacePath: string,
    maxDepth: number = 2
  ): Promise<import("@/types/project").DetectedProject[]> {
    return api.invoke<import("@/types/project").DetectedProject[]>("scan_workspace_services", {
      workspacePath,
      maxDepth,
    })
  },

  async getDetectedServices(path: string): Promise<import("@/types/project").DetectedService[]> {
    return api.invoke<import("@/types/project").DetectedService[]>("get_detected_services", {
      path,
    })
  },
}

export const ideApi = {
  async openInIde(path: string, ideCommand: string): Promise<void> {
    return api.invoke("open_in_ide", { path, ideCommand })
  },
}

export const scaffoldApi = {
  async executeScaffold(workingDir: string, command: string): Promise<string> {
    return api.invoke<string>("execute_scaffold", { workingDir, command })
  },
}
