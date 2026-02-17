use crate::models::detected_service::{
    DetectedProject, DetectedService, Framework, PackageManager, ServiceCategory,
};
use crate::utils::detectors::{
    detect_commands, detect_docker_services, detect_framework, detect_monorepo,
    detect_package_manager, detect_port, detect_service_category, get_tauri_backend_commands,
    get_tauri_frontend_commands, get_workspace_projects, has_docker, has_docker_compose,
};
use crate::utils::parsers::{is_tauri_project, PackageJson, TauriConf};
use std::fs;
use std::path::Path;

// ============================================================================
// Legacy types for backward compatibility
// ============================================================================

/// Legacy project type (for backward compatibility)
#[derive(Debug, Clone)]
pub enum ProjectType {
    Node,
    Rust,
    Php,
    Python,
    Ruby,
    Go,
}

impl ProjectType {
    pub fn to_stack(&self) -> &'static str {
        match self {
            ProjectType::Node => "node",
            ProjectType::Rust => "rust",
            ProjectType::Php => "php",
            ProjectType::Python => "django",
            ProjectType::Ruby => "rails",
            ProjectType::Go => "go",
        }
    }

    pub fn default_port(&self) -> u16 {
        match self {
            ProjectType::Node => 3000,
            ProjectType::Rust => 8080,
            ProjectType::Php => 8000,
            ProjectType::Python => 5000,
            ProjectType::Ruby => 3000,
            ProjectType::Go => 8080,
        }
    }
}

/// Legacy scanned project (for backward compatibility)
#[derive(Debug, Clone)]
pub struct ScannedProject {
    pub name: String,
    pub path: String,
    pub project_type: ProjectType,
}

// ============================================================================
// Legacy functions for backward compatibility
// ============================================================================

/// Detecta o tipo de projeto baseado nos arquivos encontrados (legacy)
pub fn detect_project_type(path: &Path) -> Option<ProjectType> {
    if !path.is_dir() {
        return None;
    }

    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(_) => return None,
    };

    let mut has_package_json = false;
    let mut has_cargo_toml = false;
    let mut has_composer_json = false;
    let mut has_requirements_txt = false;
    let mut has_gemfile = false;
    let mut has_go_mod = false;

    for entry in entries.flatten() {
        let file_name = entry.file_name();
        let file_name = file_name.to_string_lossy();

        match file_name.as_ref() {
            "package.json" => has_package_json = true,
            "Cargo.toml" => has_cargo_toml = true,
            "composer.json" => has_composer_json = true,
            "requirements.txt" => has_requirements_txt = true,
            "Gemfile" => has_gemfile = true,
            "go.mod" => has_go_mod = true,
            _ => {}
        }
    }

    // Priority: backend languages first, then Node.js
    // This ensures PHP/Python/Ruby/Go projects with package.json (for frontend assets)
    // are correctly detected
    if has_composer_json {
        Some(ProjectType::Php)
    } else if has_requirements_txt {
        Some(ProjectType::Python)
    } else if has_gemfile {
        Some(ProjectType::Ruby)
    } else if has_go_mod {
        Some(ProjectType::Go)
    } else if has_cargo_toml {
        Some(ProjectType::Rust)
    } else if has_package_json {
        Some(ProjectType::Node)
    } else {
        None
    }
}

/// Verifica se uma pasta parece ser um projeto válido (legacy)
pub fn is_valid_project(path: &Path) -> bool {
    if !path.is_dir() {
        return false;
    }

    let folder_name = match path.file_name() {
        Some(name) => name.to_string_lossy(),
        None => return false,
    };

    // Ignorar pastas ocultas
    if folder_name.starts_with('.') {
        return false;
    }

    // Ignorar pastas comuns que não são projetos
    let ignored = [
        "node_modules",
        "target",
        "vendor",
        "__pycache__",
        ".git",
        "dist",
        "build",
    ];
    if ignored.contains(&folder_name.as_ref()) {
        return false;
    }

    // Verificar se tem pelo menos um arquivo de configuração de projeto
    detect_project_type(path).is_some()
}

/// Escaneia uma pasta e retorna todos os projetos encontrados (legacy)
pub fn scan_workspace(path: &str) -> Vec<ScannedProject> {
    let mut projects = Vec::new();

    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(_) => return projects,
    };

    for entry in entries.flatten() {
        let path = entry.path();

        if is_valid_project(&path) {
            let project_type = detect_project_type(&path).unwrap();
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            projects.push(ScannedProject {
                name,
                path: path.to_string_lossy().to_string(),
                project_type,
            });
        }
    }

    projects
}

// ============================================================================
// New advanced scanning functions
// ============================================================================

