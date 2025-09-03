pub mod db;
pub mod models;

use crate::db::{Database, create_session_folder};
use crate::models::{Session, SessionStatus, TranscriptLine};
use anyhow::Result;
use std::sync::Mutex;
use std::str::FromStr;
use std::fs::{File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use tauri::State;
use nanoid::nanoid;

// Database state
pub struct AppState {
    db: Mutex<Database>,
}

// Helper function to get session directory
fn get_session_dir(session_id: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    Ok(home.join(".polka").join("data").join("sessions").join(session_id))
}

// Helper function to get full path for session file
fn get_session_file_path(session_id: &str, filename: &str) -> Result<PathBuf, String> {
    let session_dir = get_session_dir(session_id)?;
    Ok(session_dir.join(filename))
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    println!("🔧 greet command called with name: {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn test_backend() -> String {
    println!("🔧 test_backend command called - backend is working!");
    "Backend is working!".to_string()
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
    
    let session_id = nanoid!();
    
    // Create session folder and set file paths
    let _session_dir = create_session_folder(&session_id).map_err(|e| e.to_string())?;
    
    let session = Session {
        id: session_id,
        title,
        course,
        created_at: time::OffsetDateTime::now_utc().unix_timestamp(),
        duration_ms: 0,
        status: SessionStatus::Draft,
        notes_path: Some("notes.md".to_string()),
        audio_path: Some("audio.wav".to_string()),
        transcript_path: Some("transcript.jsonl".to_string()),
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

#[tauri::command]
async fn cmd_append_transcript_line(
    id: String,
    t_ms: u64,
    speaker: String,
    text: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("🔧 cmd_append_transcript_line called with id: {}, t_ms: {}, speaker: {}, text: {}", id, t_ms, speaker, text);
    
    let db = state.db.lock().map_err(|e| {
        println!("❌ Failed to lock database: {}", e);
        e.to_string()
    })?;
    
    // Get session to ensure it exists and get transcript path
    let session = db.get_session(&id).map_err(|e| {
        println!("❌ Failed to get session: {}", e);
        e.to_string()
    })?.ok_or_else(|| {
        println!("❌ Session not found: {}", id);
        "Session not found".to_string()
    })?;
    
    println!("✅ Found session: {:?}", session);
    
    let transcript_path = session.transcript_path
        .unwrap_or_else(|| "transcript.jsonl".to_string()); // Default if missing
    
    println!("📄 Using transcript path: {}", transcript_path);
    
    let full_path = get_session_file_path(&id, &transcript_path).map_err(|e| {
        println!("❌ Failed to get session file path: {}", e);
        e
    })?;
    
    println!("📁 Full file path: {:?}", full_path);
    
    // Ensure session directory exists
    if let Some(parent) = full_path.parent() {
        println!("📁 Creating directory: {:?}", parent);
        std::fs::create_dir_all(parent)
            .map_err(|e| {
                println!("❌ Failed to create session directory: {}", e);
                format!("Failed to create session directory: {}", e)
            })?;
    }
    
    // Create transcript line
    let transcript_line = TranscriptLine {
        t_ms,
        speaker,
        text,
    };
    
    println!("📝 Created transcript line: {:?}", transcript_line);
    
    // Serialize to JSON and append to file
    let json_line = serde_json::to_string(&transcript_line)
        .map_err(|e| {
            println!("❌ Failed to serialize transcript line: {}", e);
            format!("Failed to serialize transcript line: {}", e)
        })?;
    
    println!("📝 Serialized JSON: {}", json_line);
    
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&full_path)
        .map_err(|e| {
            println!("❌ Failed to open transcript file {:?}: {}", full_path, e);
            format!("Failed to open transcript file: {}", e)
        })?;
    
    println!("📝 Opened file for writing");
    
    writeln!(file, "{}", json_line)
        .map_err(|e| {
            println!("❌ Failed to write to transcript file: {}", e);
            format!("Failed to write to transcript file: {}", e)
        })?;
    
    println!("✅ Successfully wrote transcript line to file");
    Ok(())
}

#[tauri::command]
async fn cmd_read_transcript(
    id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TranscriptLine>, String> {
    println!("🔧 cmd_read_transcript called with id: {}", id);
    
    let db = state.db.lock().map_err(|e| {
        println!("❌ Failed to lock database: {}", e);
        e.to_string()
    })?;
    
    // Get session to ensure it exists and get transcript path
    let session = db.get_session(&id).map_err(|e| e.to_string())?
        .ok_or("Session not found")?;
    
    let transcript_path = session.transcript_path
        .unwrap_or_else(|| "transcript.jsonl".to_string()); // Default if missing
    
    let full_path = get_session_file_path(&id, &transcript_path)?;
    
    // Check if file exists
    if !full_path.exists() {
        return Ok(Vec::new());
    }
    
    let file = File::open(full_path)
        .map_err(|e| format!("Failed to open transcript file: {}", e))?;
    
    let reader = BufReader::new(file);
    let mut transcript_lines = Vec::new();
    
    for line in reader.lines() {
        let line = line.map_err(|e| format!("Failed to read line: {}", e))?;
        if !line.trim().is_empty() {
            let transcript_line: TranscriptLine = serde_json::from_str(&line)
                .map_err(|e| format!("Failed to parse transcript line: {}", e))?;
            transcript_lines.push(transcript_line);
        }
    }
    
    Ok(transcript_lines)
}

#[tauri::command]
async fn cmd_write_notes(
    id: String,
    markdown: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Get session to ensure it exists and get notes path
    let session = db.get_session(&id).map_err(|e| e.to_string())?
        .ok_or("Session not found")?;
    
    let notes_path = session.notes_path
        .unwrap_or_else(|| "notes.md".to_string()); // Default if missing
    
    let full_path = get_session_file_path(&id, &notes_path)?;
    
    // Ensure session directory exists
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create session directory: {}", e))?;
    }
    
    // Write markdown content to file
    std::fs::write(full_path, markdown)
        .map_err(|e| format!("Failed to write notes file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn cmd_read_notes(
    id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Get session to ensure it exists and get notes path
    let session = db.get_session(&id).map_err(|e| e.to_string())?
        .ok_or("Session not found")?;
    
    let notes_path = session.notes_path
        .unwrap_or_else(|| "notes.md".to_string()); // Default if missing
    
    let full_path = get_session_file_path(&id, &notes_path)?;
    
    // Check if file exists
    if !full_path.exists() {
        return Ok(String::new());
    }
    
    // Read markdown content from file
    std::fs::read_to_string(full_path)
        .map_err(|e| format!("Failed to read notes file: {}", e))
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
            test_backend,
            cmd_list_sessions,
            cmd_create_session,
            cmd_update_session_status,
            cmd_append_transcript_line,
            cmd_read_transcript,
            cmd_write_notes,
            cmd_read_notes
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
