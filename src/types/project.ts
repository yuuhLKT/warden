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

// ============================================================================
// New types for advanced service detection
// ============================================================================

export type Framework =
  // Frontend
  | "react"
  | "vue"
  | "angular"
  | "svelte"
  | "svelteKit"
  | "solid"
  | "qwik"
  | "preact"
  // Meta Frameworks
  | "nextJs"
  | "nuxtJs"
  | "remix"
  | "astro"
  | "gatsby"
  // Build Tools
  | "vite"
  | "webpack"
  | "parcel"
  | "esbuild"
  | "turbopack"
  // Backend - Node
  | "express"
  | "fastify"
  | "koa"
  | "hapi"
  | "nestJs"
  | "adonisJs"
  | "strapi"
  // Backend - Python
  | "django"
  | "flask"
  | "fastApi"
  | "pyramid"
  | "tornado"
  // Backend - PHP
  | "laravel"
  | "symfony"
  | "codeIgniter"
  | "yii"
  | "cakePHP"
  // Backend - Ruby
  | "rails"
  | "sinatra"
  | "hanami"
  // Backend - Go
  | "gin"
  | "echo"
  | "fiber"
  | "chi"
  | "beego"
  // Backend - Rust
  | "actixWeb"
  | "axum"
  | "rocket"
  | "warp"
  | "tide"
  // Backend - Java/Kotlin
  | "spring"
  | "quarkus"
  | "micronaut"
  | "ktor"
  // Backend - .NET
  | "aspNetCore"
  | "blazor"
  // Desktop
  | "tauri"
  | "electron"
  | "neutralino"
  // Mobile
  | "reactNative"
  | "flutter"
  | "ionic"
  | "capacitor"
  | "expo"
  // CMS
  | "wordPress"
  | "drupal"
  | "ghost"
  // Generic
  | "node"
  | "deno"
  | "bun"
  | "rust"
  | "python"
  | "php"
  | "go"
  | "ruby"
  | "java"
  | "kotlin"
  | "cSharp"
  | "elixir"
  | "unknown"

export type PackageManager =
  | "npm"
  | "yarn"
  | "yarnBerry"
  | "pnpm"
  | "bun"
  | "deno"
  | "cargo"
  | "pip"
  | "poetry"
  | "pipenv"
  | "conda"
  | "uv"
  | "composer"
  | "bundler"
  | "goMod"
  | "maven"
  | "gradle"
  | "nuget"
  | "dotnet"
  | "mix"
  | "unknown"

export type ServiceCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "desktop"
  | "mobile"
  | "api"
  | "worker"
  | "docker"
  | "unknown"

export type MonorepoTool =
  | "npmWorkspaces"
  | "yarnWorkspaces"
  | "pnpmWorkspaces"
  | "bunWorkspaces"
  | "turborepo"
  | "nx"
  | "lerna"
  | "rush"
  | "cargoWorkspace"
  | "none"

export interface DetectedService {
  name: string
  path: string
  relativePath: string
  category: ServiceCategory
  framework: Framework
  stack: string
  packageManager: PackageManager
  port?: number
  devCommand?: string
  buildCommand?: string
  startCommand?: string
  installCommand?: string
  isDockerService: boolean
  dockerServiceName?: string
}

export interface DetectedProject {
  name: string
  path: string
  isMonorepo: boolean
  monorepoTool: MonorepoTool
  isTauri: boolean
  hasDocker: boolean
  hasDockerCompose: boolean
  rootPackageManager: PackageManager
  services: DetectedService[]
  workspaces: string[]
}

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