/// Scan a project deeply and detect all services
pub fn scan_project_deep(path: &Path, max_depth: u8) -> DetectedProject {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let mut project = DetectedProject::new(name, path.to_string_lossy().to_string());

    // Detect root package manager
    project.root_package_manager = detect_package_manager(path);

    // Check for Docker
    project.has_docker = has_docker(path);
    project.has_docker_compose = has_docker_compose(path);

    // Check if this is a Tauri project
    if is_tauri_project(path) {
        project.is_tauri = true;
        project.services = scan_tauri_project(path);
        return project;
    }

    // Check for monorepo
    if let Some(monorepo_info) = detect_monorepo(path) {
        project.is_monorepo = true;
        project.monorepo_tool = monorepo_info.tool;
        project.workspaces = monorepo_info
            .workspace_paths
            .iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect();

        // Scan each workspace
        for workspace_path in &monorepo_info.workspace_paths {
            if let Some(service) = scan_single_service(workspace_path, path) {
                project.services.push(service);
            }
        }
    } else {
        // Single project - scan as one service
        if let Some(service) = scan_single_service(path, path) {
            project.services.push(service);
        }
    }

    // Also scan Docker services if present
    if project.has_docker_compose {
        let docker_services = detect_docker_services(path);
        for docker_service in docker_services {
            // Avoid duplicates (if the docker service points to an already detected service)
            let is_duplicate = project.services.iter().any(|s| {
                s.relative_path == docker_service.relative_path
                    || s.docker_service_name == docker_service.docker_service_name
            });

            if !is_duplicate {
                project.services.push(docker_service);
            }
        }
    }

    // Scan for additional projects if depth > 1
    if max_depth > 1 && !project.is_monorepo {
        let additional_projects = get_workspace_projects(path, max_depth);
        for additional_path in additional_projects {
            if additional_path != path.to_path_buf() {
                if let Some(service) = scan_single_service(&additional_path, path) {
                    let is_duplicate = project.services.iter().any(|s| s.path == service.path);
                    if !is_duplicate {
                        project.services.push(service);
                    }
                }
            }
        }
    }

    project
}

/// Scan a Tauri project (special handling)
fn scan_tauri_project(path: &Path) -> Vec<DetectedService> {
    let mut services = Vec::new();

    let package_manager = detect_package_manager(path);

    // Service 1: Frontend
    let mut frontend = DetectedService::new(
        "frontend".to_string(),
        path.to_string_lossy().to_string(),
        ".".to_string(),
    );

    frontend.package_manager = package_manager.clone();
    frontend.category = ServiceCategory::Frontend;

    // Detect frontend framework
    if let Some(pkg) = PackageJson::parse(path) {
        if pkg.has_dependency("react") {
            frontend.framework = Framework::React;
        } else if pkg.has_dependency("vue") {
            frontend.framework = Framework::Vue;
        } else if pkg.has_dependency("svelte") {
            frontend.framework = Framework::Svelte;
        } else if pkg.has_dependency("solid-js") {
            frontend.framework = Framework::Solid;
        } else {
            frontend.framework = Framework::Vite;
        }
    }

    // Get port from tauri.conf.json
    if let Some(tauri_conf) = TauriConf::parse(path) {
        frontend.port = tauri_conf.get_dev_port();
    }

    // Get commands
    let frontend_commands = get_tauri_frontend_commands(path, &package_manager);
    frontend.dev_command = frontend_commands.dev;
    frontend.build_command = frontend_commands.build;
    frontend.install_command = frontend_commands.install;

    frontend.update_stack_from_framework();
    frontend.update_port_from_framework();

    services.push(frontend);

    // Service 2: Tauri Backend
    let tauri_src = path.join("src-tauri");
    let mut backend = DetectedService::new(
        "tauri".to_string(),
        tauri_src.to_string_lossy().to_string(),
        "src-tauri".to_string(),
    );

    backend.package_manager = PackageManager::Cargo;
    backend.category = ServiceCategory::Desktop;
    backend.framework = Framework::Tauri;
    backend.stack = "rust".to_string();
    backend.port = None; // Desktop apps don't have HTTP ports

    let backend_commands = get_tauri_backend_commands();
    backend.dev_command = backend_commands.dev;
    backend.build_command = backend_commands.build;
    backend.install_command = backend_commands.install;

    services.push(backend);

    services
}

/// Scan a single service/project
fn scan_single_service(path: &Path, root_path: &Path) -> Option<DetectedService> {
    if !path.exists() || !path.is_dir() {
        return None;
    }

    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let relative_path = path
        .strip_prefix(root_path)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| ".".to_string());

    let mut service = DetectedService::new(
        name,
        path.to_string_lossy().to_string(),
        if relative_path.is_empty() {
            ".".to_string()
        } else {
            relative_path
        },
    );

    // Detect package manager
    service.package_manager = detect_package_manager(path);

    // Detect framework
    service.framework = detect_framework(path);

    // Detect service category
    service.category = detect_service_category(path, &service.framework);

    // Detect port
    service.port = detect_port(path, &service.framework);

    // Detect commands
    let commands = detect_commands(path, &service.framework, &service.package_manager);
    service.dev_command = commands.dev;
    service.build_command = commands.build;
    service.start_command = commands.start;
    service.install_command = commands.install;

    // Update stack from framework
    service.update_stack_from_framework();
    service.update_port_from_framework();
    service.update_install_from_package_manager();

    Some(service)
}

/// Scan workspace and return detailed project information
pub fn scan_workspace_deep(workspace_path: &str, max_depth: u8) -> Vec<DetectedProject> {
    let mut projects = Vec::new();
    let path = Path::new(workspace_path);

    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(_) => return projects,
    };

    for entry in entries.flatten() {
        let entry_path = entry.path();

        if !entry_path.is_dir() {
            continue;
        }

        let folder_name = entry_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        // Skip hidden directories and common non-project directories
        if folder_name.starts_with('.')
            || matches!(
                folder_name.as_str(),
                "node_modules" | "target" | "dist" | "build" | "__pycache__" | "vendor"
            )
        {
            continue;
        }

        // Check if this is a valid project
        if is_valid_project(&entry_path) {
            let project = scan_project_deep(&entry_path, max_depth);
            projects.push(project);
        }
    }

    projects
}
