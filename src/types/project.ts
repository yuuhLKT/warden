export type Stack =
  | "react"
  | "next"
  | "vue"
  | "angular"
  | "svelte"
  | "node"
  | "express"
  | "nestjs"
  | "laravel"
  | "php"
  | "django"
  | "flask"
  | "rails"
  | "go"
  | "rust"
  | "other"

export type ProjectStatus = "running" | "stopped" | "error"

export type ServiceType = "frontend" | "backend"

export type ProjectCategory = "frontend" | "backend" | "fullstack"

export interface ProjectService {
  id: string
  name: string
  type: ServiceType
  stack: Stack
  path: string
  url: string
  port: number
  status: ProjectStatus
  command: string
}

export interface Project {
  id: string
  name: string
  folder: string
  category: ProjectCategory
  services: ProjectService[]
  hasDocker: boolean
  dockerComposeFile?: string
  gitRemote?: string
  gitBranch?: string
  detectedAt: Date
  lastOpened?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ProjectFormData {
  name: string
  folder: string
  services: Omit<ProjectService, "id" | "status">[]
}

export interface CloneProjectData {
  name: string
  gitUrl: string
  folder: string
}
