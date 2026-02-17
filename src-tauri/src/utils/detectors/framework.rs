use crate::models::detected_service::Framework;
use crate::utils::parsers::{CargoToml, PackageJson};
use std::fs;
use std::path::Path;

/// Detect the primary framework used in a project
pub fn detect_framework(path: &Path) -> Framework {
    // Check for Tauri first (special case - desktop app)
    if is_tauri_project(path) {
        return Framework::Tauri;
    }

    // Try to detect from package.json (Node.js ecosystem)
    if let Some(pkg) = PackageJson::parse(path) {
        if let Some(framework) = detect_node_framework(&pkg, path) {
            return framework;
        }
    }

    // Try to detect from Cargo.toml (Rust ecosystem)
    if let Some(cargo) = CargoToml::parse(path) {
        if let Some(framework) = detect_rust_framework(&cargo) {
            return framework;
        }
    }

    // Python frameworks
    if let Some(framework) = detect_python_framework(path) {
        return framework;
    }

    // PHP frameworks
    if let Some(framework) = detect_php_framework(path) {
        return framework;
    }

    // Ruby frameworks
    if let Some(framework) = detect_ruby_framework(path) {
        return framework;
    }

    // Go frameworks
    if let Some(framework) = detect_go_framework(path) {
        return framework;
    }

    // Java/Kotlin frameworks
    if let Some(framework) = detect_java_framework(path) {
        return framework;
    }

    // .NET frameworks
    if let Some(framework) = detect_dotnet_framework(path) {
        return framework;
    }

    // Generic language detection as fallback
    detect_generic_language(path)
}

/// Check if this is a Tauri project
fn is_tauri_project(path: &Path) -> bool {
    path.join("src-tauri").exists()
        || path.join("tauri.conf.json").exists()
        || path.join("src-tauri/tauri.conf.json").exists()
}

/// Detect Node.js framework from package.json
fn detect_node_framework(pkg: &PackageJson, path: &Path) -> Option<Framework> {
    // Meta Frameworks (SSR/SSG) - check first as they're more specific
    if pkg.has_dependency("next") {
        return Some(Framework::NextJs);
    }
    if pkg.has_dependency("nuxt") || pkg.has_dependency("nuxt3") {
        return Some(Framework::NuxtJs);
    }
    if pkg.has_dependency("@remix-run/react") || pkg.has_dependency("@remix-run/node") {
        return Some(Framework::Remix);
    }
    if pkg.has_dependency("astro") {
        return Some(Framework::Astro);
    }
    if pkg.has_dependency("gatsby") {
        return Some(Framework::Gatsby);
    }

    // Desktop frameworks
    if pkg.has_dependency("electron") || pkg.has_dependency("electron-builder") {
        return Some(Framework::Electron);
    }
    if pkg.has_dependency("@aspect/neutralino") || path.join("neutralino.config.json").exists() {
        return Some(Framework::Neutralino);
    }

    // Mobile frameworks
    if pkg.has_dependency("react-native") {
        return Some(Framework::ReactNative);
    }
    if pkg.has_dependency("expo") {
        return Some(Framework::Expo);
    }
    if pkg.has_dependency("@ionic/core")
        || pkg.has_dependency("@ionic/react")
        || pkg.has_dependency("@ionic/vue")
        || pkg.has_dependency("@ionic/angular")
    {
        return Some(Framework::Ionic);
    }
    if pkg.has_dependency("@capacitor/core") {
        return Some(Framework::Capacitor);
    }

    // Backend frameworks
    if pkg.has_dependency("@nestjs/core") {
        return Some(Framework::NestJs);
    }
    if pkg.has_dependency("fastify") {
        return Some(Framework::Fastify);
    }
    if pkg.has_dependency("@hapi/hapi") || pkg.has_dependency("hapi") {
        return Some(Framework::Hapi);
    }
    if pkg.has_dependency("koa") {
        return Some(Framework::Koa);
    }
    if pkg.has_dependency("express") {
        return Some(Framework::Express);
    }
    if pkg.has_dependency("@adonisjs/core") {
        return Some(Framework::AdonisJs);
    }
    if pkg.has_dependency("strapi") || pkg.has_dependency("@strapi/strapi") {
        return Some(Framework::Strapi);
    }

    // Frontend frameworks (more generic)
    if pkg.has_dependency("@sveltejs/kit") {
        return Some(Framework::SvelteKit);
    }
    if pkg.has_dependency("svelte") {
        return Some(Framework::Svelte);
    }
    if pkg.has_dependency("@angular/core") {
        return Some(Framework::Angular);
    }
    if pkg.has_dependency("vue") {
        return Some(Framework::Vue);
    }
    if pkg.has_dependency("solid-js") {
        return Some(Framework::Solid);
    }
    if pkg.has_dependency("preact") {
        return Some(Framework::Preact);
    }
    if pkg.has_dependency("@builder.io/qwik") {
        return Some(Framework::Qwik);
    }
    if pkg.has_dependency("react") || pkg.has_dependency("react-dom") {
        return Some(Framework::React);
    }

    // Build tools (if no framework detected)
    if pkg.has_dependency("vite")
        || path.join("vite.config.ts").exists()
        || path.join("vite.config.js").exists()
    {
        return Some(Framework::Vite);
    }
    if pkg.has_dependency("webpack") {
        return Some(Framework::Webpack);
    }
    if pkg.has_dependency("parcel") {
        return Some(Framework::Parcel);
    }
    if pkg.has_dependency("esbuild") {
        return Some(Framework::Esbuild);
    }
    if pkg.has_dependency("turbopack") || pkg.has_dependency("@vercel/turbopack") {
        return Some(Framework::Turbopack);
    }

    // Return None to let detect_framework check other languages
    // This allows PHP/Ruby/Python projects with package.json (for frontend assets)
    // to be properly detected
    None
}

