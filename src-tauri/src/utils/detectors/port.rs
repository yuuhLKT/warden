use crate::models::detected_service::Framework;
use crate::utils::parsers::{PackageJson, TauriConf};
use regex::Regex;
use std::fs;
use std::path::Path;

/// Detect the development port for a service
pub fn detect_port(path: &Path, framework: &Framework) -> Option<u16> {
    // 1. Try to get port from framework-specific config files
    if let Some(port) = detect_port_from_config(path, framework) {
        return Some(port);
    }

    // 2. Try to get port from package.json scripts
    if let Some(pkg) = PackageJson::parse(path) {
        if let Some(port) = pkg.extract_port_from_scripts() {
            return Some(port);
        }
    }

    // 3. Try to get port from environment files
    if let Some(port) = detect_port_from_env(path) {
        return Some(port);
    }

    // 4. Use framework default port
    framework.default_port()
}

/// Detect port from framework-specific configuration files
fn detect_port_from_config(path: &Path, framework: &Framework) -> Option<u16> {
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
            // Check vite.config.ts/js
            if let Some(port) = parse_vite_config_port(path) {
                return Some(port);
            }
        }

        Framework::NextJs => {
            // Next.js typically uses package.json scripts or next.config.js
            if let Some(port) = parse_nextjs_port(path) {
                return Some(port);
            }
        }

        Framework::Angular => {
            // Check angular.json
            if let Some(port) = parse_angular_port(path) {
                return Some(port);
            }
        }

        Framework::NuxtJs => {
            // Check nuxt.config.ts
            if let Some(port) = parse_nuxt_port(path) {
                return Some(port);
            }
        }

        Framework::Django => {
            // Django typically uses default 8000 or settings
            return Some(8000);
        }

        Framework::Flask => {
            // Check for port in app.py or config
            if let Some(port) = parse_flask_port(path) {
                return Some(port);
            }
        }

        Framework::Laravel => {
            // Laravel Sail or artisan serve
            return Some(8000);
        }

        Framework::Rails => {
            // Rails typically uses 3000
            return Some(3000);
        }

        _ => {}
    }

    None
}

/// Parse port from vite.config.ts/js
fn parse_vite_config_port(path: &Path) -> Option<u16> {
    let config_files = ["vite.config.ts", "vite.config.js", "vite.config.mjs"];

    for file in config_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            // Look for port: 1234 or port: "1234"
            let port_regex = Regex::new(r#"port\s*:\s*['"]?(\d+)['"]?"#).ok()?;
            if let Some(captures) = port_regex.captures(&content) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

/// Parse port from next.config.js
fn parse_nextjs_port(path: &Path) -> Option<u16> {
    // Next.js usually doesn't configure port in config, but in scripts
    // Check package.json dev script
    if let Some(pkg) = PackageJson::parse(path) {
        if let Some(dev) = pkg.scripts.get("dev") {
            // Look for -p 3001 or --port 3001
            let port_regex = Regex::new(r"(?:-p|--port)\s+(\d+)").ok()?;
            if let Some(captures) = port_regex.captures(dev) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

/// Parse port from angular.json
fn parse_angular_port(path: &Path) -> Option<u16> {
    if let Ok(content) = fs::read_to_string(path.join("angular.json")) {
        // Look for "port": 4200
        let port_regex = Regex::new(r#""port"\s*:\s*(\d+)"#).ok()?;
        if let Some(captures) = port_regex.captures(&content) {
            if let Some(port_str) = captures.get(1) {
                return port_str.as_str().parse().ok();
            }
        }
    }

    None
}

/// Parse port from nuxt.config.ts
fn parse_nuxt_port(path: &Path) -> Option<u16> {
    let config_files = ["nuxt.config.ts", "nuxt.config.js"];

    for file in config_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            // Look for port: 3000 in devServer or server config
            let port_regex = Regex::new(r"port\s*:\s*(\d+)").ok()?;
            if let Some(captures) = port_regex.captures(&content) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

/// Parse port from Flask app
fn parse_flask_port(path: &Path) -> Option<u16> {
    let app_files = ["app.py", "main.py", "run.py"];

    for file in app_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            // Look for port=5000 in app.run()
            let port_regex = Regex::new(r"port\s*=\s*(\d+)").ok()?;
            if let Some(captures) = port_regex.captures(&content) {
                if let Some(port_str) = captures.get(1) {
                    return port_str.as_str().parse().ok();
                }
            }
        }
    }

    None
}

/// Detect port from environment files
fn detect_port_from_env(path: &Path) -> Option<u16> {
    let env_files = [
        ".env",
        ".env.local",
        ".env.development",
        ".env.development.local",
    ];

    for file in env_files {
        if let Ok(content) = fs::read_to_string(path.join(file)) {
            // Look for PORT=3000, VITE_PORT=5173, etc.
            let port_patterns = [
                Regex::new(r"^PORT\s*=\s*(\d+)").ok()?,
                Regex::new(r"^VITE_PORT\s*=\s*(\d+)").ok()?,
                Regex::new(r"^DEV_PORT\s*=\s*(\d+)").ok()?,
                Regex::new(r"^SERVER_PORT\s*=\s*(\d+)").ok()?,
                Regex::new(r"^APP_PORT\s*=\s*(\d+)").ok()?,
            ];

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
