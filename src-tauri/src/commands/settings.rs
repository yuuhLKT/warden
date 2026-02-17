use crate::config_store::config::{load_settings, save_settings};

#[tauri::command]
pub fn save_default_ide(ide: String) -> Result<(), String> {
    let mut settings = load_settings();
    settings.default_ide = ide;
    save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_default_ide() -> Result<String, String> {
    let settings = load_settings();
    Ok(settings.default_ide)
}

#[tauri::command]
pub fn save_root_path(path: String) -> Result<(), String> {
    let mut settings = load_settings();
    settings.workspace_path = path;
    save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_root_path() -> Result<String, String> {
    let settings = load_settings();
    Ok(settings.workspace_path)
}

#[tauri::command]
pub fn save_default_suffix(suffix: String) -> Result<(), String> {
    let mut settings = load_settings();
    settings.default_suffix = suffix;
    save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_default_suffix() -> Result<String, String> {
    let settings = load_settings();
    Ok(settings.default_suffix)
}

#[tauri::command]
pub fn save_scan_depth(depth: u8) -> Result<(), String> {
    let mut settings = load_settings();
    settings.scan_depth = depth;
    save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn get_scan_depth() -> Result<u8, String> {
    let settings = load_settings();
    Ok(settings.scan_depth)
}
