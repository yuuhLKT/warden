mod commands;
mod config_store;

use crate::config_store::config::{load_settings, Settings};
use std::sync::Mutex;

pub struct AppState {
    pub settings: Mutex<Settings>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_settings = load_settings();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            settings: Mutex::new(initial_settings),
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::save_default_ide,
            commands::settings::get_default_ide,
            commands::settings::save_root_path,
            commands::settings::get_root_path,
            commands::settings::save_theme,
            commands::settings::get_theme,
            commands::git::clone,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
