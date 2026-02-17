use crate::models::service::{CreateServiceRequest, Service};
use rusqlite::{params, Connection, Result};

pub struct ServiceRepository<'a> {
    conn: &'a Connection,
}

impl<'a> ServiceRepository<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    pub fn create(&self, service: &CreateServiceRequest) -> Result<Service> {
        self.conn.execute(
            "INSERT INTO services 
             (id, project_id, name, service_type, stack, path, url, port, command, status, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'stopped', CURRENT_TIMESTAMP)",
            params![
                &service.id,
                &service.project_id,
                &service.name,
                &service.service_type,
                &service.stack,
                &service.path,
                &service.url,
                &service.port,
                &service.command
            ],
        )?;

        self.find_by_id(&service.id)
            .map(|opt| opt.expect("Service should exist after insertion"))
    }

    pub fn find_by_id(&self, id: &str) -> Result<Option<Service>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, name, service_type, stack, path, url, port, command, status, created_at, updated_at 
             FROM services 
             WHERE id = ?1"
        )?;

        let service = stmt.query_row(params![id], |row| {
            Ok(Service {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                service_type: row.get(3)?,
                stack: row.get(4)?,
                path: row.get(5)?,
                url: row.get(6)?,
                port: row.get(7)?,
                command: row.get(8)?,
                status: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        });

        match service {
            Ok(s) => Ok(Some(s)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn find_by_project_id(&self, project_id: &str) -> Result<Vec<Service>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, name, service_type, stack, path, url, port, command, status, created_at, updated_at 
             FROM services 
             WHERE project_id = ?1 
             ORDER BY created_at ASC"
        )?;

        let services = stmt.query_map(params![project_id], |row| {
            Ok(Service {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                service_type: row.get(3)?,
                stack: row.get(4)?,
                path: row.get(5)?,
                url: row.get(6)?,
                port: row.get(7)?,
                command: row.get(8)?,
                status: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;

        services.collect()
    }

    #[allow(dead_code)]
    pub fn update_status(&self, id: &str, status: &str) -> Result<bool> {
        let rows_affected = self.conn.execute(
            "UPDATE services 
             SET status = ?1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?2",
            params![status, id],
        )?;

        Ok(rows_affected > 0)
    }

    #[allow(dead_code)]
    pub fn delete(&self, id: &str) -> Result<bool> {
        let rows_affected = self
            .conn
            .execute("DELETE FROM services WHERE id = ?1", params![id])?;

        Ok(rows_affected > 0)
    }

    pub fn delete_by_project_id(&self, project_id: &str) -> Result<bool> {
        let rows_affected = self.conn.execute(
            "DELETE FROM services WHERE project_id = ?1",
            params![project_id],
        )?;

        Ok(rows_affected > 0)
    }
}
