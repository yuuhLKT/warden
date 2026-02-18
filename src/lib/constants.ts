/**
 * Shared constants for the Warden application
 * This file contains all constants that are used across the frontend
 * to avoid duplication and ensure consistency.
 */

// ============================================================================
// Stack Types
// ============================================================================

export const STACKS = [
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
] as const

export type Stack = (typeof STACKS)[number]

// ============================================================================
// Service Types
// ============================================================================

export const SERVICE_TYPES = ["frontend", "backend"] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

// ============================================================================
// Project Status
// ============================================================================

export const PROJECT_STATUSES = ["running", "stopped", "error"] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

// ============================================================================
// Project Categories
// ============================================================================

export const PROJECT_CATEGORIES = ["frontend", "backend", "fullstack"] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

// ============================================================================
// IDE Types
// ============================================================================

export const IDES = [
  "vscode",
  "cursor",
  "phpstorm",
  "webstorm",
  "intellij",
  "sublime",
  "vim",
  "neovim",
  "zed",
] as const

export type IDE = (typeof IDES)[number]

// ============================================================================
// Theme Types
// ============================================================================

export const THEMES = ["light", "dark", "system"] as const

export type Theme = (typeof THEMES)[number]

// ============================================================================
// Pages/Routes
// ============================================================================

export const PAGES = ["dashboard", "monitor", "settings", "project"] as const

export type Page = (typeof PAGES)[number]

// ============================================================================
// Scaffold Package Managers
// ============================================================================

export const SCAFFOLD_PACKAGE_MANAGERS = [
  "npm",
  "yarn",
  "pnpm",
  "bun",
  "deno",
  "composer",
  "pip",
  "poetry",
  "pipenv",
  "cargo",
  "gradle",
  "maven",
  "dotnet",
  "mix",
] as const

export type ScaffoldPackageManager = (typeof SCAFFOLD_PACKAGE_MANAGERS)[number]

// ============================================================================
// Scaffold Languages
// ============================================================================

export const SCAFFOLD_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "php",
  "rust",
  "go",
  "java",
  "kotlin",
  "ruby",
  "elixir",
  "csharp",
] as const

export type ScaffoldLanguage = (typeof SCAFFOLD_LANGUAGES)[number]

// ============================================================================
// UI Constants
// ============================================================================

export const SIDEBAR_COLLAPSED_WIDTH = 64
export const SIDEBAR_EXPANDED_WIDTH = 256
export const HEADER_HEIGHT = 56

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULTS = {
  PORT: 3000,
  URL_SUFFIX: "test",
  SCAN_DEPTH: 2,
  IDE: "vscode" as IDE,
  THEME: "system" as Theme,
  LANGUAGE: "en",
} as const

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  MIN_PORT: 1024,
  MAX_PORT: 65535,
  MIN_SERVICES: 1,
} as const

// ============================================================================
// Package Manager Configurations
// ============================================================================

export const PACKAGE_MANAGER_CONFIGS: Record<
  ScaffoldPackageManager,
  { name: string; icon: string; color: string }
> = {
  npm: { name: "npm", icon: "📦", color: "#CB3837" },
  yarn: { name: "Yarn", icon: "🧶", color: "#2C8EBB" },
  pnpm: { name: "pnpm", icon: "🦅", color: "#F69220" },
  bun: { name: "Bun", icon: "🥯", color: "#FFD700" },
  deno: { name: "Deno", icon: "🦕", color: "#000000" },
  composer: { name: "Composer", icon: "🎼", color: "#885630" },
  pip: { name: "pip", icon: "🐍", color: "#3776AB" },
  poetry: { name: "Poetry", icon: "📜", color: "#60A5FA" },
  pipenv: { name: "Pipenv", icon: "🐍", color: "#3B82F6" },
  cargo: { name: "Cargo", icon: "🦀", color: "#DEA584" },
  gradle: { name: "Gradle", icon: "🐘", color: "#02303A" },
  maven: { name: "Maven", icon: "🪶", color: "#C71A36" },
  dotnet: { name: ".NET", icon: "🎯", color: "#512BD4" },
  mix: { name: "Mix", icon: "💧", color: "#4B275F" },
}

// ============================================================================
// Language Configurations
// ============================================================================

export const LANGUAGE_CONFIGS: Record<ScaffoldLanguage, { name: string; color: string }> = {
  typescript: { name: "TypeScript", color: "#3178C6" },
  javascript: { name: "JavaScript", color: "#F7DF1E" },
  python: { name: "Python", color: "#3776AB" },
  php: { name: "PHP", color: "#777BB4" },
  rust: { name: "Rust", color: "#DEA584" },
  go: { name: "Go", color: "#00ADD8" },
  java: { name: "Java", color: "#007396" },
  kotlin: { name: "Kotlin", color: "#7F52FF" },
  ruby: { name: "Ruby", color: "#CC342D" },
  elixir: { name: "Elixir", color: "#4B275F" },
  csharp: { name: "C#", color: "#239120" },
}

// ============================================================================
// IDE Configurations
// ============================================================================

export interface IDEConfig {
  id: IDE
  name: string
  command: string
}

export const IDE_CONFIGS: Record<IDE, Omit<IDEConfig, "installed">> = {
  vscode: {
    id: "vscode",
    name: "VS Code",
    command: "code",
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    command: "cursor",
  },
  phpstorm: {
    id: "phpstorm",
    name: "PHPStorm",
    command: "phpstorm",
  },
  webstorm: {
    id: "webstorm",
    name: "WebStorm",
    command: "webstorm",
  },
  intellij: {
    id: "intellij",
    name: "IntelliJ IDEA",
    command: "idea",
  },
  sublime: {
    id: "sublime",
    name: "Sublime Text",
    command: "subl",
  },
  vim: {
    id: "vim",
    name: "Vim",
    command: "vim",
  },
  neovim: {
    id: "neovim",
    name: "Neovim",
    command: "nvim",
  },
  zed: {
    id: "zed",
    name: "Zed",
    command: "zed",
  },
}
