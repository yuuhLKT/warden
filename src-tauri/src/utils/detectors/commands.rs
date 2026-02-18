use crate::models::detected_service::{Framework, PackageManager};
use crate::utils::parsers::{CargoToml, PackageJson, TauriConf};
use std::env::consts::OS;
use std::path::Path;

// ---------------------------------------------------------------------------
// OS helpers
// ---------------------------------------------------------------------------

/// Returns `"mvnw.cmd"` on Windows, `"./mvnw"` on Unix.
fn mvnw() -> &'static str {
    if OS == "windows" {
        "mvnw.cmd"
    } else {
        "./mvnw"
    }
}

/// Returns `"gradlew.bat"` on Windows, `"./gradlew"` on Unix.
fn gradlew() -> &'static str {
    if OS == "windows" {
        "gradlew.bat"
    } else {
        "./gradlew"
    }
}

/// Returns `"app.exe"` on Windows, `"./app"` on Unix.
fn go_binary() -> &'static str {
    if OS == "windows" {
        "app.exe"
    } else {
        "./app"
    }
}

#[derive(Debug, Clone, Default)]
pub struct DetectedCommands {
    pub dev: Option<String>,
    pub build: Option<String>,
    pub start: Option<String>,
    pub install: Option<String>,
}

pub fn detect_commands(
    path: &Path,
    framework: &Framework,
    package_manager: &PackageManager,
    package_json: Option<&PackageJson>,
    cargo_toml: Option<&CargoToml>,
) -> DetectedCommands {
    let mut commands = DetectedCommands {
        install: Some(package_manager.install_command().to_string()),
        ..Default::default()
    };

    match framework {
        Framework::Tauri => {
            if let Some(conf) = TauriConf::parse(path) {
                if conf.get_frontend_dev_command().is_some() {
                    commands.dev = Some("cargo tauri dev".to_string());
                }
                if conf.get_frontend_build_command().is_some() {
                    commands.build = Some("cargo tauri build".to_string());
                }
            } else {
                commands.dev = Some("cargo tauri dev".to_string());
                commands.build = Some("cargo tauri build".to_string());
            }
            return commands;
        }

        Framework::ActixWeb
        | Framework::Axum
        | Framework::Rocket
        | Framework::Warp
        | Framework::Tide
        | Framework::Rust => {
            if let Some(cargo) = cargo_toml {
                commands.dev = Some(cargo.get_dev_command());
                commands.build = Some(cargo.get_build_command());
            } else {
                commands.dev = Some("cargo run".to_string());
                commands.build = Some("cargo build --release".to_string());
            }
            return commands;
        }

        _ => {}
    }

    if let Some(pkg) = package_json {
        let run_prefix = package_manager.run_prefix();

        if let Some(dev) = pkg.get_dev_command() {
            commands.dev = Some(format_npm_command(run_prefix, "dev", &dev, package_manager));
        }

        if let Some(build) = pkg.get_build_command() {
            commands.build = Some(format_npm_command(
                run_prefix,
                "build",
                &build,
                package_manager,
            ));
        }

        if let Some(start) = pkg.get_start_command() {
            commands.start = Some(format_npm_command(
                run_prefix,
                "start",
                &start,
                package_manager,
            ));
        }

        if commands.dev.is_none() && commands.start.is_some() {
            commands.dev = commands.start.clone();
        }

        return commands;
    }

    match framework {
        Framework::Django => {
            commands.dev = Some("python manage.py runserver".to_string());
            commands.build = None;
            commands.start = Some("python manage.py runserver".to_string());
        }
        Framework::Flask => {
            commands.dev = Some("flask run".to_string());
            commands.start = Some("flask run".to_string());
        }
        Framework::FastApi => {
            commands.dev = Some("uvicorn main:app --reload".to_string());
            commands.start = Some("uvicorn main:app".to_string());
        }
        Framework::Python => {
            commands.dev = Some("python main.py".to_string());
            commands.start = Some("python main.py".to_string());
        }
        _ => {}
    }

    match framework {
        Framework::Laravel => {
            commands.dev = Some("php artisan serve".to_string());
            commands.start = Some("php artisan serve".to_string());
        }
        Framework::Symfony => {
            commands.dev = Some("symfony serve".to_string());
            commands.start = Some("symfony serve".to_string());
        }
        Framework::Php => {
            commands.dev = Some("php -S localhost:8000".to_string());
        }
        _ => {}
    }

    match framework {
        Framework::Rails => {
            commands.dev = Some("rails server".to_string());
            commands.start = Some("rails server".to_string());
        }
        Framework::Sinatra => {
            commands.dev = Some("ruby app.rb".to_string());
            commands.start = Some("ruby app.rb".to_string());
        }
        Framework::Ruby => {
            commands.dev = Some("ruby main.rb".to_string());
        }
        _ => {}
    }

    match framework {
        Framework::Gin
        | Framework::Echo
        | Framework::Fiber
        | Framework::Chi
        | Framework::Beego
        | Framework::Go => {
            commands.dev = Some("go run .".to_string());
            commands.build = Some(format!(
                "go build -o {} .",
                go_binary().trim_start_matches("./")
            ));
            commands.start = Some(go_binary().to_string());
        }
        _ => {}
    }

    match framework {
        Framework::Spring => {
            if path.join("mvnw").exists() || path.join("mvnw.cmd").exists() {
                commands.dev = Some(format!("{} spring-boot:run", mvnw()));
                commands.build = Some(format!("{} package", mvnw()));
            } else if path.join("gradlew").exists() || path.join("gradlew.bat").exists() {
                commands.dev = Some(format!("{} bootRun", gradlew()));
                commands.build = Some(format!("{} build", gradlew()));
            }
        }
        Framework::Quarkus => {
            commands.dev = Some(format!("{} quarkus:dev", mvnw()));
            commands.build = Some(format!("{} package", mvnw()));
        }
        Framework::Ktor => {
            commands.dev = Some(format!("{} run", gradlew()));
            commands.build = Some(format!("{} build", gradlew()));
        }
        _ => {}
    }

    match framework {
        Framework::AspNetCore | Framework::Blazor | Framework::CSharp => {
            commands.dev = Some("dotnet watch run".to_string());
            commands.build = Some("dotnet build".to_string());
            commands.start = Some("dotnet run".to_string());
        }
        _ => {}
    }

    if *framework == Framework::Elixir {
        commands.dev = Some("mix phx.server".to_string());
        commands.start = Some("mix phx.server".to_string());
    }

    commands
}

