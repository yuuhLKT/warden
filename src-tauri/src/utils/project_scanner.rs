use crate::models::detected_service::{
    DetectedProject, DetectedService, Framework, PackageManager, ServiceCategory,
};
use crate::utils::detectors::{
    detect_commands, detect_docker_services, detect_framework, detect_monorepo,
    detect_package_manager, detect_port, detect_service_category, get_tauri_backend_commands,
    get_tauri_frontend_commands, get_workspace_projects, has_docker, has_docker_compose,
};
use crate::utils::parsers::{is_tauri_project, CargoToml, PackageJson, TauriConf};
use rayon::prelude::*;
use std::fs;
use std::path::Path;

fn is_valid_project(path: &Path) -> bool {
    if !path.is_dir() {
        return false;
    }

    let folder_name = match path.file_name() {
        Some(name) => name.to_string_lossy(),
        None => return false,
    };

    if folder_name.starts_with('.') {
        return false;
    }

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

    let has_project_file = [
        "package.json",
        "Cargo.toml",
        "composer.json",
        "requirements.txt",
        "pyproject.toml",
        "Gemfile",
        "go.mod",
        "pom.xml",
        "build.gradle",
        "mix.exs",
    ]
    .iter()
    .any(|file| path.join(file).exists());

    has_project_file
}

pub fn scan_project_deep(path: &Path, max_depth: u8) -> DetectedProject {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let mut project = DetectedProject::new(name, path.to_string_lossy().to_string());

    project.root_package_manager = detect_package_manager(path);
    project.has_docker = has_docker(path);
    project.has_docker_compose = has_docker_compose(path);

    if is_tauri_project(path) {
        project.is_tauri = true;
        project.services = scan_tauri_project(path);
        return project;
    }

    if let Some(monorepo_info) = detect_monorepo(path) {
        project.is_monorepo = true;
        project.monorepo_tool = monorepo_info.tool;
        project.workspaces = monorepo_info
            .workspace_paths
            .iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect();

        for workspace_path in &monorepo_info.workspace_paths {
            if let Some(service) = scan_single_service(workspace_path, path) {
                project.services.push(service);
            }
        }
    } else if let Some(service) = scan_single_service(path, path) {
        project.services.push(service);
    }

    if project.has_docker_compose {
        let docker_services = detect_docker_services(path);
        for docker_service in docker_services {
            let is_duplicate = project.services.iter().any(|s| {
                s.relative_path == docker_service.relative_path
                    || s.docker_service_name == docker_service.docker_service_name
            });

            if !is_duplicate {
                project.services.push(docker_service);
            }
        }
    }

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

fn scan_tauri_project(path: &Path) -> Vec<DetectedService> {
    let mut services = Vec::new();

    let package_manager = detect_package_manager(path);
    let package_json = PackageJson::parse(path);

    let mut frontend = DetectedService::new(
        "frontend".to_string(),
        path.to_string_lossy().to_string(),
        ".".to_string(),
    );

    frontend.package_manager = package_manager.clone();
    frontend.category = ServiceCategory::Frontend;

    if let Some(ref pkg) = package_json {
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

    if let Some(tauri_conf) = TauriConf::parse(path) {
        frontend.port = tauri_conf.get_dev_port();
    }

    let frontend_commands = get_tauri_frontend_commands(path, &package_manager);
    frontend.dev_command = frontend_commands.dev;
    frontend.build_command = frontend_commands.build;
    frontend.install_command = frontend_commands.install;

    frontend.update_stack_from_framework();
    frontend.update_port_from_framework();

    services.push(frontend);

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
    backend.port = None;

    let backend_commands = get_tauri_backend_commands();
    backend.dev_command = backend_commands.dev;
    backend.build_command = backend_commands.build;
    backend.install_command = backend_commands.install;

    services.push(backend);

    services
}

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

    let package_json = PackageJson::parse(path);
    let cargo_toml = CargoToml::parse(path);

    service.package_manager = detect_package_manager(path);
    service.framework = detect_framework(path, package_json.as_ref(), cargo_toml.as_ref());
    service.category = detect_service_category(path, &service.framework, package_json.as_ref());
    service.port = detect_port(path, &service.framework, package_json.as_ref());

    let commands = detect_commands(
        path,
        &service.framework,
        &service.package_manager,
        package_json.as_ref(),
        cargo_toml.as_ref(),
    );
    service.dev_command = commands.dev;
    service.build_command = commands.build;
    service.start_command = commands.start;
    service.install_command = commands.install;

    service.update_stack_from_framework();
    service.update_port_from_framework();
    service.update_install_from_package_manager();

    Some(service)
}

pub fn scan_workspace_deep(workspace_path: &str, max_depth: u8) -> Vec<DetectedProject> {
    let path = Path::new(workspace_path);

    let entries: Vec<_> = match fs::read_dir(path) {
        Ok(entries) => entries.filter_map(|e| e.ok()).collect(),
        Err(_) => return Vec::new(),
    };

    entries
        .into_par_iter()
        .filter_map(|entry| {
            let entry_path = entry.path();

            if !entry_path.is_dir() {
                return None;
            }

            let folder_name = entry_path.file_name()?;
            let folder_name = folder_name.to_string_lossy();

            if folder_name.starts_with('.')
                || matches!(
                    folder_name.as_ref(),
                    "node_modules" | "target" | "dist" | "build" | "__pycache__" | "vendor"
                )
            {
                return None;
            }

            if is_valid_project(&entry_path) {
                Some(scan_project_deep(&entry_path, max_depth))
            } else {
                None
            }
        })
        .collect()
}
