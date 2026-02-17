use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Parsed Cargo.toml structure
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct CargoToml {
    pub package: Option<CargoPackage>,
    pub dependencies: HashMap<String, toml::Value>,
    #[serde(rename = "dev-dependencies")]
    pub dev_dependencies: HashMap<String, toml::Value>,
    #[serde(rename = "build-dependencies")]
    pub build_dependencies: HashMap<String, toml::Value>,
    pub workspace: Option<CargoWorkspace>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct CargoPackage {
    pub name: Option<String>,
    pub version: Option<String>,
    pub description: Option<String>,
    pub authors: Option<Vec<String>>,
    pub edition: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct CargoWorkspace {
    pub members: Vec<String>,
    pub exclude: Vec<String>,
    #[serde(rename = "default-members")]
    pub default_members: Vec<String>,
}

impl CargoToml {
    /// Parse Cargo.toml from a path
    pub fn parse(path: &Path) -> Option<Self> {
        let cargo_path = if path.is_file() {
            path.to_path_buf()
        } else {
            path.join("Cargo.toml")
        };

        let content = fs::read_to_string(&cargo_path).ok()?;
        toml::from_str(&content).ok()
    }

    /// Check if a dependency exists
    pub fn has_dependency(&self, name: &str) -> bool {
        self.dependencies.contains_key(name)
            || self.dev_dependencies.contains_key(name)
            || self.build_dependencies.contains_key(name)
    }

    #[allow(dead_code)]
    pub fn get_name(&self) -> Option<String> {
        self.package.as_ref().and_then(|p| p.name.clone())
    }

    #[allow(dead_code)]
    pub fn is_workspace(&self) -> bool {
        self.workspace.is_some()
    }

    #[allow(dead_code)]
    pub fn get_workspace_members(&self) -> Vec<String> {
        self.workspace
            .as_ref()
            .map(|w| w.members.clone())
            .unwrap_or_default()
    }

    /// Check if this is a Tauri project
    pub fn is_tauri(&self) -> bool {
        self.has_dependency("tauri") || self.build_dependencies.contains_key("tauri-build")
    }

    /// Check if this is a web server project
    pub fn is_web_server(&self) -> bool {
        let web_deps = [
            "actix-web",
            "actix-rt",
            "axum",
            "rocket",
            "warp",
            "tide",
            "hyper",
            "tower",
            "tonic", // gRPC
        ];

        web_deps.iter().any(|dep| self.has_dependency(dep))
    }

    #[allow(dead_code)]
    pub fn detect_web_framework(&self) -> Option<&'static str> {
        if self.has_dependency("actix-web") {
            Some("actix-web")
        } else if self.has_dependency("axum") {
            Some("axum")
        } else if self.has_dependency("rocket") {
            Some("rocket")
        } else if self.has_dependency("warp") {
            Some("warp")
        } else if self.has_dependency("tide") {
            Some("tide")
        } else {
            None
        }
    }

    #[allow(dead_code)]
    pub fn is_cli(&self) -> bool {
        let cli_deps = ["clap", "structopt", "argh", "pico-args"];

        cli_deps.iter().any(|dep| self.has_dependency(dep))
    }

    /// Get default dev command for Rust projects
    pub fn get_dev_command(&self) -> String {
        if self.is_tauri() {
            "cargo tauri dev".to_string()
        } else if self.is_web_server() {
            "cargo watch -x run".to_string()
        } else {
            "cargo run".to_string()
        }
    }

    /// Get default build command
    pub fn get_build_command(&self) -> String {
        if self.is_tauri() {
            "cargo tauri build".to_string()
        } else {
            "cargo build --release".to_string()
        }
    }
}
