import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Project, ProjectStatus, ProjectCategory } from "@/types/project"
import { ProjectFormValues } from "@/schemas/project"

function calculateCategory(services: { type: "frontend" | "backend" }[]): ProjectCategory {
  const hasFrontend = services.some((s) => s.type === "frontend")
  const hasBackend = services.some((s) => s.type === "backend")

  if (hasFrontend && hasBackend) return "fullstack"
  if (hasFrontend) return "frontend"
  return "backend"
}

interface ProjectState {
  projects: Project[]
  selectedProjectId: string | null

  addProject: (data: ProjectFormValues) => void
  removeProject: (id: string) => void
  updateProject: (id: string, data: Partial<Project>) => void
  selectProject: (id: string | null) => void

  toggleService: (projectId: string, serviceId: string) => void
  updateServiceStatus: (projectId: string, serviceId: string, status: ProjectStatus) => void
  startAllServices: (projectId: string) => void
  stopAllServices: (projectId: string) => void

  getSelectedProject: () => Project | undefined
  getRunningServicesCount: () => number
}

const generateId = () => crypto.randomUUID()

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProjectId: null,

      addProject: (data) => {
        const now = new Date()
        const category = calculateCategory(data.services)
        const newProject: Project = {
          id: generateId(),
          name: data.name,
          folder: data.folder,
          category,
          services: data.services.map((service) => ({
            ...service,
            id: generateId(),
            status: "stopped" as ProjectStatus,
          })),
          hasDocker: false,
          detectedAt: now,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          projects: [...state.projects, newProject],
        }))
      },

      removeProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        }))
      },

      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date() } : p
          ),
        }))
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
    }),
    {
      name: "warden-projects",
      partialize: (state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          services: p.services.map((s) => ({
            ...s,
            status: "stopped" as ProjectStatus,
          })),
        })),
      }),
    }
  )
)
