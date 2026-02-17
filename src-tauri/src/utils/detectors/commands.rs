use crate::models::detected_service::{Framework, PackageManager};
use crate::utils::parsers::{CargoToml, PackageJson, TauriConf};
use std::path::Path;

/// Commands detected for a service
#[derive(Debug, Clone, Default)]
pub struct DetectedCommands {
    pub dev: Option<String>,
    pub build: Option<String>,
    pub start: Option<String>,
    pub install: Option<String>,
}

/// Detect development commands for a service
pub fn detect_commands(
    path: &Path,
    framework: &Framework,
    package_manager: &PackageManager,
) -> DetectedCommands {
    let mut commands = DetectedCommands::default();

    // Set install command from package manager
    commands.install = Some(package_manager.install_command().to_string());

    // Try framework-specific detection first
    match framework {
        Framework::Tauri => {
            if let Some(conf) = TauriConf::parse(path) {
                // Frontend dev command from tauri.conf.json
                if conf.get_frontend_dev_command().is_some() {
                    // The full Tauri dev command
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
            if let Some(cargo) = CargoToml::parse(path) {
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

    // Try to get commands from package.json (Node.js ecosystem)
    if let Some(pkg) = PackageJson::parse(path) {
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

        // If no dev command but start exists, use start for dev
        if commands.dev.is_none() && commands.start.is_some() {
            commands.dev = commands.start.clone();
        }

        return commands;
    }

    // Python frameworks
    match framework {
        Framework::Django => {
            commands.dev = Some("python manage.py runserver".to_string());
            commands.build = None; // Django doesn't have a build step
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

    // PHP frameworks
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

    // Ruby frameworks
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

    // Go frameworks
    match framework {
        Framework::Gin
        | Framework::Echo
        | Framework::Fiber
        | Framework::Chi
        | Framework::Beego
        | Framework::Go => {
            commands.dev = Some("go run .".to_string());
            commands.build = Some("go build -o app .".to_string());
            commands.start = Some("./app".to_string());
        }
        _ => {}
    }

    // Java/Kotlin frameworks
    match framework {
        Framework::Spring => {
            if path.join("mvnw").exists() {
                commands.dev = Some("./mvnw spring-boot:run".to_string());
                commands.build = Some("./mvnw package".to_string());
            } else if path.join("gradlew").exists() {
                commands.dev = Some("./gradlew bootRun".to_string());
                commands.build = Some("./gradlew build".to_string());
            }
        }
        Framework::Quarkus => {
            commands.dev = Some("./mvnw quarkus:dev".to_string());
            commands.build = Some("./mvnw package".to_string());
        }
        Framework::Ktor => {
            commands.dev = Some("./gradlew run".to_string());
            commands.build = Some("./gradlew build".to_string());
        }
        _ => {}
    }

    // .NET frameworks
    match framework {
        Framework::AspNetCore | Framework::Blazor | Framework::CSharp => {
            commands.dev = Some("dotnet watch run".to_string());
            commands.build = Some("dotnet build".to_string());
            commands.start = Some("dotnet run".to_string());
        }
        _ => {}
    }

    // Elixir
    if *framework == Framework::Elixir {
        commands.dev = Some("mix phx.server".to_string());
        commands.start = Some("mix phx.server".to_string());
    }

    commands
}

/// Format npm/yarn/pnpm command properly
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

/// Get the Tauri-specific commands for frontend service
pub fn get_tauri_frontend_commands(
    path: &Path,
    package_manager: &PackageManager,
) -> DetectedCommands {
    let mut commands = DetectedCommands::default();

    commands.install = Some(package_manager.install_command().to_string());

    // Check tauri.conf.json for frontend commands
    if let Some(conf) = TauriConf::parse(path) {
        commands.dev = conf.get_frontend_dev_command();
        commands.build = conf.get_frontend_build_command();
    } else {
        // Fallback to common scripts
        commands.dev = Some(format!("{} dev", package_manager.run_prefix()));
        commands.build = Some(format!("{} build", package_manager.run_prefix()));
    }

    commands
}

/// Get the Tauri backend (Rust) commands
pub fn get_tauri_backend_commands() -> DetectedCommands {
    DetectedCommands {
        dev: Some("cargo tauri dev".to_string()),
        build: Some("cargo tauri build".to_string()),
        start: None,
        install: Some("cargo build".to_string()),
    }
}
