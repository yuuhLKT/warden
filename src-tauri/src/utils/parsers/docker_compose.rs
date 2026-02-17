use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Parsed docker-compose.yml structure
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct DockerCompose {
    pub version: Option<String>,
    pub services: HashMap<String, DockerService>,
    pub volumes: Option<HashMap<String, serde_yaml::Value>>,
    pub networks: Option<HashMap<String, serde_yaml::Value>>,
}

/// A service in docker-compose
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct DockerService {
    pub image: Option<String>,
    pub build: Option<DockerBuild>,
    pub ports: Vec<String>,
    pub environment: Option<DockerEnvironment>,
    pub volumes: Option<Vec<String>>,
    pub command: Option<DockerCommand>,
    pub depends_on: Option<Vec<String>>,
    pub restart: Option<String>,
    pub working_dir: Option<String>,
    pub container_name: Option<String>,
}

/// Build configuration
#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
#[allow(dead_code)]
pub enum DockerBuild {
    Simple(String),
    Complex {
        context: Option<String>,
        dockerfile: Option<String>,
        args: Option<HashMap<String, String>>,
        target: Option<String>,
    },
}

/// Environment variables
#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
#[allow(dead_code)]
pub enum DockerEnvironment {
    Array(Vec<String>),
    Map(HashMap<String, String>),
}

/// Command configuration
#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum DockerCommand {
    String(String),
    Array(Vec<String>),
}

impl DockerCompose {
    /// Parse docker-compose.yml from a path
    pub fn parse(path: &Path) -> Option<Self> {
        let compose_files = [
            "docker-compose.yml",
            "docker-compose.yaml",
            "compose.yml",
            "compose.yaml",
        ];

        for file in compose_files {
            let compose_path = if path.is_file() {
                path.to_path_buf()
            } else {
                path.join(file)
            };

            if let Ok(content) = fs::read_to_string(&compose_path) {
                if let Ok(compose) = serde_yaml::from_str(&content) {
                    return Some(compose);
                }
            }
        }

        None
    }

    #[allow(dead_code)]
    pub fn get_service_names(&self) -> Vec<String> {
        self.services.keys().cloned().collect()
    }

    #[allow(dead_code)]
    pub fn get_service(&self, name: &str) -> Option<&DockerService> {
        self.services.get(name)
    }
}

impl DockerService {
    /// Get the first exposed port (host port)
    pub fn get_first_port(&self) -> Option<u16> {
        self.ports.first().and_then(|port_mapping| {
            // Format can be:
            // - "3000" (container port only)
            // - "3000:3000" (host:container)
            // - "127.0.0.1:3000:3000" (ip:host:container)
            let parts: Vec<&str> = port_mapping.split(':').collect();

            match parts.len() {
                1 => parts[0].parse().ok(),
                2 => parts[0].parse().ok(), // host port
                3 => parts[1].parse().ok(), // host port (with IP)
                _ => None,
            }
        })
    }

    /// Get the build context path
    pub fn get_build_context(&self) -> Option<String> {
        match &self.build {
            Some(DockerBuild::Simple(path)) => Some(path.clone()),
            Some(DockerBuild::Complex { context, .. }) => context.clone(),
            None => None,
        }
    }

    /// Get the command as a string
    pub fn get_command_string(&self) -> Option<String> {
        match &self.command {
            Some(DockerCommand::String(cmd)) => Some(cmd.clone()),
            Some(DockerCommand::Array(parts)) => Some(parts.join(" ")),
            None => None,
        }
    }

    /// Check if this is a database service
    pub fn is_database(&self) -> bool {
        let db_images = [
            "postgres",
            "mysql",
            "mariadb",
            "mongo",
            "mongodb",
            "redis",
            "memcached",
            "elasticsearch",
            "cassandra",
            "couchdb",
            "neo4j",
            "influxdb",
            "timescaledb",
            "clickhouse",
        ];

        if let Some(image) = &self.image {
            let image_lower = image.to_lowercase();
            return db_images.iter().any(|db| image_lower.contains(db));
        }

        false
    }

    /// Check if this is a message queue service
    pub fn is_message_queue(&self) -> bool {
        let mq_images = ["rabbitmq", "kafka", "nats", "activemq", "zeromq", "pulsar"];

        if let Some(image) = &self.image {
            let image_lower = image.to_lowercase();
            return mq_images.iter().any(|mq| image_lower.contains(mq));
        }

        false
    }

    /// Check if this is an infrastructure service (not application code)
    pub fn is_infrastructure(&self) -> bool {
        self.is_database() || self.is_message_queue()
    }
}

#[allow(dead_code)]
pub fn has_docker_compose(path: &Path) -> bool {
    let compose_files = [
        "docker-compose.yml",
        "docker-compose.yaml",
        "compose.yml",
        "compose.yaml",
    ];

    compose_files.iter().any(|file| path.join(file).exists())
}

#[allow(dead_code)]
pub fn has_dockerfile(path: &Path) -> bool {
    path.join("Dockerfile").exists() || path.join("dockerfile").exists()
}
