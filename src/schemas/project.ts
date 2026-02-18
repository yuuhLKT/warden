import { z } from "zod"
import {
  STACKS,
  SERVICE_TYPES,
  PROJECT_STATUSES,
  PROJECT_CATEGORIES,
  VALIDATION,
} from "@/lib/constants"

export const stackSchema = z.enum(STACKS)

export const projectStatusSchema = z.enum(PROJECT_STATUSES)

export const serviceTypeSchema = z.enum(SERVICE_TYPES)

export const projectCategorySchema = z.enum(PROJECT_CATEGORIES)

const urlField = z
  .string()
  .min(1, "URL is required")
  .regex(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/, "URL must be a valid domain (e.g., mysite.test)")

const portField = z
  .number()
  .min(VALIDATION.MIN_PORT, `Port must be greater than ${VALIDATION.MIN_PORT}`)
  .max(VALIDATION.MAX_PORT, `Port must be less than ${VALIDATION.MAX_PORT}`)

const serviceBaseSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  type: serviceTypeSchema,
  stack: stackSchema,
  path: z.string().min(1, "Service path is required"),
  url: urlField,
  port: portField,
  command: z.string().min(1, "Command is required"),
})

export const projectServiceSchema = serviceBaseSchema.extend({
  id: z.string().uuid(),
  status: projectStatusSchema,
})

export const serviceFormSchema = serviceBaseSchema

export const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  folder: z.string().min(1, "Project folder is required"),
  services: z.array(serviceFormSchema).min(VALIDATION.MIN_SERVICES, "Add at least one service"),
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

export const cloneProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  gitUrl: z.string().url("Invalid Git URL").min(1, "Git URL is required"),
  folder: z.string().min(1, "Clone folder is required"),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
export type ServiceFormValues = z.infer<typeof serviceFormSchema>
export type CloneProjectValues = z.infer<typeof cloneProjectSchema>
