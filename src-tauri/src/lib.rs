pub mod db;
pub mod models;
pub mod audio;
pub mod speech;

use crate::db::{Database, create_session_folder, delete_session_folder};
use crate::models::{Session, SessionStatus, TranscriptLine};
use crate::audio::{start_recording_simple, stop_recording_simple, pause_recording_simple, resume_recording_simple};
use crate::speech::{start_speech_processing, stop_speech_processing};
use std::process::{Child, Command};
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
    audio_process: Mutex<Option<Child>>,
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
async fn cmd_delete_session(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("🗑️ cmd_delete_session called for session: {}", id);
    
    let db = state.db.lock().map_err(|e| {
        println!("❌ Failed to lock database: {}", e);
        e.to_string()
    })?;
    
    // First, delete from database
    let deleted = db.delete_session(&id).map_err(|e| {
        println!("❌ Failed to delete session from database: {}", e);
        e.to_string()
    })?;
    
    if !deleted {
        println!("❌ Session not found in database: {}", id);
        return Err("Session not found".to_string());
    }
    
    // Then, delete session folder and all its files
    delete_session_folder(&id).map_err(|e| {
        println!("❌ Failed to delete session folder: {}", e);
        // Don't fail the entire operation if folder deletion fails
        println!("⚠️ Session deleted from database but folder deletion failed");
        e.to_string()
    })?;
    
    println!("✅ Successfully deleted session: {}", id);
    Ok(())
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

#[tauri::command]
async fn cmd_start_recording(
    id: String,
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("🎙️ cmd_start_recording called for session: {}", id);
    
    // Scope the database lock to avoid Send issues
    let session_dir = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        
        // Get session to ensure it exists
        let _session = db.get_session(&id).map_err(|e| e.to_string())?
            .ok_or("Session not found")?;
        
        // Get session directory and ensure it exists
        let session_dir = get_session_dir(&id)?;
        
        // Create the session directory if it doesn't exist (for existing sessions)
        std::fs::create_dir_all(&session_dir)
            .map_err(|e| format!("Failed to create session directory: {}", e))?;
        
        session_dir
    };
    
    // Start recording
    start_recording_simple(id.clone(), session_dir.clone(), app_handle.clone())
        .map_err(|e| format!("Failed to start recording: {}", e))?;
    
    // Start speech processing
    let audio_path = session_dir.join("audio.wav");
    if let Err(e) = start_speech_processing(id.clone(), audio_path, app_handle).await {
        eprintln!("❌ Failed to start speech processing: {}", e);
        // Continue anyway - audio recording will still work
    }
    
    println!("🎙️ Recording started successfully for session: {}", id);
    Ok(())
}

#[tauri::command]
async fn cmd_pause_recording(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("⏸️ cmd_pause_recording called for session: {}", id);
    
    // Scope the database lock to avoid Send issues
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        
        // Get session to ensure it exists
        let _session = db.get_session(&id).map_err(|e| e.to_string())?
            .ok_or("Session not found")?;
    };
    
    // Pause recording
    pause_recording_simple(&id)
        .map_err(|e| format!("Failed to pause recording: {}", e))?;
    
    println!("⏸️ Recording paused successfully for session: {}", id);
    Ok(())
}

#[tauri::command]
async fn cmd_resume_recording(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("▶️ cmd_resume_recording called for session: {}", id);
    
    // Scope the database lock to avoid Send issues
    let session_dir = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        
        // Get session to ensure it exists
        let _session = db.get_session(&id).map_err(|e| e.to_string())?
            .ok_or("Session not found")?;
        
        // Get session directory and ensure it exists
        let session_dir = get_session_dir(&id)?;
        
        // Create the session directory if it doesn't exist (for existing sessions)
        std::fs::create_dir_all(&session_dir)
            .map_err(|e| format!("Failed to create session directory: {}", e))?;
        
        session_dir
    };
    
    // Resume recording
    resume_recording_simple(id.clone(), session_dir)
        .map_err(|e| format!("Failed to resume recording: {}", e))?;
    
    println!("▶️ Recording resumed successfully for session: {}", id);
    Ok(())
}

#[tauri::command]
async fn cmd_get_recording_state(
    id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Get session to ensure it exists
    let _session = db.get_session(&id).map_err(|e| e.to_string())?
        .ok_or("Session not found")?;
    
    let is_recording = crate::audio::is_recording(&id);
    let is_paused = crate::audio::is_paused(&id);
    
    Ok(serde_json::json!({
        "is_recording": is_recording,
        "is_paused": is_paused
    }))
}

#[tauri::command]
async fn cmd_stop_recording(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("🎙️ cmd_stop_recording called for session: {}", id);
    
    // Scope the database lock to avoid Send issues
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        
        // Get session to ensure it exists
        let _session = db.get_session(&id).map_err(|e| e.to_string())?
            .ok_or("Session not found")?;
        
        // Get session directory and ensure it exists
        let session_dir = get_session_dir(&id)?;
        
        // Create the session directory if it doesn't exist (for existing sessions)
        std::fs::create_dir_all(&session_dir)
            .map_err(|e| format!("Failed to create session directory: {}", e))?;
    };
    
    // Stop recording
    stop_recording_simple(&id)
        .map_err(|e| format!("Failed to stop recording: {}", e))?;
    
    // Stop speech processing
    if let Err(e) = stop_speech_processing(&id) {
        eprintln!("❌ Failed to stop speech processing: {}", e);
        // Continue anyway - audio recording was stopped
    }
    
    println!("🎙️ Recording stopped successfully for session: {}", id);
    Ok(())
}

