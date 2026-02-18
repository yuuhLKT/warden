/**
 * Settings types
 * IDE, Theme and IDE_CONFIGS are re-exported from @/lib/constants
 * to keep a single source of truth.
 */

export type { IDE, Theme, IDEConfig } from "@/lib/constants"
export { IDE_CONFIGS } from "@/lib/constants"

export interface Settings {
  defaultIDE: import("@/lib/constants").IDE
  theme: import("@/lib/constants").Theme
  language: string
}
