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

export const projectApi = {
  async createProject(data: {
    name: string
    folder: string
    services: Array<{
      name: string
      type: string
      stack: string
      path: string
      url: string
      port: number
      command: string
    }>
  }): Promise<{ id: string }> {
    console.log("API: Creating project:", data)
    return api.invoke<{ id: string }>("create_project", { project: data })
  },

  async deleteProject(id: string): Promise<void> {
    return api.invoke("delete_project", { id })
  },

  async getProjects(): Promise<Array<{ id: string; name: string }>> {
    return api.invoke("get_projects")
  },
}
