/**
 * Store utilities for common patterns
 * These utilities help reduce duplication in Zustand stores
 */

import type { Project, ProjectService, ProjectStatus } from "@/types/project"

/**
 * Updates a project's services array and sets the updatedAt timestamp
 */
export function updateProjectServices(
  projects: Project[],
  projectId: string,
  serviceUpdater: (services: ProjectService[]) => ProjectService[]
): Project[] {
  return projects.map((p) =>
    p.id === projectId ? { ...p, services: serviceUpdater(p.services), updatedAt: new Date() } : p
  )
}

/**
 * Updates a specific service within a project
 */
export function updateServiceInProject(
  projects: Project[],
  projectId: string,
  serviceId: string,
  updates: Partial<ProjectService>
): Project[] {
  return updateProjectServices(projects, projectId, (services) =>
    services.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
  )
}

/**
 * Updates the status of a specific service
 */
export function updateServiceStatus(
  projects: Project[],
  projectId: string,
  serviceId: string,
  status: ProjectStatus
): Project[] {
  return updateServiceInProject(projects, projectId, serviceId, { status })
}

/**
 * Updates all services in a project with the same status
 */
export function updateAllServicesStatus(
  projects: Project[],
  projectId: string,
  status: ProjectStatus
): Project[] {
  return updateProjectServices(projects, projectId, (services) =>
    services.map((s) => ({ ...s, status }))
  )
}

/**
 * Toggles a service's status between running and stopped
 */
export function toggleServiceStatus(
  projects: Project[],
  projectId: string,
  serviceId: string
): Project[] {
  const service = projects.find((p) => p.id === projectId)?.services.find((s) => s.id === serviceId)

  if (!service) return projects

  return updateServiceInProject(projects, projectId, serviceId, {
    status: service.status === "running" ? "stopped" : "running",
  })
}

/**
 * Removes a project from the projects array
 */
export function removeProjectById(projects: Project[], projectId: string): Project[] {
  return projects.filter((p) => p.id !== projectId)
}

/**
 * Calculates the project category based on services
 */
export function calculateProjectCategory(
  services: Pick<ProjectService, "type">[]
): Project["category"] {
  const hasFrontend = services.some((s) => s.type === "frontend")
  const hasBackend = services.some((s) => s.type === "backend")

  if (hasFrontend && hasBackend) return "fullstack"
  if (hasFrontend) return "frontend"
  return "backend"
}

/**
 * Counts running services in a project
 */
export function countRunningServices(project: Project): number {
  return project.services.filter((s) => s.status === "running").length
}

/**
 * Counts total running services across all projects
 */
export function countTotalRunningServices(projects: Project[]): number {
  return projects.reduce((acc, project) => acc + countRunningServices(project), 0)
}

/**
 * Gets the primary stack for a project (first service's stack or 'other')
 */
export function getPrimaryStack(project: Project): string {
  return project.services[0]?.stack || "other"
}

/**
 * Validates a stack value and returns a valid Stack type
 */
import { STACKS, type Stack } from "@/lib/constants"

export function validateStack(stack: string): Stack {
  return STACKS.includes(stack as Stack) ? (stack as Stack) : "other"
}

/**
 * Type guard for ServiceType
 */
export function isServiceType(value: string): value is ProjectService["type"] {
  return value === "frontend" || value === "backend"
}

/**
 * Maps a category to service type
 */
export function categoryToServiceType(category: string): ProjectService["type"] {
  return category === "frontend" || category === "mobile" ? "frontend" : "backend"
}
