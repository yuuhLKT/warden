use crate::models::detected_service::MonorepoTool;
use crate::utils::parsers::PackageJson;
use glob::glob;
use std::fs;
use std::path::{Path, PathBuf};

/// Information about a detected monorepo
#[derive(Debug, Clone)]
pub struct MonorepoInfo {
    pub tool: MonorepoTool,
    #[allow(dead_code)]
    pub workspace_patterns: Vec<String>,
    pub workspace_paths: Vec<PathBuf>,
}

/// Detect if the project is a monorepo and which tool it uses
pub fn detect_monorepo(path: &Path) -> Option<MonorepoInfo> {
    // Check for specific monorepo tools first (most specific)

    // Turborepo
    if path.join("turbo.json").exists() {
        return detect_npm_workspaces(path).map(|mut info| {
            info.tool = MonorepoTool::Turborepo;
            info
        });
    }

    // Nx
    if path.join("nx.json").exists() {
        return detect_nx_workspaces(path);
    }

    // Lerna
    if path.join("lerna.json").exists() {
        return detect_lerna_workspaces(path);
    }

    // Rush
    if path.join("rush.json").exists() {
        return Some(MonorepoInfo {
            tool: MonorepoTool::Rush,
            workspace_patterns: vec![],
            workspace_paths: vec![],
        });
    }

    // pnpm workspaces
    if path.join("pnpm-workspace.yaml").exists() {
        return detect_pnpm_workspaces(path);
    }

    // Cargo workspaces
    if path.join("Cargo.toml").exists() {
        if let Some(info) = detect_cargo_workspaces(path) {
            return Some(info);
        }
    }

    // npm/yarn/bun workspaces (from package.json)
    if let Some(pkg) = PackageJson::parse(path) {
        if pkg.is_monorepo() {
            return detect_npm_workspaces(path);
        }
    }

    None
}

/// Detect npm/yarn/bun workspaces from package.json
fn detect_npm_workspaces(path: &Path) -> Option<MonorepoInfo> {
    let pkg = PackageJson::parse(path)?;
    let patterns = pkg.get_workspace_patterns();

    if patterns.is_empty() {
        return None;
    }

    let workspace_paths = resolve_workspace_patterns(path, &patterns);

    // Determine which package manager
    let tool = if path.join("bun.lock").exists() || path.join("bun.lockb").exists() {
        MonorepoTool::BunWorkspaces
    } else if path.join("yarn.lock").exists() {
        MonorepoTool::YarnWorkspaces
    } else {
        MonorepoTool::NpmWorkspaces
    };

    Some(MonorepoInfo {
        tool,
        workspace_patterns: patterns,
        workspace_paths,
    })
}

/// Detect pnpm workspaces from pnpm-workspace.yaml
fn detect_pnpm_workspaces(path: &Path) -> Option<MonorepoInfo> {
    let workspace_file = path.join("pnpm-workspace.yaml");
    let content = fs::read_to_string(&workspace_file).ok()?;

    // Parse YAML
    let yaml: serde_yaml::Value = serde_yaml::from_str(&content).ok()?;

    let patterns: Vec<String> = yaml
        .get("packages")
        .and_then(|p| p.as_sequence())
        .map(|seq| {
            seq.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .filter(|s| !s.starts_with('!')) // Exclude negations
                .collect()
        })
        .unwrap_or_default();

    let workspace_paths = resolve_workspace_patterns(path, &patterns);

    Some(MonorepoInfo {
        tool: MonorepoTool::PnpmWorkspaces,
        workspace_patterns: patterns,
        workspace_paths,
    })
}

/// Detect Nx workspaces
fn detect_nx_workspaces(path: &Path) -> Option<MonorepoInfo> {
    // Nx typically uses apps/ and libs/ directories
    let mut workspace_paths = Vec::new();

    for dir in ["apps", "libs", "packages"] {
        let dir_path = path.join(dir);
        if dir_path.exists() {
            if let Ok(entries) = fs::read_dir(&dir_path) {
                for entry in entries.flatten() {
                    let entry_path = entry.path();
                    if entry_path.is_dir() {
                        // Check if it's a valid project
                        if entry_path.join("package.json").exists()
                            || entry_path.join("project.json").exists()
                        {
                            workspace_paths.push(entry_path);
                        }
                    }
                }
            }
        }
    }

    Some(MonorepoInfo {
        tool: MonorepoTool::Nx,
        workspace_patterns: vec![
            "apps/*".to_string(),
            "libs/*".to_string(),
            "packages/*".to_string(),
        ],
        workspace_paths,
    })
}

