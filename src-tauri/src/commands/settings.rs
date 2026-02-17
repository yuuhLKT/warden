use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn save_default_ide(ide: String, state: State<AppState>) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.default_ide = ide.clone();
    crate::config_store::config::save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_default_ide(state: State<AppState>) -> Result<String, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.default_ide.clone())
}

#[tauri::command]
pub fn save_root_path(path: String, state: State<AppState>) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.workspace_path = path;
    crate::config_store::config::save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_root_path(state: State<AppState>) -> Result<String, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.workspace_path.clone())
}

#[tauri::command]
pub fn save_theme(theme: String, state: State<AppState>) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.theme = theme;
    crate::config_store::config::save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_theme(state: State<AppState>) -> Result<String, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.theme.clone())
}