/// Detect Rust framework from Cargo.toml
fn detect_rust_framework(cargo: &CargoToml) -> Option<Framework> {
    if cargo.is_tauri() {
        return Some(Framework::Tauri);
    }
    if cargo.has_dependency("actix-web") {
        return Some(Framework::ActixWeb);
    }
    if cargo.has_dependency("axum") {
        return Some(Framework::Axum);
    }
    if cargo.has_dependency("rocket") {
        return Some(Framework::Rocket);
    }
    if cargo.has_dependency("warp") {
        return Some(Framework::Warp);
    }
    if cargo.has_dependency("tide") {
        return Some(Framework::Tide);
    }

    Some(Framework::Rust)
}

/// Detect Python framework
fn detect_python_framework(path: &Path) -> Option<Framework> {
    // Check for framework-specific files
    if path.join("manage.py").exists() {
        // Verify it's Django
        if let Ok(content) = fs::read_to_string(path.join("manage.py")) {
            if content.contains("django") {
                return Some(Framework::Django);
            }
        }
        return Some(Framework::Django);
    }

    // Check requirements.txt
    if let Ok(content) = fs::read_to_string(path.join("requirements.txt")) {
        let content_lower = content.to_lowercase();
        if content_lower.contains("django") {
            return Some(Framework::Django);
        }
        if content_lower.contains("flask") {
            return Some(Framework::Flask);
        }
        if content_lower.contains("fastapi") {
            return Some(Framework::FastApi);
        }
        if content_lower.contains("pyramid") {
            return Some(Framework::Pyramid);
        }
        if content_lower.contains("tornado") {
            return Some(Framework::Tornado);
        }
        return Some(Framework::Python);
    }

    // Check pyproject.toml
    if let Ok(content) = fs::read_to_string(path.join("pyproject.toml")) {
        let content_lower = content.to_lowercase();
        if content_lower.contains("django") {
            return Some(Framework::Django);
        }
        if content_lower.contains("flask") {
            return Some(Framework::Flask);
        }
        if content_lower.contains("fastapi") {
            return Some(Framework::FastApi);
        }
        return Some(Framework::Python);
    }

    // If we have Python files but no specific framework
    if path.join("app.py").exists()
        || path.join("main.py").exists()
        || path.join("setup.py").exists()
    {
        return Some(Framework::Python);
    }

    None
}

/// Detect PHP framework
fn detect_php_framework(path: &Path) -> Option<Framework> {
    // Laravel
    if path.join("artisan").exists() {
        return Some(Framework::Laravel);
    }

    // Symfony
    if path.join("symfony.lock").exists() || path.join("bin/console").exists() {
        return Some(Framework::Symfony);
    }

    // Check composer.json
    if let Ok(content) = fs::read_to_string(path.join("composer.json")) {
        let content_lower = content.to_lowercase();
        if content_lower.contains("laravel/framework") {
            return Some(Framework::Laravel);
        }
        if content_lower.contains("symfony/framework-bundle") {
            return Some(Framework::Symfony);
        }
        if content_lower.contains("codeigniter") {
            return Some(Framework::CodeIgniter);
        }
        if content_lower.contains("yiisoft/yii2") {
            return Some(Framework::Yii);
        }
        if content_lower.contains("cakephp/cakephp") {
            return Some(Framework::CakePHP);
        }
        return Some(Framework::Php);
    }

    // WordPress
    if path.join("wp-config.php").exists() || path.join("wp-content").exists() {
        return Some(Framework::WordPress);
    }

    // Drupal
    if path.join("core/lib/Drupal.php").exists() {
        return Some(Framework::Drupal);
    }

    None
}

