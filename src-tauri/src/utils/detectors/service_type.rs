use crate::models::detected_service::{Framework, ServiceCategory};
use crate::utils::parsers::PackageJson;
use std::path::Path;

pub fn detect_service_category(
    path: &Path,
    framework: &Framework,
    package_json: Option<&PackageJson>,
) -> ServiceCategory {
    match framework {
        Framework::Tauri | Framework::Electron | Framework::Neutralino => ServiceCategory::Desktop,

        Framework::ReactNative
        | Framework::Flutter
        | Framework::Expo
        | Framework::Ionic
        | Framework::Capacitor => ServiceCategory::Mobile,

        Framework::Express
        | Framework::Fastify
        | Framework::Koa
        | Framework::Hapi
        | Framework::NestJs
        | Framework::AdonisJs
        | Framework::Strapi
        | Framework::Django
        | Framework::Flask
        | Framework::FastApi
        | Framework::Pyramid
        | Framework::Tornado
        | Framework::Laravel
        | Framework::Symfony
        | Framework::CodeIgniter
        | Framework::Yii
        | Framework::CakePHP
        | Framework::Rails
        | Framework::Sinatra
        | Framework::Hanami
        | Framework::Gin
        | Framework::Echo
        | Framework::Fiber
        | Framework::Chi
        | Framework::Beego
        | Framework::ActixWeb
        | Framework::Axum
        | Framework::Rocket
        | Framework::Warp
        | Framework::Tide
        | Framework::Spring
        | Framework::Quarkus
        | Framework::Micronaut
        | Framework::Ktor
        | Framework::AspNetCore => ServiceCategory::Backend,

        Framework::NextJs | Framework::NuxtJs | Framework::Remix | Framework::SvelteKit => {
            if has_api_routes(path) {
                ServiceCategory::Fullstack
            } else {
                ServiceCategory::Frontend
            }
        }

        Framework::React
        | Framework::Vue
        | Framework::Angular
        | Framework::Svelte
        | Framework::Solid
        | Framework::Preact
        | Framework::Qwik
        | Framework::Astro
        | Framework::Gatsby => ServiceCategory::Frontend,

        Framework::Vite
        | Framework::Webpack
        | Framework::Parcel
        | Framework::Esbuild
        | Framework::Turbopack => detect_from_project_structure(path, package_json),

        Framework::WordPress | Framework::Drupal | Framework::Ghost => ServiceCategory::Backend,

        Framework::Blazor => {
            if has_api_controllers(path) {
                ServiceCategory::Fullstack
            } else {
                ServiceCategory::Frontend
            }
        }

        Framework::Node
        | Framework::Bun
        | Framework::Deno
        | Framework::Rust
        | Framework::Python
        | Framework::Php
        | Framework::Go
        | Framework::Ruby
        | Framework::Java
        | Framework::Kotlin
        | Framework::CSharp
        | Framework::Elixir => detect_from_project_structure(path, package_json),

        Framework::Unknown => ServiceCategory::Unknown,
    }
}

fn detect_from_project_structure(
    path: &Path,
    package_json: Option<&PackageJson>,
) -> ServiceCategory {
    if let Some(pkg) = package_json {
        if pkg.is_frontend() && pkg.is_backend() {
            return ServiceCategory::Fullstack;
        }
        if pkg.is_frontend() {
            return ServiceCategory::Frontend;
        }
        if pkg.is_backend() {
            return ServiceCategory::Backend;
        }
        if pkg.is_desktop() {
            return ServiceCategory::Desktop;
        }
        if pkg.is_mobile() {
            return ServiceCategory::Mobile;
        }
    }

    let frontend_indicators = [
        "src/components",
        "src/pages",
        "src/views",
        "src/App.tsx",
        "src/App.vue",
        "src/App.jsx",
        "src/main.tsx",
        "src/main.ts",
        "public/index.html",
        "index.html",
    ];

    let backend_indicators = [
        "src/controllers",
        "src/routes",
        "src/api",
        "src/services",
        "src/repositories",
        "src/models",
        "src/handlers",
        "src/middleware",
        "app/controllers",
        "app/models",
        "config/routes.rb",
    ];

    let has_frontend = frontend_indicators
        .iter()
        .any(|indicator| path.join(indicator).exists());

    let has_backend = backend_indicators
        .iter()
        .any(|indicator| path.join(indicator).exists());

    match (has_frontend, has_backend) {
        (true, true) => ServiceCategory::Fullstack,
        (true, false) => ServiceCategory::Frontend,
        (false, true) => ServiceCategory::Backend,
        (false, false) => {
            if is_server_language(path) {
                ServiceCategory::Backend
            } else {
                ServiceCategory::Unknown
            }
        }
    }
}

fn has_api_routes(path: &Path) -> bool {
    if path.join("pages/api").exists() || path.join("app/api").exists() {
        return true;
    }

    if path.join("server/api").exists() || path.join("server/routes").exists() {
        return true;
    }

    if path.join("src/routes").exists() {
        let has_server_files = walkdir::WalkDir::new(path.join("src/routes"))
            .max_depth(5)
            .into_iter()
            .filter_map(|e| e.ok())
            .any(|e| e.file_name().to_string_lossy().contains("+server"));

        if has_server_files {
            return true;
        }
    }

    false
}

fn has_api_controllers(path: &Path) -> bool {
    path.join("Controllers").exists() || path.join("controllers").exists()
}

fn is_server_language(path: &Path) -> bool {
    let server_indicators = [
        "go.mod",
        "Cargo.toml",
        "requirements.txt",
        "composer.json",
        "Gemfile",
        "pom.xml",
        "build.gradle",
        "mix.exs",
    ];

    server_indicators
        .iter()
        .any(|indicator| path.join(indicator).exists())
}
