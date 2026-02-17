use serde::{Deserialize, Serialize};

/// Framework detected in the project
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Framework {
    // Frontend Frameworks
    React,
    Vue,
    Angular,
    Svelte,
    SvelteKit,
    Solid,
    Qwik,
    Preact,

    // Meta Frameworks (SSR/SSG)
    NextJs,
    NuxtJs,
    Remix,
    Astro,
    Gatsby,

    // Build Tools
    Vite,
    Webpack,
    Parcel,
    Esbuild,
    Turbopack,

    // Backend - Node.js
    Express,
    Fastify,
    Koa,
    Hapi,
    NestJs,
    AdonisJs,
    Strapi,

    // Backend - Python
    Django,
    Flask,
    FastApi,
    Pyramid,
    Tornado,

    // Backend - PHP
    Laravel,
    Symfony,
    CodeIgniter,
    Yii,
    CakePHP,

    // Backend - Ruby
    Rails,
    Sinatra,
    Hanami,

    // Backend - Go
    Gin,
    Echo,
    Fiber,
    Chi,
    Beego,

    // Backend - Rust
    ActixWeb,
    Axum,
    Rocket,
    Warp,
    Tide,

    // Backend - Java/Kotlin
    Spring,
    Quarkus,
    Micronaut,
    Ktor,

    // Backend - .NET
    AspNetCore,
    Blazor,

    // Desktop
    Tauri,
    Electron,
    Neutralino,

    // Mobile
    ReactNative,
    Flutter,
    Ionic,
    Capacitor,
    Expo,

    // CMS
    WordPress,
    Drupal,
    Ghost,

    // Generic (language detected but no specific framework)
    Node,
    Deno,
    Bun,
    Rust,
    Python,
    Php,
    Go,
    Ruby,
    Java,
    Kotlin,
    CSharp,
    Elixir,

    Unknown,
}

