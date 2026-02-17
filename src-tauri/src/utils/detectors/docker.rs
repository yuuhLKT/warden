use crate::models::detected_service::{
    DetectedService, Framework, PackageManager, ServiceCategory,
};
use crate::utils::parsers::{DockerCompose, DockerService};
use std::path::Path;

/// Detect services from docker-compose.yml
pub fn detect_docker_services(path: &Path) -> Vec<DetectedService> {
    let mut services = Vec::new();

    if let Some(compose) = DockerCompose::parse(path) {
        for (name, docker_service) in &compose.services {
            // Skip infrastructure services (databases, message queues, etc.)
            if docker_service.is_infrastructure() {
                continue;
            }

            if let Some(service) = docker_service_to_detected(path, name, docker_service) {
                services.push(service);
            }
        }
    }

    services
}

/// Convert a Docker service to a DetectedService
fn docker_service_to_detected(
    project_path: &Path,
    name: &str,
    docker_service: &DockerService,
) -> Option<DetectedService> {
    let mut service = DetectedService::new(
        name.to_string(),
        project_path.to_string_lossy().to_string(),
        ".".to_string(),
    );

    service.is_docker_service = true;
    service.docker_service_name = Some(name.to_string());
    service.category = ServiceCategory::Docker;
    service.framework = Framework::Unknown;
    service.package_manager = PackageManager::Unknown;

    // Get port
    service.port = docker_service.get_first_port();

    // Get build context path
    if let Some(context) = docker_service.get_build_context() {
        service.relative_path = context.clone();
        service.path = project_path.join(&context).to_string_lossy().to_string();
    }

    // Get command
    service.dev_command = docker_service.get_command_string();

    // Try to determine service type from name
    let name_lower = name.to_lowercase();
    if name_lower.contains("frontend")
        || name_lower.contains("web")
        || name_lower.contains("client")
        || name_lower.contains("ui")
    {
        service.category = ServiceCategory::Frontend;
    } else if name_lower.contains("backend")
        || name_lower.contains("api")
        || name_lower.contains("server")
        || name_lower.contains("service")
    {
        service.category = ServiceCategory::Backend;
    } else if name_lower.contains("worker")
        || name_lower.contains("job")
        || name_lower.contains("queue")
    {
        service.category = ServiceCategory::Worker;
    }

    // Try to detect framework from image
    if let Some(image) = &docker_service.image {
        let image_lower = image.to_lowercase();

        // Node.js
        if image_lower.contains("node") {
            service.framework = Framework::Node;
            service.stack = "node".to_string();
        }
        // Python
        else if image_lower.contains("python") {
            service.framework = Framework::Python;
            service.stack = "django".to_string();
        }
        // PHP
        else if image_lower.contains("php") {
            service.framework = Framework::Php;
            service.stack = "php".to_string();
        }
        // Ruby
        else if image_lower.contains("ruby") {
            service.framework = Framework::Ruby;
            service.stack = "rails".to_string();
        }
        // Go
        else if image_lower.contains("golang") || image_lower.contains("go:") {
            service.framework = Framework::Go;
            service.stack = "go".to_string();
        }
        // Rust
        else if image_lower.contains("rust") {
            service.framework = Framework::Rust;
            service.stack = "rust".to_string();
        }
        // Nginx (frontend static files)
        else if image_lower.contains("nginx") {
            service.category = ServiceCategory::Frontend;
            service.framework = Framework::Unknown;
            service.stack = "other".to_string();
        }
    }

    Some(service)
}

/// Check if the project has Docker configuration
pub fn has_docker(path: &Path) -> bool {
    path.join("Dockerfile").exists()
        || path.join("dockerfile").exists()
        || path.join("docker-compose.yml").exists()
        || path.join("docker-compose.yaml").exists()
        || path.join("compose.yml").exists()
        || path.join("compose.yaml").exists()
}

/// Check if the project has docker-compose
pub fn has_docker_compose(path: &Path) -> bool {
    path.join("docker-compose.yml").exists()
        || path.join("docker-compose.yaml").exists()
        || path.join("compose.yml").exists()
        || path.join("compose.yaml").exists()
}

/// Get docker-compose command for running services
#[allow(dead_code)]
pub fn get_docker_compose_command(service_name: Option<&str>) -> String {
    match service_name {
        Some(name) => format!("docker compose up {}", name),
        None => "docker compose up".to_string(),
    }
}

/// Get docker-compose dev command (with watch/rebuild)
#[allow(dead_code)]
pub fn get_docker_compose_dev_command(service_name: Option<&str>) -> String {
    match service_name {
        Some(name) => format!("docker compose up --build --watch {}", name),
        None => "docker compose up --build --watch".to_string(),
    }
}