#[tauri::command]
async fn cmd_stop_audio(
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("🔊 cmd_stop_audio called");
    
    let mut audio_process = state.audio_process.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = audio_process.take() {
        match child.kill() {
            Ok(_) => {
                let _ = child.wait();
                println!("🔊 Audio playback stopped");
                Ok(())
            }
            Err(e) => Err(format!("Failed to stop audio: {}", e))
        }
    } else {
        Err("No audio is currently playing".to_string())
    }
}

#[tauri::command]
async fn cmd_get_audio_duration(
    id: String,
    state: State<'_, AppState>,
) -> Result<f64, String> {
    println!("🔊 cmd_get_audio_duration called for session: {}", id);
    
    // Scope the database lock to avoid Send issues
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        
        // Get session to ensure it exists
        let _session = db.get_session(&id).map_err(|e| e.to_string())?
            .ok_or("Session not found")?;
    };
    
    // Get the audio file path
    let audio_path = get_session_file_path(&id, "audio.wav")?;
    
    // Check if audio file exists
    if !audio_path.exists() {
        return Err("No audio recording found for this session".to_string());
    }
    
    // Get audio duration using afinfo (macOS built-in tool)
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("afinfo")
            .arg(&audio_path)
            .output();
            
        match output {
            Ok(result) => {
                let output_str = String::from_utf8_lossy(&result.stdout);
                
                // Parse duration from afinfo output
                // Look for "estimated duration: X.X seconds"
                for line in output_str.lines() {
                    if line.contains("estimated duration:") {
                        if let Some(duration_part) = line.split("estimated duration:").nth(1) {
                            if let Some(duration_str) = duration_part.trim().split_whitespace().next() {
                                if let Ok(duration) = duration_str.parse::<f64>() {
                                    println!("🔊 Audio duration: {} seconds", duration);
                                    return Ok(duration);
                                }
                            }
                        }
                    }
                }
                
                // Fallback: estimate from file size (rough approximation)
                let file_size = std::fs::metadata(&audio_path)
                    .map_err(|e| format!("Failed to get file metadata: {}", e))?
                    .len();
                
                // Rough estimate: 44100 Hz * 2 bytes * 1 channel = 88200 bytes per second
                let estimated_duration = file_size as f64 / 88200.0;
                println!("🔊 Estimated audio duration from file size: {} seconds", estimated_duration);
                Ok(estimated_duration)
            }
            Err(e) => {
                Err(format!("Failed to get audio duration: {}", e))
            }
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        // Fallback for other platforms - estimate from file size
        let file_size = std::fs::metadata(&audio_path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?
            .len();
        
        // Rough estimate: 44100 Hz * 2 bytes * 1 channel = 88200 bytes per second
        let estimated_duration = file_size as f64 / 88200.0;
        println!("🔊 Estimated audio duration from file size: {} seconds", estimated_duration);
        Ok(estimated_duration)
    }
}

#[tauri::command]
async fn cmd_play_audio(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("🔊 cmd_play_audio called for session: {}", id);
    
    // Check if currently recording
    if crate::audio::is_recording(&id) {
        return Err("Cannot play audio while recording is in progress. Please stop or pause the recording first.".to_string());
    }
    
    // Scope the database lock to avoid Send issues
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        
        // Get session to ensure it exists
        let _session = db.get_session(&id).map_err(|e| e.to_string())?
            .ok_or("Session not found")?;
    };
    
    // Get the audio file path
    let audio_path = get_session_file_path(&id, "audio.wav")?;
    
    // Check if audio file exists
    if !audio_path.exists() {
        return Err("No audio recording found for this session".to_string());
    }
    
    // Stop any currently playing audio
    {
        let mut audio_process = state.audio_process.lock().map_err(|e| e.to_string())?;
        if let Some(mut child) = audio_process.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    // Play the audio file using system command
    #[cfg(target_os = "macos")]
    {
        let child = Command::new("afplay")
            .arg(&audio_path)
            .spawn()
            .map_err(|e| format!("Failed to start audio playback: {}", e))?;
            
        // Store the process so we can stop it later
        {
            let mut audio_process = state.audio_process.lock().map_err(|e| e.to_string())?;
            *audio_process = Some(child);
        }
        
        println!("🔊 Started playing audio file: {:?}", audio_path);
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        // For other platforms, we could use different commands
        // For now, just open the file with the default application
        use std::process::Command;
        
        let output = Command::new("open")
            .arg(&audio_path)
            .spawn();
            
        match output {
            Ok(_) => {
                println!("🔊 Opened audio file: {:?}", audio_path);
                Ok(())
            }
            Err(e) => {
                Err(format!("Failed to open audio: {}", e))
            }
        }
    }
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
        audio_process: Mutex::new(None),
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
            cmd_delete_session,
            cmd_append_transcript_line,
            cmd_read_transcript,
            cmd_write_notes,
            cmd_read_notes,
            cmd_start_recording,
            cmd_pause_recording,
            cmd_resume_recording,
            cmd_get_recording_state,
            cmd_stop_recording,
            cmd_play_audio,
            cmd_stop_audio,
            cmd_get_audio_duration
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
        assert_eq!(SessionStatus::from_str("complete").unwrap(), SessionStatus::Complete);
        
        // Test invalid status
        assert!(SessionStatus::from_str("invalid").is_err());
    }

    #[test]
    fn test_status_string_conversion() {
        assert_eq!(SessionStatus::Draft.as_str(), "draft");
        assert_eq!(SessionStatus::Complete.as_str(), "complete");
    }
}