/// Detect Ruby framework
fn detect_ruby_framework(path: &Path) -> Option<Framework> {
    // Rails
    if path.join("config/application.rb").exists() || path.join("bin/rails").exists() {
        return Some(Framework::Rails);
    }

    // Check Gemfile
    if let Ok(content) = fs::read_to_string(path.join("Gemfile")) {
        let content_lower = content.to_lowercase();
        if content_lower.contains("rails") {
            return Some(Framework::Rails);
        }
        if content_lower.contains("sinatra") {
            return Some(Framework::Sinatra);
        }
        if content_lower.contains("hanami") {
            return Some(Framework::Hanami);
        }
        return Some(Framework::Ruby);
    }

    None
}

/// Detect Go framework
fn detect_go_framework(path: &Path) -> Option<Framework> {
    if let Ok(content) = fs::read_to_string(path.join("go.mod")) {
        let content_lower = content.to_lowercase();
        if content_lower.contains("github.com/gin-gonic/gin") {
            return Some(Framework::Gin);
        }
        if content_lower.contains("github.com/labstack/echo") {
            return Some(Framework::Echo);
        }
        if content_lower.contains("github.com/gofiber/fiber") {
            return Some(Framework::Fiber);
        }
        if content_lower.contains("github.com/go-chi/chi") {
            return Some(Framework::Chi);
        }
        if content_lower.contains("github.com/beego/beego") {
            return Some(Framework::Beego);
        }
        return Some(Framework::Go);
    }

    None
}

/// Detect Java/Kotlin framework
fn detect_java_framework(path: &Path) -> Option<Framework> {
    // Spring Boot
    if path.join("pom.xml").exists() {
        if let Ok(content) = fs::read_to_string(path.join("pom.xml")) {
            if content.contains("spring-boot") {
                return Some(Framework::Spring);
            }
            if content.contains("quarkus") {
                return Some(Framework::Quarkus);
            }
            if content.contains("micronaut") {
                return Some(Framework::Micronaut);
            }
            return Some(Framework::Java);
        }
    }

    // Gradle
    let gradle_files = ["build.gradle", "build.gradle.kts"];
    for gradle_file in gradle_files {
        if let Ok(content) = fs::read_to_string(path.join(gradle_file)) {
            if content.contains("spring-boot") || content.contains("org.springframework") {
                return Some(Framework::Spring);
            }
            if content.contains("quarkus") {
                return Some(Framework::Quarkus);
            }
            if content.contains("micronaut") {
                return Some(Framework::Micronaut);
            }
            if content.contains("io.ktor") {
                return Some(Framework::Ktor);
            }
            if gradle_file.ends_with(".kts") {
                return Some(Framework::Kotlin);
            }
            return Some(Framework::Java);
        }
    }

    None
}

/// Detect .NET framework
fn detect_dotnet_framework(path: &Path) -> Option<Framework> {
    // Look for csproj files
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let file_name = entry.file_name();
            let name = file_name.to_string_lossy();
            if name.ends_with(".csproj") {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    if content.contains("Microsoft.NET.Sdk.Web") {
                        return Some(Framework::AspNetCore);
                    }
                    if content.contains("Microsoft.NET.Sdk.BlazorWebAssembly")
                        || content.contains("Blazor")
                    {
                        return Some(Framework::Blazor);
                    }
                    return Some(Framework::CSharp);
                }
            }
        }
    }

    None
}

/// Detect generic language as fallback
fn detect_generic_language(path: &Path) -> Framework {
    // Priority: backend languages first, then Node.js
    // This ensures PHP/Python/Ruby/Go projects with package.json (for frontend assets)
    // are correctly detected
    if path.join("composer.json").exists() {
        return Framework::Php;
    }
    if path.join("requirements.txt").exists()
        || path.join("pyproject.toml").exists()
        || path.join("setup.py").exists()
    {
        return Framework::Python;
    }
    if path.join("Gemfile").exists() {
        return Framework::Ruby;
    }
    if path.join("go.mod").exists() {
        return Framework::Go;
    }
    if path.join("Cargo.toml").exists() {
        return Framework::Rust;
    }
    if path.join("package.json").exists() {
        return Framework::Node;
    }
    if path.join("mix.exs").exists() {
        return Framework::Elixir;
    }
    if path.join("deno.json").exists() || path.join("deno.jsonc").exists() {
        return Framework::Deno;
    }

    Framework::Unknown
}

/// Detect all frameworks in a directory (for monorepos/multi-service)
#[allow(dead_code)]
pub fn detect_all_frameworks(path: &Path) -> Vec<Framework> {
    let mut frameworks = Vec::new();

    let primary = detect_framework(path);
    if primary != Framework::Unknown {
        frameworks.push(primary);
    }

    // Check for additional services in common locations
    let service_dirs = [
        "frontend", "backend", "api", "web", "app", "server", "client",
    ];

    for dir in service_dirs {
        let service_path = path.join(dir);
        if service_path.exists() && service_path.is_dir() {
            let framework = detect_framework(&service_path);
            if framework != Framework::Unknown && !frameworks.contains(&framework) {
                frameworks.push(framework);
            }
        }
    }

    frameworks
}
