use rusqlite::Result;
use std::sync::Mutex;
use tauri::State;

use crate::database::connection::Database;
use crate::models::detected_service::{DetectedProject, DetectedService};
use crate::models::project::{CreateProjectRequest, Project, UpdateProjectRequest};
use crate::models::service::{CreateServiceRequest, Service, UpdateServiceRequest};
use crate::repositories::project_repository::ProjectRepository;
use crate::repositories::service_repository::ServiceRepository;
use crate::utils::project_scanner::{scan_project_deep, scan_workspace_deep};
use serde::Serialize;

pub struct AppState {
    pub db: Mutex<Database>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectWithServices {
    pub id: String,
    pub name: String,
    pub folder: String,
    pub created_at: String,
    pub updated_at: String,
    pub services: Vec<ServiceResponse>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceResponse {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub service_type: String,
    pub stack: String,
    pub path: String,
    pub url: String,
    pub port: i32,
    pub command: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Service> for ServiceResponse {
    fn from(service: Service) -> Self {
        ServiceResponse {
            id: service.id,
            project_id: service.project_id,
            name: service.name,
            service_type: service.service_type,
            stack: service.stack,
            path: service.path,
            url: service.url,
            port: service.port,
            command: service.command,
            status: service.status,
            created_at: service.created_at,
            updated_at: service.updated_at,
        }
    }
}

#[tauri::command]
pub fn create_project(
    state: State<AppState>,
    project: CreateProjectRequest,
    services: Vec<CreateServiceRequest>,
) -> Result<Project, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let project_repo = ProjectRepository::new(conn);
    let created_project = project_repo.create(&project).map_err(|e| e.to_string())?;

    if !services.is_empty() {
        let service_repo = ServiceRepository::new(conn);
        for service in services {
            service_repo.create(&service).map_err(|e| e.to_string())?;
        }
    }

    Ok(created_project)
}

#[tauri::command]
pub fn get_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let project_repo = ProjectRepository::new(conn);
    project_repo.find_all().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(state: State<AppState>, id: String) -> Result<Option<Project>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let project_repo = ProjectRepository::new(conn);
    project_repo.find_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(state: State<AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let service_repo = ServiceRepository::new(conn);
    service_repo
        .delete_by_project_id(&id)
        .map_err(|e| e.to_string())?;

    let project_repo = ProjectRepository::new(conn);
    project_repo.delete(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_services_by_project(
    state: State<AppState>,
    project_id: String,
) -> Result<Vec<ServiceResponse>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let service_repo = ServiceRepository::new(conn);
    let services = service_repo
        .find_by_project_id(&project_id)
        .map_err(|e| e.to_string())?;

    Ok(services.into_iter().map(ServiceResponse::from).collect())
}

#[tauri::command]
pub fn get_projects_with_services(
    state: State<AppState>,
) -> Result<Vec<ProjectWithServices>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let project_repo = ProjectRepository::new(conn);
    let service_repo = ServiceRepository::new(conn);

    let projects = project_repo.find_all().map_err(|e| e.to_string())?;

    let projects_with_services: Result<Vec<ProjectWithServices>, String> = projects
        .into_iter()
        .map(|project| {
            let services = service_repo
                .find_by_project_id(&project.id)
                .map_err(|e| e.to_string())?;

            Ok(ProjectWithServices {
                id: project.id,
                name: project.name,
                folder: project.folder,
                created_at: project.created_at,
                updated_at: project.updated_at,
                services: services.into_iter().map(ServiceResponse::from).collect(),
            })
        })
        .collect();

    projects_with_services
}

#[tauri::command]
pub fn project_exists_by_folder(state: State<AppState>, folder: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let project_repo = ProjectRepository::new(conn);
    project_repo
        .folder_exists(&folder)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn scan_project_services(path: String, max_depth: u8) -> Result<DetectedProject, String> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err("Path does not exist".to_string());
    }

    if !path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    Ok(scan_project_deep(path, max_depth))
}

#[tauri::command]
pub fn scan_workspace_services(
    workspace_path: String,
    max_depth: u8,
) -> Result<Vec<DetectedProject>, String> {
    let path = std::path::Path::new(&workspace_path);

    if !path.exists() {
        return Err("Workspace path does not exist".to_string());
    }

    if !path.is_dir() {
        return Err("Workspace path is not a directory".to_string());
    }

    Ok(scan_workspace_deep(&workspace_path, max_depth))
}

#[tauri::command]
pub fn get_detected_services(path: String) -> Result<Vec<DetectedService>, String> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err("Path does not exist".to_string());
    }

    let project = scan_project_deep(path, 1);
    Ok(project.services)
}

#[tauri::command]
pub fn update_project(
    state: State<AppState>,
    id: String,
    project: UpdateProjectRequest,
) -> Result<Project, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let project_repo = ProjectRepository::new(conn);
    project_repo
        .update(&id, &project)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Project not found".to_string())
}

#[tauri::command]
pub fn update_service(
    state: State<AppState>,
    id: String,
    service: UpdateServiceRequest,
) -> Result<ServiceResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();

    let service_repo = ServiceRepository::new(conn);
    service_repo
        .update(&id, &service)
        .map_err(|e| e.to_string())?
        .map(ServiceResponse::from)
        .ok_or_else(|| "Service not found".to_string())
}
