use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = get_database_path();

        // Criar diretório se não existir
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                rusqlite::Error::InvalidPath(std::path::PathBuf::from(e.to_string()))
            })?;
        }

        let conn = Connection::open(&db_path)?;

        // Habilitar foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        Ok(Self { conn })
    }

    pub fn get_connection(&self) -> &Connection {
        &self.conn
    }

    pub fn get_connection_mut(&mut self) -> &mut Connection {
        &mut self.conn
    }
}

fn get_database_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("~/.config"));
    path.push("warden");
    path.push("warden.db");
    path
}

pub fn init_database() -> Result<Database> {
    Database::new()
}