impl Framework {
    /// Convert framework to a stack string for compatibility
    pub fn to_stack(&self) -> &'static str {
        match self {
            // Frontend
            Framework::React | Framework::Preact => "react",
            Framework::Vue => "vue",
            Framework::Angular => "angular",
            Framework::Svelte | Framework::SvelteKit => "svelte",
            Framework::Solid => "react", // Similar ecosystem
            Framework::Qwik => "react",

            // Meta Frameworks
            Framework::NextJs => "next",
            Framework::NuxtJs => "vue",
            Framework::Remix => "react",
            Framework::Astro => "node",
            Framework::Gatsby => "react",

            // Build Tools
            Framework::Vite
            | Framework::Webpack
            | Framework::Parcel
            | Framework::Esbuild
            | Framework::Turbopack => "node",

            // Backend - Node
            Framework::Express | Framework::Fastify | Framework::Koa | Framework::Hapi => "express",
            Framework::NestJs => "nestjs",
            Framework::AdonisJs | Framework::Strapi => "node",

            // Backend - Python
            Framework::Django => "django",
            Framework::Flask => "flask",
            Framework::FastApi | Framework::Pyramid | Framework::Tornado => "django",

            // Backend - PHP
            Framework::Laravel => "laravel",
            Framework::Symfony | Framework::CodeIgniter | Framework::Yii | Framework::CakePHP => {
                "php"
            }

            // Backend - Ruby
            Framework::Rails => "rails",
            Framework::Sinatra | Framework::Hanami => "rails",

            // Backend - Go
            Framework::Gin
            | Framework::Echo
            | Framework::Fiber
            | Framework::Chi
            | Framework::Beego => "go",

            // Backend - Rust
            Framework::ActixWeb
            | Framework::Axum
            | Framework::Rocket
            | Framework::Warp
            | Framework::Tide => "rust",
            Framework::Tauri => "rust",

            // Backend - Java/Kotlin
            Framework::Spring | Framework::Quarkus | Framework::Micronaut | Framework::Ktor => {
                "other"
            }

            // Backend - .NET
            Framework::AspNetCore | Framework::Blazor => "other",

            // Desktop
            Framework::Electron | Framework::Neutralino => "node",

            // Mobile
            Framework::ReactNative | Framework::Expo => "react",
            Framework::Flutter => "other",
            Framework::Ionic | Framework::Capacitor => "node",

            // CMS
            Framework::WordPress | Framework::Drupal => "php",
            Framework::Ghost => "node",

            // Generic
            Framework::Node | Framework::Deno | Framework::Bun => "node",
            Framework::Rust => "rust",
            Framework::Python => "django",
            Framework::Php => "php",
            Framework::Go => "go",
            Framework::Ruby => "rails",
            Framework::Java | Framework::Kotlin => "other",
            Framework::CSharp => "other",
            Framework::Elixir => "other",

            Framework::Unknown => "other",
        }
    }

    /// Get the default port for this framework
    pub fn default_port(&self) -> Option<u16> {
        match self {
            // Frontend dev servers
            Framework::React | Framework::Preact => Some(3000),
            Framework::Vue => Some(5173),
            Framework::Angular => Some(4200),
            Framework::Svelte | Framework::SvelteKit => Some(5173),
            Framework::Solid | Framework::Qwik => Some(5173),
            Framework::Vite
            | Framework::Webpack
            | Framework::Parcel
            | Framework::Esbuild
            | Framework::Turbopack => Some(5173),

            // Meta Frameworks
            Framework::NextJs => Some(3000),
            Framework::NuxtJs => Some(3000),
            Framework::Remix => Some(3000),
            Framework::Astro => Some(4321),
            Framework::Gatsby => Some(8000),

            // Backend - Node
            Framework::Express | Framework::Fastify | Framework::Koa | Framework::Hapi => {
                Some(3000)
            }
            Framework::NestJs => Some(3000),
            Framework::AdonisJs => Some(3333),
            Framework::Strapi => Some(1337),

            // Backend - Python
            Framework::Django => Some(8000),
            Framework::Flask => Some(5000),
            Framework::FastApi => Some(8000),
            Framework::Pyramid => Some(6543),
            Framework::Tornado => Some(8888),

            // Backend - PHP
            Framework::Laravel => Some(8000),
            Framework::Symfony => Some(8000),
            Framework::CodeIgniter | Framework::Yii | Framework::CakePHP => Some(8080),

            // Backend - Ruby
            Framework::Rails => Some(3000),
            Framework::Sinatra => Some(4567),
            Framework::Hanami => Some(2300),

            // Backend - Go
            Framework::Gin | Framework::Echo | Framework::Chi | Framework::Beego => Some(8080),
            Framework::Fiber => Some(3000),

            // Backend - Rust
            Framework::ActixWeb | Framework::Axum | Framework::Warp | Framework::Tide => Some(8080),
            Framework::Rocket => Some(8000),

            // Backend - Java/Kotlin
            Framework::Spring | Framework::Quarkus | Framework::Micronaut => Some(8080),
            Framework::Ktor => Some(8080),

            // Backend - .NET
            Framework::AspNetCore => Some(5000),
            Framework::Blazor => Some(5000),

            // Desktop (no HTTP port typically)
            Framework::Tauri | Framework::Electron | Framework::Neutralino => None,

            // Mobile
            Framework::ReactNative | Framework::Expo => Some(8081),
            Framework::Flutter => None,
            Framework::Ionic | Framework::Capacitor => Some(8100),

            // CMS
            Framework::WordPress => Some(8080),
            Framework::Drupal => Some(8080),
            Framework::Ghost => Some(2368),

            // Generic
            Framework::Node | Framework::Deno | Framework::Bun => Some(3000),
            Framework::Rust => Some(8080),
            Framework::Python => Some(8000),
            Framework::Php => Some(8000),
            Framework::Go => Some(8080),
            Framework::Ruby => Some(3000),
            Framework::Java | Framework::Kotlin => Some(8080),
            Framework::CSharp => Some(5000),
            Framework::Elixir => Some(4000),

            Framework::Unknown => None,
        }
    }
}

/// Package manager used in the project
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum PackageManager {
    // JavaScript/TypeScript
    Npm,
    Yarn,
    YarnBerry,
    Pnpm,
    Bun,
    Deno,

    // Rust
    Cargo,

    // Python
    Pip,
    Poetry,
    Pipenv,
    Conda,
    Uv,

    // PHP
    Composer,

    // Ruby
    Bundler,

    // Go
    GoMod,

    // Java/Kotlin
    Maven,
    Gradle,

    // .NET
    Nuget,
    Dotnet,

    // Elixir
    Mix,

    Unknown,
}

