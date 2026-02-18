use crate::models::detected_service::Framework;
use crate::utils::parsers::{PackageJson, TauriConf};
use regex::Regex;
use std::fs;
use std::path::Path;
use std::sync::LazyLock;

static VITE_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"port\s*:\s*['"]?(\d+)['"]?"#).unwrap());

static NEXTJS_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?:-p|--port)\s+(\d+)").unwrap());

static ANGULAR_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#""port"\s*:\s*(\d+)"#).unwrap());

static NUXT_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"port\s*:\s*(\d+)").unwrap());

static FLASK_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"port\s*=\s*(\d+)").unwrap());

static ENV_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^PORT\s*=\s*(\d+)").unwrap());

static ENV_VITE_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^VITE_PORT\s*=\s*(\d+)").unwrap());

static ENV_DEV_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^DEV_PORT\s*=\s*(\d+)").unwrap());

static ENV_SERVER_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^SERVER_PORT\s*=\s*(\d+)").unwrap());

static ENV_APP_PORT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^APP_PORT\s*=\s*(\d+)").unwrap());

pub fn detect_port(
    path: &Path,
    framework: &Framework,
    package_json: Option<&PackageJson>,
) -> Option<u16> {
    if let Some(port) = detect_port_from_config(path, framework, package_json) {
        return Some(port);
    }

    if let Some(pkg) = package_json {
        if let Some(port) = pkg.extract_port_from_scripts() {
            return Some(port);
        }
    }

    if let Some(port) = detect_port_from_env(path) {
        return Some(port);
    }

    framework.default_port()
}

fn detect_port_from_config(
    path: &Path,
    framework: &Framework,
    package_json: Option<&PackageJson>,
) -> Option<u16> {
    match framework {
        Framework::Tauri => {
            if let Some(conf) = TauriConf::parse(path) {
                return conf.get_dev_port();
            }
        }

        Framework::Vite
        | Framework::React
        | Framework::Vue
        | Framework::Svelte
        | Framework::Solid => {
            if let Some(port) = parse_vite_config_port(path) {
                return Some(port);
            }
        }

        Framework::NextJs => {
            if let Some(port) = parse_nextjs_port(package_json) {
                return Some(port);
            }
        }

        Framework::Angular => {
            if let Some(port) = parse_angular_port(path) {
                return Some(port);
            }
        }

        Framework::NuxtJs => {
            if let Some(port) = parse_nuxt_port(path) {
                return Some(port);
            }
        }

        Framework::Django => {
            return Some(8000);
        }

        Framework::Flask => {
            if let Some(port) = parse_flask_port(path) {
                return Some(port);
            }
        }

        Framework::Laravel => {
            return Some(8000);
        }

        Framework::Rails => {
            return Some(3000);
        }

        _ => {}
    }

    None
}

fn parse_vite_config_port(path: &Path) -> Option<u16> {
    let config_files = ["vite.config.ts", "vite.config.js", "vite.config.mjs"];

    for file in config_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            if let Some(captures) = VITE_PORT_REGEX.captures(&content) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

fn parse_nextjs_port(package_json: Option<&PackageJson>) -> Option<u16> {
    if let Some(pkg) = package_json {
        if let Some(dev) = pkg.scripts.get("dev") {
            if let Some(captures) = NEXTJS_PORT_REGEX.captures(dev) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

fn parse_angular_port(path: &Path) -> Option<u16> {
    if let Ok(content) = fs::read_to_string(path.join("angular.json")) {
        if let Some(captures) = ANGULAR_PORT_REGEX.captures(&content) {
            if let Some(port_str) = captures.get(1) {
                return port_str.as_str().parse().ok();
            }
        }
    }

    None
}

fn parse_nuxt_port(path: &Path) -> Option<u16> {
    let config_files = ["nuxt.config.ts", "nuxt.config.js"];

    for file in config_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            if let Some(captures) = NUXT_PORT_REGEX.captures(&content) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

fn parse_flask_port(path: &Path) -> Option<u16> {
    let app_files = ["app.py", "main.py", "run.py"];

    for file in app_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            if let Some(captures) = FLASK_PORT_REGEX.captures(&content) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

fn detect_port_from_env(path: &Path) -> Option<u16> {
    let env_files = [
        ".env",
        ".env.local",
        ".env.development",
        ".env.development.local",
    ];

    let port_patterns = [
        &*ENV_PORT_REGEX,
        &*ENV_VITE_PORT_REGEX,
        &*ENV_DEV_PORT_REGEX,
        &*ENV_SERVER_PORT_REGEX,
        &*ENV_APP_PORT_REGEX,
    ];

    for file in env_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            for line in content.lines() {
                for pattern in &port_patterns {
                    if let Some(captures) = pattern.captures(line) {
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
    }

    None
}
