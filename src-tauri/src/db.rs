use anyhow::Result;
use rusqlite::Connection;
use std::path::PathBuf;
use std::fs;
use std::str::FromStr;
use crate::models::{Session, SessionStatus};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let data_dir = get_data_dir()?;
        fs::create_dir_all(&data_dir)?;
        
        let db_path = data_dir.join("polka.db");
        let conn = Connection::open(&db_path)?;
        
        let db = Database { conn };
        db.init_db()?;
        
        Ok(db)
    }
    
    fn init_db(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                course TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                duration_ms INTEGER DEFAULT 0,
                status TEXT NOT NULL CHECK (status IN ('draft', 'recording', 'complete')),
                notes_path TEXT,
                audio_path TEXT,
                transcript_path TEXT
            )",
            [],
        )?;
        
        Ok(())
    }
    
    pub fn insert_session(&self, session: &Session) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO sessions (id, title, course, created_at, duration_ms, status, notes_path, audio_path, transcript_path)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (
                &session.id,
                &session.title,
                &session.course,
                session.created_at,
                session.duration_ms,
                &session.status.as_str(),
                &session.notes_path,
                &session.audio_path,
                &session.transcript_path,
            ),
        )?;
        
        Ok(())
    }
    
    pub fn list_sessions(&self) -> Result<Vec<Session>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, course, created_at, duration_ms, status, notes_path, audio_path, transcript_path
             FROM sessions ORDER BY created_at DESC"
        )?;
        
        let session_iter = stmt.query_map([], |row| {
            let status_str: String = row.get(5)?;
            let status = SessionStatus::from_str(&status_str)
                .unwrap_or(SessionStatus::Draft);
                
            Ok(Session {
                id: row.get(0)?,
                title: row.get(1)?,
                course: row.get(2)?,
                created_at: row.get(3)?,
                duration_ms: row.get(4)?,
                status,
                notes_path: row.get(6)?,
                audio_path: row.get(7)?,
                transcript_path: row.get(8)?,
            })
        })?;
        
        let mut sessions = Vec::new();
        for session in session_iter {
            sessions.push(session?);
        }
        
        Ok(sessions)
    }
    
    pub fn update_session_status(&self, id: &str, status: &SessionStatus) -> Result<()> {
        self.conn.execute(
            "UPDATE sessions SET status = ?1 WHERE id = ?2",
            (status.as_str(), id),
        )?;
        
        Ok(())
    }
    
    pub fn get_session(&self, id: &str) -> Result<Option<Session>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, course, created_at, duration_ms, status, notes_path, audio_path, transcript_path
             FROM sessions WHERE id = ?1"
        )?;
        
        let mut session_iter = stmt.query_map([id], |row| {
            let status_str: String = row.get(5)?;
            let status = SessionStatus::from_str(&status_str)
                .unwrap_or(SessionStatus::Draft);
                
            Ok(Session {
                id: row.get(0)?,
                title: row.get(1)?,
                course: row.get(2)?,
                created_at: row.get(3)?,
                duration_ms: row.get(4)?,
                status,
                notes_path: row.get(6)?,
                audio_path: row.get(7)?,
                transcript_path: row.get(8)?,
            })
        })?;
        
        Ok(session_iter.next().transpose()?)
    }
    
    pub fn delete_session(&self, id: &str) -> Result<bool> {
        let rows_affected = self.conn.execute(
            "DELETE FROM sessions WHERE id = ?1",
            [id],
        )?;
        
        Ok(rows_affected > 0)
    }
}

fn get_data_dir() -> Result<PathBuf> {
    let home = dirs::home_dir().ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?;
    Ok(home.join(".polka").join("data"))
}

fn get_sessions_dir() -> Result<PathBuf> {
    let data_dir = get_data_dir()?;
    Ok(data_dir.join("sessions"))
}

pub fn create_session_folder(session_id: &str) -> Result<PathBuf> {
    let sessions_dir = get_sessions_dir()?;
    let session_dir = sessions_dir.join(session_id);
    
    // Create the session directory if it doesn't exist
    fs::create_dir_all(&session_dir)?;
    
    Ok(session_dir)
}

pub fn delete_session_folder(session_id: &str) -> Result<()> {
    let sessions_dir = get_sessions_dir()?;
    let session_dir = sessions_dir.join(session_id);
    
    // Remove the entire session directory and all its contents
    if session_dir.exists() {
        fs::remove_dir_all(&session_dir)?;
    }
    
    Ok(())
}

pub fn init_db() -> Result<Database> {
    Database::new()
}
