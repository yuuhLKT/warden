use regex::Regex;
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::LazyLock;

static SCRIPT_PORT_FLAG_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"-p\s+(\d+)").unwrap());

static SCRIPT_PORT_EQUALS_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"--port[=\s]+(\d+)").unwrap());

static SCRIPT_PORT_ENV_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"PORT=(\d+)").unwrap());

static SCRIPT_PORT_COLON_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r":(\d{4,5})").unwrap());

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct PackageJson {
    pub name: Option<String>,
    pub version: Option<String>,
    pub private: Option<bool>,
    pub scripts: HashMap<String, String>,
    pub dependencies: HashMap<String, String>,
    #[serde(rename = "devDependencies")]
    pub dev_dependencies: HashMap<String, String>,
    #[serde(rename = "peerDependencies")]
    pub peer_dependencies: HashMap<String, String>,
    pub workspaces: Option<WorkspacesConfig>,
    #[serde(rename = "packageManager")]
    pub package_manager: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum WorkspacesConfig {
    Array(Vec<String>),
    Object { packages: Vec<String> },
}

impl WorkspacesConfig {
    pub fn get_patterns(&self) -> Vec<String> {
        match self {
            WorkspacesConfig::Array(patterns) => patterns.clone(),
            WorkspacesConfig::Object { packages } => packages.clone(),
        }
    }
}

impl PackageJson {
    pub fn parse(path: &Path) -> Option<Self> {
        let package_json_path = if path.is_file() {
            path.to_path_buf()
        } else {
            path.join("package.json")
        };

        let content = fs::read_to_string(&package_json_path).ok()?;
        serde_json::from_str(&content).ok()
    }

    pub fn has_dependency(&self, name: &str) -> bool {
        self.dependencies.contains_key(name)
            || self.dev_dependencies.contains_key(name)
            || self.peer_dependencies.contains_key(name)
    }

    #[allow(dead_code)]
    pub fn has_dependency_matching(&self, pattern: &str) -> bool {
        let all_deps: Vec<&String> = self
            .dependencies
            .keys()
            .chain(self.dev_dependencies.keys())
            .chain(self.peer_dependencies.keys())
            .collect();

        all_deps.iter().any(|dep| dep.contains(pattern))
    }

    pub fn get_dev_command(&self) -> Option<String> {
        self.scripts
            .get("dev")
            .or_else(|| self.scripts.get("start:dev"))
            .or_else(|| self.scripts.get("serve"))
            .cloned()
    }

    pub fn get_build_command(&self) -> Option<String> {
        self.scripts.get("build").cloned()
    }

    pub fn get_start_command(&self) -> Option<String> {
        self.scripts
            .get("start")
            .or_else(|| self.scripts.get("serve"))
            .cloned()
    }

    pub fn extract_port_from_scripts(&self) -> Option<u16> {
        let port_patterns = [
            &*SCRIPT_PORT_FLAG_REGEX,
            &*SCRIPT_PORT_EQUALS_REGEX,
            &*SCRIPT_PORT_ENV_REGEX,
            &*SCRIPT_PORT_COLON_REGEX,
        ];

        let scripts_to_check = ["dev", "start:dev", "start", "serve"];

        for script_name in scripts_to_check {
            if let Some(script) = self.scripts.get(script_name) {
                for pattern in &port_patterns {
                    if let Some(captures) = pattern.captures(script) {
                        if let Some(port_str) = captures.get(1) {
                            if let Ok(port) = port_str.as_str().parse::<u16>() {
                                if port >= 1024 {
                                    return Some(port);
                                }
                            }
                        }
                    }
                }
            }
        }

        None
    }

    pub fn is_monorepo(&self) -> bool {
        self.workspaces.is_some()
    }

    pub fn get_workspace_patterns(&self) -> Vec<String> {
        self.workspaces
            .as_ref()
            .map(|w| w.get_patterns())
            .unwrap_or_default()
    }

    #[allow(dead_code)]
    pub fn get_declared_package_manager(&self) -> Option<String> {
        self.package_manager
            .as_ref()
            .map(|pm| pm.split('@').next().unwrap_or(pm).to_string())
    }

    pub fn is_frontend(&self) -> bool {
        let frontend_deps = [
            "react",
            "react-dom",
            "vue",
            "@vue/core",
            "@angular/core",
            "svelte",
            "@sveltejs/kit",
            "solid-js",
            "preact",
            "qwik",
            "next",
            "nuxt",
            "@remix-run/react",
            "astro",
            "gatsby",
        ];

        frontend_deps.iter().any(|dep| self.has_dependency(dep))
    }

    pub fn is_backend(&self) -> bool {
        let backend_deps = [
            "express",
            "fastify",
            "koa",
            "hapi",
            "@hapi/hapi",
            "@nestjs/core",
            "@adonisjs/core",
            "strapi",
            "keystone",
            "prisma",
            "@prisma/client",
            "typeorm",
            "sequelize",
            "mongoose",
            "pg",
            "mysql2",
            "redis",
            "ioredis",
        ];

        backend_deps.iter().any(|dep| self.has_dependency(dep))
    }

    pub fn is_desktop(&self) -> bool {
        let desktop_deps = [
            "@tauri-apps/api",
            "@tauri-apps/cli",
            "electron",
            "@electron/remote",
            "electron-builder",
            "@aspect/neutralino",
        ];

        desktop_deps.iter().any(|dep| self.has_dependency(dep))
    }

    pub fn is_mobile(&self) -> bool {
        let mobile_deps = [
            "react-native",
            "expo",
            "@ionic/core",
            "@ionic/react",
            "@ionic/vue",
            "@ionic/angular",
            "@capacitor/core",
            "nativescript",
        ];

        mobile_deps.iter().any(|dep| self.has_dependency(dep))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_port_from_scripts() {
        let mut pkg = PackageJson::default();
        pkg.scripts
            .insert("dev".to_string(), "vite --port 3001".to_string());
        assert_eq!(pkg.extract_port_from_scripts(), Some(3001));

        let mut pkg2 = PackageJson::default();
        pkg2.scripts
            .insert("dev".to_string(), "next dev -p 3002".to_string());
        assert_eq!(pkg2.extract_port_from_scripts(), Some(3002));
    }
}
