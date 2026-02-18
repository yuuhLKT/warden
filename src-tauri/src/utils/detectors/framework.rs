use crate::models::detected_service::Framework;
use crate::utils::parsers::{CargoToml, PackageJson};
use std::fs;
use std::path::Path;

// ---------------------------------------------------------------------------
// Evidence scoring
// ---------------------------------------------------------------------------
//
// Instead of a first-match chain, every scorer accumulates evidence points for
// a candidate framework. The candidate with the highest total score wins.
//
// Weight guide:
//   10 – Exclusive marker: only this ecosystem can produce it
//        (e.g. `artisan`, `manage.py`, `go.mod`, `Cargo.toml`)
//    7 – Strong marker: almost always this ecosystem
//        (e.g. `composer.lock`, specific framework dep in package.json)
//    5 – Good marker: normally this ecosystem but occasionally shared
//        (e.g. `composer.json`, `requirements.txt`, `package-lock.json`)
//    3 – Weak marker: present in this ecosystem but very common elsewhere
//        (e.g. bare `package.json`, generic config files)
//    1 – Corroborating signal: tips the scale when scores are otherwise equal

struct Candidate {
    framework: Framework,
    score: u32,
}

impl Candidate {
    fn new(framework: Framework, score: u32) -> Self {
        Self { framework, score }
    }
}

