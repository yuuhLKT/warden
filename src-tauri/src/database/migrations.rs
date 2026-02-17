use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Criar tabela de controle de migrations
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Verificar versão atual
    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if current_version < 1 {
        migration_001_create_projects(conn)?;
    }

    if current_version < 2 {
        migration_002_create_services(conn)?;
    }

    Ok(())
}

fn migration_001_create_projects(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            folder TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Criar índice para busca por nome
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)",
        [],
    )?;

    // Registrar migration
    conn.execute("INSERT INTO schema_migrations (version) VALUES (1)", [])?;

    Ok(())
}

fn migration_002_create_services(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            service_type TEXT NOT NULL,
            stack TEXT NOT NULL,
            path TEXT NOT NULL,
            url TEXT NOT NULL,
            port INTEGER NOT NULL,
            command TEXT NOT NULL,
            status TEXT DEFAULT 'stopped',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Criar índices
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_services_project_id ON services(project_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)",
        [],
    )?;

    // Registrar migration
    conn.execute("INSERT INTO schema_migrations (version) VALUES (2)", [])?;

    Ok(())
}
