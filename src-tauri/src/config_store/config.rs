use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Settings {
    pub default_ide: String,
    pub ide_command: String,
    pub workspace_path: String,
    pub theme: String,
    pub default_suffix: String,
    pub scan_depth: u8,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            default_ide: "zed".to_string(),
            ide_command: "zed".to_string(),
            workspace_path: String::new(),
            theme: "system".to_string(),
            default_suffix: "test".to_string(),
            scan_depth: 2,
        }
    }
}

pub fn get_config_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("~/.config"));
    path.push("warden");
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

pub fn load_settings() -> Settings {
    let path = get_config_path();

    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(settings) = serde_json::from_str(&content) {
            return settings;
        }
    }

    let default = Settings::default();
    save_settings(&default).ok();
    default
}

pub fn save_settings(settings: &Settings) -> Result<(), String> {
    let path = get_config_path();

    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;

    fs::write(path, json).map_err(|e| e.to_string())?;

    Ok(())
}