/// Detect Lerna workspaces
fn detect_lerna_workspaces(path: &Path) -> Option<MonorepoInfo> {
    let lerna_file = path.join("lerna.json");
    let content = fs::read_to_string(&lerna_file).ok()?;

    let lerna: serde_json::Value = serde_json::from_str(&content).ok()?;

    let patterns: Vec<String> = lerna
        .get("packages")
        .and_then(|p| p.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_else(|| vec!["packages/*".to_string()]);

    let workspace_paths = resolve_workspace_patterns(path, &patterns);

    Some(MonorepoInfo {
        tool: MonorepoTool::Lerna,
        workspace_patterns: patterns,
        workspace_paths,
    })
}

/// Detect Cargo workspaces
fn detect_cargo_workspaces(path: &Path) -> Option<MonorepoInfo> {
    let cargo_file = path.join("Cargo.toml");
    let content = fs::read_to_string(&cargo_file).ok()?;

    // Parse TOML
    let cargo: toml::Value = toml::from_str(&content).ok()?;

    let members = cargo
        .get("workspace")
        .and_then(|w| w.get("members"))
        .and_then(|m| m.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect::<Vec<_>>()
        });

    if let Some(patterns) = members {
        if !patterns.is_empty() {
            let workspace_paths = resolve_workspace_patterns(path, &patterns);

            return Some(MonorepoInfo {
                tool: MonorepoTool::CargoWorkspace,
                workspace_patterns: patterns,
                workspace_paths,
            });
        }
    }

    None
}

/// Resolve glob patterns to actual paths
fn resolve_workspace_patterns(base_path: &Path, patterns: &[String]) -> Vec<PathBuf> {
    let mut paths = Vec::new();

    for pattern in patterns {
        // Skip negation patterns
        if pattern.starts_with('!') {
            continue;
        }

        let full_pattern = base_path.join(pattern);
        let pattern_str = full_pattern.to_string_lossy();

        // Use glob to expand the pattern
        if let Ok(entries) = glob(&pattern_str) {
            for entry in entries.flatten() {
                if entry.is_dir() {
                    // Check if it's a valid project directory
                    if entry.join("package.json").exists()
                        || entry.join("Cargo.toml").exists()
                        || entry.join("pyproject.toml").exists()
                        || entry.join("go.mod").exists()
                    {
                        paths.push(entry);
                    }
                }
            }
        }
    }

    paths
}

/// Get all workspace packages/projects for scanning
pub fn get_workspace_projects(path: &Path, max_depth: u8) -> Vec<PathBuf> {
    let mut projects = Vec::new();

    if let Some(monorepo) = detect_monorepo(path) {
        projects.extend(monorepo.workspace_paths);
    }

    // If no monorepo or we want deeper scanning
    if max_depth > 1 || projects.is_empty() {
        let additional = scan_for_projects(path, max_depth);
        for project in additional {
            if !projects.contains(&project) {
                projects.push(project);
            }
        }
    }

    projects
}

/// Scan directory for projects up to a certain depth
fn scan_for_projects(path: &Path, max_depth: u8) -> Vec<PathBuf> {
    let mut projects = Vec::new();

    if max_depth == 0 {
        return projects;
    }

    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(_) => return projects,
    };

    for entry in entries.flatten() {
        let entry_path = entry.path();

        if !entry_path.is_dir() {
            continue;
        }

        let folder_name = entry_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        // Skip hidden directories and common non-project directories
        if folder_name.starts_with('.')
            || matches!(
                folder_name.as_str(),
                "node_modules"
                    | "target"
                    | "dist"
                    | "build"
                    | "__pycache__"
                    | "vendor"
                    | ".git"
                    | "coverage"
                    | ".next"
                    | ".nuxt"
            )
        {
            continue;
        }

        // Check if this directory is a project
        if is_project_directory(&entry_path) {
            projects.push(entry_path.clone());
        }

        // Recursively scan subdirectories
        if max_depth > 1 {
            let sub_projects = scan_for_projects(&entry_path, max_depth - 1);
            projects.extend(sub_projects);
        }
    }

    projects
}

/// Check if a directory appears to be a project
fn is_project_directory(path: &Path) -> bool {
    let project_indicators = [
        "package.json",
        "Cargo.toml",
        "pyproject.toml",
        "requirements.txt",
        "composer.json",
        "Gemfile",
        "go.mod",
        "pom.xml",
        "build.gradle",
        "mix.exs",
    ];

    project_indicators
        .iter()
        .any(|indicator| path.join(indicator).exists())
}