impl PackageManager {
    /// Get the run command prefix for this package manager
    pub fn run_prefix(&self) -> &'static str {
        match self {
            PackageManager::Npm => "npm run",
            PackageManager::Yarn | PackageManager::YarnBerry => "yarn",
            PackageManager::Pnpm => "pnpm",
            PackageManager::Bun => "bun run",
            PackageManager::Deno => "deno task",
            PackageManager::Cargo => "cargo",
            PackageManager::Pip
            | PackageManager::Poetry
            | PackageManager::Pipenv
            | PackageManager::Conda
            | PackageManager::Uv => "python",
            PackageManager::Composer => "composer",
            PackageManager::Bundler => "bundle exec",
            PackageManager::GoMod => "go",
            PackageManager::Maven => "mvn",
            PackageManager::Gradle => "./gradlew",
            PackageManager::Nuget | PackageManager::Dotnet => "dotnet",
            PackageManager::Mix => "mix",
            PackageManager::Unknown => "",
        }
    }

    /// Get the install command for this package manager
    pub fn install_command(&self) -> &'static str {
        match self {
            PackageManager::Npm => "npm install",
            PackageManager::Yarn | PackageManager::YarnBerry => "yarn install",
            PackageManager::Pnpm => "pnpm install",
            PackageManager::Bun => "bun install",
            PackageManager::Deno => "deno cache",
            PackageManager::Cargo => "cargo build",
            PackageManager::Pip => "pip install -r requirements.txt",
            PackageManager::Poetry => "poetry install",
            PackageManager::Pipenv => "pipenv install",
            PackageManager::Conda => "conda install",
            PackageManager::Uv => "uv sync",
            PackageManager::Composer => "composer install",
            PackageManager::Bundler => "bundle install",
            PackageManager::GoMod => "go mod download",
            PackageManager::Maven => "mvn install",
            PackageManager::Gradle => "./gradlew build",
            PackageManager::Nuget | PackageManager::Dotnet => "dotnet restore",
            PackageManager::Mix => "mix deps.get",
            PackageManager::Unknown => "",
        }
    }
}

/// Service category/type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ServiceCategory {
    Frontend,
    Backend,
    Fullstack,
    Desktop,
    Mobile,
    Api,
    Worker,
    Docker,
    Unknown,
}

impl ServiceCategory {
    #[allow(dead_code)]
    pub fn to_service_type(&self) -> &'static str {
        match self {
            ServiceCategory::Frontend => "frontend",
            ServiceCategory::Backend | ServiceCategory::Api | ServiceCategory::Worker => "backend",
            ServiceCategory::Fullstack => "backend",
            ServiceCategory::Desktop => "backend",
            ServiceCategory::Mobile => "frontend",
            ServiceCategory::Docker => "backend",
            ServiceCategory::Unknown => "backend",
        }
    }
}

/// Monorepo tool detected
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MonorepoTool {
    NpmWorkspaces,
    YarnWorkspaces,
    PnpmWorkspaces,
    BunWorkspaces,
    Turborepo,
    Nx,
    Lerna,
    Rush,
    CargoWorkspace,
    None,
}

/// A detected service within a project
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedService {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub category: ServiceCategory,
    pub framework: Framework,
    pub stack: String,
    pub package_manager: PackageManager,
    pub port: Option<u16>,
    pub dev_command: Option<String>,
    pub build_command: Option<String>,
    pub start_command: Option<String>,
    pub install_command: Option<String>,
    pub is_docker_service: bool,
    pub docker_service_name: Option<String>,
}

impl DetectedService {
    pub fn new(name: String, path: String, relative_path: String) -> Self {
        Self {
            name,
            path,
            relative_path,
            category: ServiceCategory::Unknown,
            framework: Framework::Unknown,
            stack: "other".to_string(),
            package_manager: PackageManager::Unknown,
            port: None,
            dev_command: None,
            build_command: None,
            start_command: None,
            install_command: None,
            is_docker_service: false,
            docker_service_name: None,
        }
    }

    /// Update stack from framework
    pub fn update_stack_from_framework(&mut self) {
        self.stack = self.framework.to_stack().to_string();
    }

    /// Update port from framework if not already set
    pub fn update_port_from_framework(&mut self) {
        if self.port.is_none() {
            self.port = self.framework.default_port();
        }
    }

    /// Update install command from package manager if not already set
    pub fn update_install_from_package_manager(&mut self) {
        if self.install_command.is_none() && self.package_manager != PackageManager::Unknown {
            self.install_command = Some(self.package_manager.install_command().to_string());
        }
    }
}

/// A fully detected project with all its services
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedProject {
    pub name: String,
    pub path: String,
    pub is_monorepo: bool,
    pub monorepo_tool: MonorepoTool,
    pub is_tauri: bool,
    pub has_docker: bool,
    pub has_docker_compose: bool,
    pub root_package_manager: PackageManager,
    pub services: Vec<DetectedService>,
    pub workspaces: Vec<String>,
}

impl DetectedProject {
    pub fn new(name: String, path: String) -> Self {
        Self {
            name,
            path,
            is_monorepo: false,
            monorepo_tool: MonorepoTool::None,
            is_tauri: false,
            has_docker: false,
            has_docker_compose: false,
            root_package_manager: PackageManager::Unknown,
            services: Vec::new(),
            workspaces: Vec::new(),
        }
    }
}
