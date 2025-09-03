pub mod db;
pub mod models;

use crate::db::Database;
use crate::models::{Session, SessionStatus};
use anyhow::Result;
use std::sync::Mutex;
use std::str::FromStr;
use tauri::State;
use nanoid::nanoid;

// Database state
pub struct AppState {
    db: Mutex<Database>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn cmd_list_sessions(state: State<'_, AppState>) -> Result<Vec<Session>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_sessions().map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_create_session(
    title: String,
    course: String,
    state: State<'_, AppState>,
) -> Result<Session, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let session = Session {
        id: nanoid!(),
        title,
        course,
        created_at: time::OffsetDateTime::now_utc().unix_timestamp(),
        duration_ms: 0,
        status: SessionStatus::Draft,
        notes_path: None,
        audio_path: None,
        transcript_path: None,
    };
    
    db.insert_session(&session).map_err(|e| e.to_string())?;
    Ok(session)
}

#[tauri::command]
async fn cmd_update_session_status(
    id: String,
    status: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let status_enum = SessionStatus::from_str(&status)
        .map_err(|e| e.to_string())?;
    
    db.update_session_status(&id, &status_enum).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db = match Database::new() {
        Ok(db) => db,
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            std::process::exit(1);
        }
    };
    
    let app_state = AppState {
        db: Mutex::new(db),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            cmd_list_sessions,
            cmd_create_session,
            cmd_update_session_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_session_creation() {
        let session = Session {
            id: "test_id_123".to_string(),
            title: "Test Session".to_string(),
            course: "Computer Science".to_string(),
            created_at: 1234567890,
            duration_ms: 0,
            status: SessionStatus::Draft,
            notes_path: None,
            audio_path: None,
            transcript_path: None,
        };

        assert_eq!(session.title, "Test Session");
        assert_eq!(session.course, "Computer Science");
        assert_eq!(session.status.as_str(), "draft");
    }

    #[test]
    fn test_status_parsing() {
        assert_eq!(SessionStatus::from_str("draft").unwrap(), SessionStatus::Draft);
        assert_eq!(SessionStatus::from_str("recording").unwrap(), SessionStatus::Recording);
        assert_eq!(SessionStatus::from_str("complete").unwrap(), SessionStatus::Complete);
        
        // Test invalid status
        assert!(SessionStatus::from_str("invalid").is_err());
    }

    #[test]
    fn test_status_string_conversion() {
        assert_eq!(SessionStatus::Draft.as_str(), "draft");
        assert_eq!(SessionStatus::Recording.as_str(), "recording");
        assert_eq!(SessionStatus::Complete.as_str(), "complete");
    }
}
