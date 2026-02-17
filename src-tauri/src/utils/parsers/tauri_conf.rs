use regex::Regex;
use serde::Deserialize;
use std::fs;
use std::path::Path;

/// Parsed tauri.conf.json structure
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct TauriConf {
    #[serde(rename = "productName")]
    pub product_name: Option<String>,
    pub version: Option<String>,
    pub identifier: Option<String>,
    pub build: Option<TauriBuild>,
    pub app: Option<TauriApp>,
    pub bundle: Option<TauriBundle>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct TauriBuild {
    #[serde(rename = "beforeDevCommand")]
    pub before_dev_command: Option<String>,
    #[serde(rename = "beforeBuildCommand")]
    pub before_build_command: Option<String>,
    #[serde(rename = "devUrl")]
    pub dev_url: Option<String>,
    #[serde(rename = "frontendDist")]
    pub frontend_dist: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct TauriApp {
    pub windows: Vec<TauriWindow>,
    pub security: Option<TauriSecurity>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct TauriWindow {
    pub title: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    #[serde(rename = "minWidth")]
    pub min_width: Option<u32>,
    #[serde(rename = "minHeight")]
    pub min_height: Option<u32>,
    pub center: Option<bool>,
    pub fullscreen: Option<bool>,
    pub resizable: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct TauriSecurity {
    pub csp: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct TauriBundle {
    pub active: Option<bool>,
    pub targets: Option<serde_json::Value>,
    pub icon: Option<Vec<String>>,
}

impl TauriConf {
    /// Parse tauri.conf.json from a path
    pub fn parse(path: &Path) -> Option<Self> {
        // Try multiple locations
        let possible_paths = [
            path.join("tauri.conf.json"),
            path.join("src-tauri/tauri.conf.json"),
        ];

        for config_path in possible_paths {
            if let Ok(content) = fs::read_to_string(&config_path) {
                if let Ok(config) = serde_json::from_str(&content) {
                    return Some(config);
                }
            }
        }

        None
    }

    /// Get the frontend dev URL
    pub fn get_dev_url(&self) -> Option<String> {
        self.build.as_ref().and_then(|b| b.dev_url.clone())
    }

    /// Extract port from dev URL
    pub fn get_dev_port(&self) -> Option<u16> {
        let dev_url = self.get_dev_url()?;

        // Match patterns like :1420 or :3000
        let port_regex = Regex::new(r":(\d{4,5})").ok()?;

        if let Some(captures) = port_regex.captures(&dev_url) {
            if let Some(port_str) = captures.get(1) {
                return port_str.as_str().parse::<u16>().ok();
            }
        }

        None
    }

    /// Get the frontend dev command
    pub fn get_frontend_dev_command(&self) -> Option<String> {
        self.build
            .as_ref()
            .and_then(|b| b.before_dev_command.clone())
    }

    /// Get the frontend build command
    pub fn get_frontend_build_command(&self) -> Option<String> {
        self.build
            .as_ref()
            .and_then(|b| b.before_build_command.clone())
    }

    #[allow(dead_code)]
    pub fn get_name(&self) -> Option<String> {
        self.product_name.clone()
    }

    #[allow(dead_code)]
    pub fn get_frontend_dist(&self) -> Option<String> {
        self.build.as_ref().and_then(|b| b.frontend_dist.clone())
    }
}

/// Check if a directory is a Tauri project
pub fn is_tauri_project(path: &Path) -> bool {
    path.join("src-tauri").exists()
        || path.join("tauri.conf.json").exists()
        || path.join("src-tauri/tauri.conf.json").exists()
}

#[allow(dead_code)]
pub fn get_tauri_src_dir(path: &Path) -> Option<std::path::PathBuf> {
    let src_tauri = path.join("src-tauri");
    if src_tauri.exists() {
        Some(src_tauri)
    } else if path.file_name().map(|n| n == "src-tauri").unwrap_or(false) {
        Some(path.to_path_buf())
    } else {
        None
    }
}
