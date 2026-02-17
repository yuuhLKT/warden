mod commands;
mod config_store;
mod database;
mod models;
mod repositories;
mod utils;

use crate::commands::project::AppState;
use crate::database::connection::init_database;
use crate::database::migrations::run_migrations;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inicializar banco de dados e rodar migrations
    let mut db = init_database().expect("Failed to initialize database");
    run_migrations(db.get_connection_mut()).expect("Failed to run migrations");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState { db: Mutex::new(db) })
        .invoke_handler(tauri::generate_handler![
            commands::settings::save_default_ide,
            commands::settings::get_default_ide,
            commands::settings::save_root_path,
            commands::settings::get_root_path,
            commands::settings::save_default_suffix,
            commands::settings::get_default_suffix,
            commands::settings::save_scan_depth,
            commands::settings::get_scan_depth,
            commands::git::clone,
            commands::ide::open_in_ide,
            commands::project::create_project,
            commands::project::get_projects,
            commands::project::get_project,
            commands::project::delete_project,
            commands::project::scan_workspace_projects,
            commands::project::get_services_by_project,
            commands::project::get_projects_with_services,
            commands::project::project_exists_by_folder,
            commands::project::scan_project_services,
            commands::project::scan_workspace_services,
            commands::project::get_detected_services,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
