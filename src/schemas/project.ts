import { z } from "zod"

export const stackSchema = z.enum([
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
])

export const projectStatusSchema = z.enum(["running", "stopped", "error"])

export const serviceTypeSchema = z.enum(["frontend", "backend"])

export const projectCategorySchema = z.enum(["frontend", "backend", "fullstack"])

export const projectServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Service name is required"),
  type: serviceTypeSchema,
  stack: stackSchema,
  path: z.string().min(1, "Service path is required"),
  url: z
    .string()
    .min(1, "URL is required")
    .regex(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/, "URL must be a valid domain (e.g., mysite.test)"),
  port: z
    .number()
    .min(1024, "Port must be greater than 1024")
    .max(65535, "Port must be less than 65535"),
  status: projectStatusSchema,
  command: z.string().min(1, "Command is required"),
})

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Project name is required"),
  folder: z.string().min(1, "Project folder is required"),
  category: projectCategorySchema,
  services: z.array(projectServiceSchema),
  hasDocker: z.boolean(),
  dockerComposeFile: z.string().optional(),
  gitRemote: z.string().optional(),
  gitBranch: z.string().optional(),
  detectedAt: z.date(),
  lastOpened: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  type: serviceTypeSchema,
  stack: stackSchema,
  path: z.string().min(1, "Service path is required"),
  url: z
    .string()
    .min(1, "URL is required")
    .regex(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/, "URL must be a valid domain (e.g., mysite.test)"),
  port: z
    .number()
    .min(1024, "Port must be greater than 1024")
    .max(65535, "Port must be less than 65535"),
  command: z.string().min(1, "Command is required"),
})

export const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  folder: z.string().min(1, "Project folder is required"),
  services: z.array(serviceFormSchema).min(1, "Add at least one service"),
})

export const cloneProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  gitUrl: z.string().url("Invalid Git URL").min(1, "Git URL is required"),
  folder: z.string().min(1, "Clone folder is required"),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
export type ServiceFormValues = z.infer<typeof serviceFormSchema>
export type CloneProjectValues = z.infer<typeof cloneProjectSchema>
