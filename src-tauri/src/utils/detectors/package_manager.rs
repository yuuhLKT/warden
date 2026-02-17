use crate::models::detected_service::PackageManager;
use std::path::Path;

/// Detect the package manager used in a project
pub fn detect_package_manager(path: &Path) -> PackageManager {
    // JavaScript/TypeScript (priority order - most specific first)
    if path.join("bun.lock").exists() || path.join("bun.lockb").exists() {
        return PackageManager::Bun;
    }

    if path.join("pnpm-lock.yaml").exists() {
        return PackageManager::Pnpm;
    }

    if path.join("yarn.lock").exists() {
        // Check for Yarn Berry (v2+)
        if path.join(".yarnrc.yml").exists() || path.join(".yarnrc.yaml").exists() {
            return PackageManager::YarnBerry;
        }
        return PackageManager::Yarn;
    }

    if path.join("package-lock.json").exists() {
        return PackageManager::Npm;
    }

    // Deno
    if path.join("deno.json").exists() || path.join("deno.jsonc").exists() {
        return PackageManager::Deno;
    }

    // Rust
    if path.join("Cargo.lock").exists() || path.join("Cargo.toml").exists() {
        return PackageManager::Cargo;
    }

    // Python
    if path.join("uv.lock").exists() {
        return PackageManager::Uv;
    }

    if path.join("poetry.lock").exists() || path.join("pyproject.toml").exists() {
        // Check if it's actually poetry
        if let Ok(content) = std::fs::read_to_string(path.join("pyproject.toml")) {
            if content.contains("[tool.poetry]") {
                return PackageManager::Poetry;
            }
        }
    }

    if path.join("Pipfile.lock").exists() || path.join("Pipfile").exists() {
        return PackageManager::Pipenv;
    }

    if path.join("conda.yaml").exists() || path.join("environment.yml").exists() {
        return PackageManager::Conda;
    }

    if path.join("requirements.txt").exists() {
        return PackageManager::Pip;
    }

    // PHP
    if path.join("composer.lock").exists() || path.join("composer.json").exists() {
        return PackageManager::Composer;
    }

    // Ruby
    if path.join("Gemfile.lock").exists() || path.join("Gemfile").exists() {
        return PackageManager::Bundler;
    }

    // Go
    if path.join("go.sum").exists() || path.join("go.mod").exists() {
        return PackageManager::GoMod;
    }

    // Java/Kotlin
    if path.join("pom.xml").exists() {
        return PackageManager::Maven;
    }

    if path.join("build.gradle").exists()
        || path.join("build.gradle.kts").exists()
        || path.join("settings.gradle").exists()
        || path.join("settings.gradle.kts").exists()
    {
        return PackageManager::Gradle;
    }

    // .NET
    if has_csproj_or_sln(path) {
        return PackageManager::Dotnet;
    }

    // Elixir
    if path.join("mix.lock").exists() || path.join("mix.exs").exists() {
        return PackageManager::Mix;
    }

    // If we have package.json but no lockfile, default to npm
    if path.join("package.json").exists() {
        return PackageManager::Npm;
    }

    PackageManager::Unknown
}

/// Check if path has C# project files
fn has_csproj_or_sln(path: &Path) -> bool {
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let file_name = entry.file_name();
            let name = file_name.to_string_lossy();
            if name.ends_with(".csproj")
                || name.ends_with(".fsproj")
                || name.ends_with(".vbproj")
                || name.ends_with(".sln")
            {
                return true;
            }
        }
    }
    false
}

/// Get the run command for a script based on package manager
#[allow(dead_code)]
pub fn get_run_command(package_manager: &PackageManager, script: &str) -> String {
    match package_manager {
        PackageManager::Npm => format!("npm run {}", script),
        PackageManager::Yarn | PackageManager::YarnBerry => format!("yarn {}", script),
        PackageManager::Pnpm => format!("pnpm {}", script),
        PackageManager::Bun => format!("bun run {}", script),
        PackageManager::Deno => format!("deno task {}", script),
        _ => script.to_string(),
    }
}
