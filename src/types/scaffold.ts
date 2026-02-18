/**
 * Scaffold types
 * ScaffoldPackageManager, ScaffoldLanguage and their configs are
 * re-exported from @/lib/constants to avoid duplication.
 */

export type { ScaffoldPackageManager, ScaffoldLanguage } from "@/lib/constants"
export { PACKAGE_MANAGER_CONFIGS, LANGUAGE_CONFIGS } from "@/lib/constants"
import type { ScaffoldPackageManager, ScaffoldLanguage } from "@/lib/constants"
import type { ProjectCategory } from "@/lib/constants"

export interface ScaffoldTemplate {
  id: string
  name: string
  description: string
  language: ScaffoldLanguage
  packageManager: ScaffoldPackageManager
  category: ProjectCategory
  command: string
  defaultPort: number
  icon?: string
  tags: string[]
}

export interface ScaffoldConfig {
  templates: ScaffoldTemplate[]
}

export interface ScaffoldProjectData {
  templateId: string
  name: string
  folder: string
  url: string
  port: number
}
