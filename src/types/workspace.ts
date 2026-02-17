import type { Project } from "./project"

export interface Workspace {
  rootPath: string
  projects: Project[]
  lastScanned: Date | null
}

export interface WorkspaceConfig {
  rootPath: string | null
  isOnboardingComplete: boolean
  recentPaths: string[]
}
