use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Service {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub service_type: String,
    pub stack: String,
    pub path: String,
    pub url: String,
    pub port: i32,
    pub command: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateServiceRequest {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub service_type: String,
    pub stack: String,
    pub path: String,
    pub url: String,
    pub port: i32,
    pub command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateServiceRequest {
    pub name: Option<String>,
    pub service_type: Option<String>,
    pub stack: Option<String>,
    pub path: Option<String>,
    pub url: Option<String>,
    pub port: Option<i32>,
    pub command: Option<String>,
}