fn c(framework: Framework, score: u32) -> Candidate {
    Candidate::new(framework, score)
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

pub fn detect_framework(
    path: &Path,
    package_json: Option<&PackageJson>,
    cargo_toml: Option<&CargoToml>,
) -> Framework {
    // Tauri is always unambiguous: src-tauri/ only exists there.
    if path.join("src-tauri").exists()
        || path.join("tauri.conf.json").exists()
        || path.join("src-tauri/tauri.conf.json").exists()
    {
        return Framework::Tauri;
    }

    let mut candidates: Vec<Candidate> = vec![
        score_rust(path, cargo_toml),
        score_php(path),
        score_python(path),
        score_ruby(path),
        score_go(path),
        score_java(path),
        score_dotnet(path),
        score_elixir(path),
        score_deno(path),
        score_node(path),
    ];

    // Node sub-frameworks from package.json content
    if let Some(pkg) = package_json {
        candidates.extend(score_node_frameworks(pkg, path));
    }

    // Winner = highest score; zero means Unknown
    candidates.sort_by(|a, b| b.score.cmp(&a.score));

    match candidates.into_iter().next() {
        Some(c) if c.score > 0 => c.framework,
        _ => Framework::Unknown,
    }
}

// ---------------------------------------------------------------------------
// Per-ecosystem scorers – each returns a single Candidate
// ---------------------------------------------------------------------------

fn score_rust(path: &Path, cargo_toml: Option<&CargoToml>) -> Candidate {
    let has_toml = path.join("Cargo.toml").exists();
    if !has_toml {
        return c(Framework::Rust, 0);
    }

    let lock_bonus: u32 = if path.join("Cargo.lock").exists() {
        3
    } else {
        0
    };

    if let Some(ct) = cargo_toml {
        if ct.has_dependency("actix-web") {
            return c(Framework::ActixWeb, 10 + 7 + lock_bonus);
        }
        if ct.has_dependency("axum") {
            return c(Framework::Axum, 10 + 7 + lock_bonus);
        }
        if ct.has_dependency("rocket") {
            return c(Framework::Rocket, 10 + 7 + lock_bonus);
        }
        if ct.has_dependency("warp") {
            return c(Framework::Warp, 10 + 7 + lock_bonus);
        }
        if ct.has_dependency("tide") {
            return c(Framework::Tide, 10 + 7 + lock_bonus);
        }
    }

    c(Framework::Rust, 10 + lock_bonus)
}

fn score_php(path: &Path) -> Candidate {
    // `artisan` is 100% Laravel-exclusive
    if path.join("artisan").exists() {
        let bonus = if path.join("composer.json").exists() {
            7
        } else {
            0
        } + if path.join("composer.lock").exists() {
            5
        } else {
            0
        };
        return c(Framework::Laravel, 10 + bonus);
    }

    if path.join("symfony.lock").exists() {
        return c(Framework::Symfony, 10 + 5);
    }
    if path.join("bin/console").exists() {
        return c(Framework::Symfony, 10);
    }
    if path.join("wp-config.php").exists() {
        return c(Framework::WordPress, 10);
    }
    if path.join("wp-content").exists() {
        return c(Framework::WordPress, 7);
    }
    if path.join("core/lib/Drupal.php").exists() {
        return c(Framework::Drupal, 10);
    }

    // Inspect composer.json content
    if let Ok(content) = fs::read_to_string(path.join("composer.json")) {
        let low = content.to_lowercase();
        let lock_bonus: u32 = if path.join("composer.lock").exists() {
            5
        } else {
            0
        };

        let framework = if low.contains("laravel/framework") {
            Framework::Laravel
        } else if low.contains("symfony/framework-bundle") {
            Framework::Symfony
        } else if low.contains("codeigniter") {
            Framework::CodeIgniter
        } else if low.contains("yiisoft/yii2") {
            Framework::Yii
        } else if low.contains("cakephp/cakephp") {
            Framework::CakePHP
        } else {
            Framework::Php
        };

        return c(framework, 7 + lock_bonus);
    }

    // Bare composer.lock without a readable composer.json
    if path.join("composer.lock").exists() {
        return c(Framework::Php, 7);
    }

    c(Framework::Php, 0)
}

fn score_python(path: &Path) -> Candidate {
    // manage.py is Django-exclusive
    if path.join("manage.py").exists() {
        return c(Framework::Django, 10 + 3);
    }

    if let Ok(content) = fs::read_to_string(path.join("requirements.txt")) {
        let low = content.to_lowercase();
        let framework = if low.contains("django") {
            Framework::Django
        } else if low.contains("flask") {
            Framework::Flask
        } else if low.contains("fastapi") {
            Framework::FastApi
        } else if low.contains("pyramid") {
            Framework::Pyramid
        } else if low.contains("tornado") {
            Framework::Tornado
        } else {
            Framework::Python
        };
        return c(framework, 10);
    }

    if let Ok(content) = fs::read_to_string(path.join("pyproject.toml")) {
        let low = content.to_lowercase();
        let framework = if low.contains("django") {
            Framework::Django
        } else if low.contains("flask") {
            Framework::Flask
        } else if low.contains("fastapi") {
            Framework::FastApi
        } else {
            Framework::Python
        };
        return c(framework, 10);
    }

    let generic = path.join("app.py").exists()
        || path.join("main.py").exists()
        || path.join("setup.py").exists()
        || path.join("Pipfile").exists()
        || path.join("Pipfile.lock").exists();

    c(Framework::Python, if generic { 7 } else { 0 })
}

fn score_ruby(path: &Path) -> Candidate {
    if path.join("config/application.rb").exists() || path.join("bin/rails").exists() {
        return c(Framework::Rails, 10 + 5);
    }

    if let Ok(content) = fs::read_to_string(path.join("Gemfile")) {
        let low = content.to_lowercase();
        let lock_bonus: u32 = if path.join("Gemfile.lock").exists() {
            3
        } else {
            0
        };
        let framework = if low.contains("rails") {
            Framework::Rails
        } else if low.contains("sinatra") {
            Framework::Sinatra
        } else if low.contains("hanami") {
            Framework::Hanami
        } else {
            Framework::Ruby
        };
        return c(framework, 10 + lock_bonus);
    }

    c(
        Framework::Ruby,
        if path.join("Gemfile.lock").exists() {
            7
        } else {
            0
        },
    )
}

fn score_go(path: &Path) -> Candidate {
    if let Ok(content) = fs::read_to_string(path.join("go.mod")) {
        let low = content.to_lowercase();
        let sum_bonus: u32 = if path.join("go.sum").exists() { 3 } else { 0 };
        let framework = if low.contains("github.com/gin-gonic/gin") {
            Framework::Gin
        } else if low.contains("github.com/labstack/echo") {
            Framework::Echo
        } else if low.contains("github.com/gofiber/fiber") {
            Framework::Fiber
        } else if low.contains("github.com/go-chi/chi") {
            Framework::Chi
        } else if low.contains("github.com/beego/beego") {
            Framework::Beego
        } else {
            Framework::Go
        };
        return c(framework, 10 + sum_bonus);
    }

    c(
        Framework::Go,
        if path.join("go.sum").exists() { 7 } else { 0 },
    )
}

fn score_java(path: &Path) -> Candidate {
    if path.join("pom.xml").exists() {
        let framework = fs::read_to_string(path.join("pom.xml"))
            .map(|ct| {
                if ct.contains("spring-boot") {
                    Framework::Spring
                } else if ct.contains("quarkus") {
                    Framework::Quarkus
                } else if ct.contains("micronaut") {
                    Framework::Micronaut
                } else {
                    Framework::Java
                }
            })
            .unwrap_or(Framework::Java);
        return c(framework, 10);
    }

    for gradle_file in ["build.gradle", "build.gradle.kts"] {
        if path.join(gradle_file).exists() {
            let framework = fs::read_to_string(path.join(gradle_file))
                .map(|ct| {
                    if ct.contains("spring-boot") || ct.contains("org.springframework") {
                        Framework::Spring
                    } else if ct.contains("quarkus") {
                        Framework::Quarkus
                    } else if ct.contains("micronaut") {
                        Framework::Micronaut
                    } else if ct.contains("io.ktor") {
                        Framework::Ktor
                    } else if gradle_file.ends_with(".kts") {
                        Framework::Kotlin
                    } else {
                        Framework::Java
                    }
                })
                .unwrap_or(Framework::Java);
            return c(framework, 10);
        }
    }

    c(Framework::Java, 0)
}

fn score_dotnet(path: &Path) -> Candidate {
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name = name.to_string_lossy();

            if name.ends_with(".csproj") {
                let framework = fs::read_to_string(entry.path())
                    .map(|ct| {
                        if ct.contains("Microsoft.NET.Sdk.Web") {
                            Framework::AspNetCore
                        } else if ct.contains("Microsoft.NET.Sdk.BlazorWebAssembly")
                            || ct.contains("Blazor")
                        {
                            Framework::Blazor
                        } else {
                            Framework::CSharp
                        }
                    })
                    .unwrap_or(Framework::CSharp);
                return c(framework, 10);
            }
            if name.ends_with(".sln") {
                return c(Framework::CSharp, 10);
            }
        }
    }
    c(Framework::CSharp, 0)
}

