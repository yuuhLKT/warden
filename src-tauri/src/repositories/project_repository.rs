use crate::models::project::{CreateProjectRequest, Project, UpdateProjectRequest};
use rusqlite::{params, Connection, Result};

pub struct ProjectRepository<'a> {
    conn: &'a Connection,
}

impl<'a> ProjectRepository<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    pub fn create(&self, project: &CreateProjectRequest) -> Result<Project> {
        self.conn.execute(
            "INSERT INTO projects (id, name, folder, updated_at) 
             VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)",
            params![&project.id, &project.name, &project.folder],
        )?;

        self.find_by_id(&project.id)
            .map(|opt| opt.expect("Project should exist after insertion"))
    }

    pub fn find_by_id(&self, id: &str) -> Result<Option<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, folder, created_at, updated_at 
             FROM projects 
             WHERE id = ?1",
        )?;

        let project = stmt.query_row(params![id], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                folder: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        });

        match project {
            Ok(p) => Ok(Some(p)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn find_all(&self) -> Result<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, folder, created_at, updated_at 
             FROM projects 
             ORDER BY created_at DESC",
        )?;

        let projects = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                folder: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        projects.collect()
    }

    #[allow(dead_code)]
    pub fn find_by_folder(&self, folder: &str) -> Result<Option<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, folder, created_at, updated_at 
             FROM projects 
             WHERE folder = ?1",
        )?;

        let project = stmt.query_row(params![folder], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                folder: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        });

        match project {
            Ok(p) => Ok(Some(p)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn folder_exists(&self, folder: &str) -> Result<bool> {
        let count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM projects WHERE folder = ?1",
            params![folder],
            |row| row.get(0),
        )?;

        Ok(count > 0)
    }

    #[allow(dead_code)]
    pub fn update(&self, id: &str, project: &UpdateProjectRequest) -> Result<Option<Project>> {
        let existing = self.find_by_id(id)?;

        if existing.is_none() {
            return Ok(None);
        }

        let existing = existing.unwrap();

        let name = project.name.as_ref().unwrap_or(&existing.name);
        let folder = project.folder.as_ref().unwrap_or(&existing.folder);

        self.conn.execute(
            "UPDATE projects 
             SET name = ?1, folder = ?2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?3",
            params![name, folder, id],
        )?;

        self.find_by_id(id)
    }

    pub fn delete(&self, id: &str) -> Result<bool> {
        let rows_affected = self
            .conn
            .execute("DELETE FROM projects WHERE id = ?1", params![id])?;

        Ok(rows_affected > 0)
    }

    #[allow(dead_code)]
    pub fn exists(&self, id: &str) -> Result<bool> {
        let count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM projects WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )?;

        Ok(count > 0)
    }
}