fn format_npm_command(
    run_prefix: &str,
    script_name: &str,
    _script_content: &str,
    package_manager: &PackageManager,
) -> String {
    match package_manager {
        PackageManager::Npm => format!("npm run {}", script_name),
        PackageManager::Yarn | PackageManager::YarnBerry => format!("yarn {}", script_name),
        PackageManager::Pnpm => format!("pnpm {}", script_name),
        PackageManager::Bun => format!("bun run {}", script_name),
        PackageManager::Deno => format!("deno task {}", script_name),
        _ => format!("{} {}", run_prefix, script_name),
    }
}

pub fn get_tauri_frontend_commands(
    path: &Path,
    package_manager: &PackageManager,
) -> DetectedCommands {
    let mut commands = DetectedCommands {
        install: Some(package_manager.install_command().to_string()),
        ..Default::default()
    };

    if let Some(conf) = TauriConf::parse(path) {
        commands.dev = conf.get_frontend_dev_command();
        commands.build = conf.get_frontend_build_command();
    } else {
        commands.dev = Some(format!("{} dev", package_manager.run_prefix()));
        commands.build = Some(format!("{} build", package_manager.run_prefix()));
    }

    commands
}

pub fn get_tauri_backend_commands() -> DetectedCommands {
    DetectedCommands {
        dev: Some("cargo tauri dev".to_string()),
        build: Some("cargo tauri build".to_string()),
        start: None,
        install: Some("cargo build".to_string()),
    }
}