fn score_elixir(path: &Path) -> Candidate {
    let mix_exs: u32 = if path.join("mix.exs").exists() { 10 } else { 0 };
    let mix_lock: u32 = if path.join("mix.lock").exists() { 5 } else { 0 };
    c(Framework::Elixir, mix_exs + mix_lock)
}

fn score_deno(path: &Path) -> Candidate {
    let score = if path.join("deno.json").exists() || path.join("deno.jsonc").exists() {
        10
    } else {
        0
    };
    c(Framework::Deno, score)
}

/// Generic Node.js presence (no specific framework identified yet).
/// Kept intentionally low so specific framework candidates from
/// `score_node_frameworks` always outweigh this fallback.
fn score_node(path: &Path) -> Candidate {
    let has_pkg: u32 = if path.join("package.json").exists() {
        3
    } else {
        0
    };
    let has_lock: u32 = if path.join("package-lock.json").exists()
        || path.join("yarn.lock").exists()
        || path.join("pnpm-lock.yaml").exists()
        || path.join("bun.lock").exists()
        || path.join("bun.lockb").exists()
    {
        5
    } else {
        0
    };
    c(Framework::Node, has_pkg + has_lock)
}

/// Produces one Candidate per specific Node/JS framework detected from the
/// package.json contents. These are merged into the global list so they
/// compete head-to-head with non-JS ecosystems.
fn score_node_frameworks(pkg: &PackageJson, path: &Path) -> Vec<Candidate> {
    let mut out: Vec<Candidate> = Vec::new();

    let mut maybe = |framework: Framework, score: u32| {
        if score > 0 {
            out.push(c(framework, score));
        }
    };

    // Meta-frameworks
    maybe(
        Framework::NextJs,
        if pkg.has_dependency("next") { 10 } else { 0 },
    );
    maybe(
        Framework::NuxtJs,
        if pkg.has_dependency("nuxt") || pkg.has_dependency("nuxt3") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Remix,
        if pkg.has_dependency("@remix-run/react") || pkg.has_dependency("@remix-run/node") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Astro,
        if pkg.has_dependency("astro") { 10 } else { 0 },
    );
    maybe(
        Framework::Gatsby,
        if pkg.has_dependency("gatsby") { 10 } else { 0 },
    );
    maybe(
        Framework::SvelteKit,
        if pkg.has_dependency("@sveltejs/kit") {
            10
        } else {
            0
        },
    );

    // Desktop
    maybe(
        Framework::Electron,
        if pkg.has_dependency("electron") || pkg.has_dependency("electron-builder") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Neutralino,
        if pkg.has_dependency("@aspect/neutralino") || path.join("neutralino.config.json").exists()
        {
            10
        } else {
            0
        },
    );

    // Mobile
    maybe(
        Framework::ReactNative,
        if pkg.has_dependency("react-native") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Expo,
        if pkg.has_dependency("expo") { 10 } else { 0 },
    );
    maybe(
        Framework::Ionic,
        if pkg.has_dependency("@ionic/core")
            || pkg.has_dependency("@ionic/react")
            || pkg.has_dependency("@ionic/vue")
            || pkg.has_dependency("@ionic/angular")
        {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Capacitor,
        if pkg.has_dependency("@capacitor/core") {
            10
        } else {
            0
        },
    );

    // Backend Node
    maybe(
        Framework::NestJs,
        if pkg.has_dependency("@nestjs/core") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::AdonisJs,
        if pkg.has_dependency("@adonisjs/core") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Strapi,
        if pkg.has_dependency("strapi") || pkg.has_dependency("@strapi/strapi") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Fastify,
        if pkg.has_dependency("fastify") { 9 } else { 0 },
    );
    maybe(
        Framework::Koa,
        if pkg.has_dependency("koa") { 9 } else { 0 },
    );
    maybe(
        Framework::Hapi,
        if pkg.has_dependency("@hapi/hapi") || pkg.has_dependency("hapi") {
            9
        } else {
            0
        },
    );
    maybe(
        Framework::Express,
        if pkg.has_dependency("express") { 8 } else { 0 },
    );

    // Frontend
    maybe(
        Framework::Angular,
        if pkg.has_dependency("@angular/core") {
            10
        } else {
            0
        },
    );
    maybe(
        Framework::Vue,
        if pkg.has_dependency("vue") { 9 } else { 0 },
    );
    maybe(
        Framework::Svelte,
        if pkg.has_dependency("svelte") { 9 } else { 0 },
    );
    maybe(
        Framework::Solid,
        if pkg.has_dependency("solid-js") { 9 } else { 0 },
    );
    maybe(
        Framework::Preact,
        if pkg.has_dependency("preact") { 9 } else { 0 },
    );
    maybe(
        Framework::Qwik,
        if pkg.has_dependency("@builder.io/qwik") {
            9
        } else {
            0
        },
    );
    maybe(
        Framework::React,
        if pkg.has_dependency("react") || pkg.has_dependency("react-dom") {
            8
        } else {
            0
        },
    );

    // Build tools (low score – often appear alongside a real framework dep)
    let has_vite = pkg.has_dependency("vite")
        || path.join("vite.config.ts").exists()
        || path.join("vite.config.js").exists();
    maybe(Framework::Vite, if has_vite { 5 } else { 0 });
    maybe(
        Framework::Webpack,
        if pkg.has_dependency("webpack") { 5 } else { 0 },
    );
    maybe(
        Framework::Parcel,
        if pkg.has_dependency("parcel") { 5 } else { 0 },
    );
    maybe(
        Framework::Esbuild,
        if pkg.has_dependency("esbuild") { 5 } else { 0 },
    );
    maybe(
        Framework::Turbopack,
        if pkg.has_dependency("turbopack") || pkg.has_dependency("@vercel/turbopack") {
            5
        } else {
            0
        },
    );

    // Bun runtime
    maybe(
        Framework::Bun,
        if path.join("bun.lock").exists() || path.join("bun.lockb").exists() {
            8
        } else {
            0
        },
    );

    out
}
