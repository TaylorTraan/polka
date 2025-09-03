use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::collections::HashMap;
use tokio::time::{interval, Duration};
use tauri::{AppHandle, Emitter};
use once_cell::sync::Lazy;

// Global speech recognition state
static SPEECH_PROCESSING: Lazy<Mutex<HashMap<String, Arc<AtomicBool>>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

// Mock speech recognition data - realistic phrases that would be spoken
static MOCK_SPEECH_PHRASES: &[&str] = &[
    "Today we're going to discuss the fundamentals of machine learning.",
    "The key concept here is that data drives the model's understanding.",
    "Let me explain this algorithm step by step.",
    "This approach has several advantages over traditional methods.",
    "We can see from the results that the performance has improved significantly.",
    "The next topic we need to cover is neural network architecture.",
    "This implementation allows for better scalability and maintainability.",
    "There are some important considerations when choosing this framework.",
    "The data shows a clear pattern that we should investigate further.",
    "In conclusion, this methodology provides robust and reliable results.",
];

pub fn is_speech_processing(session_id: &str) -> bool {
    if let Ok(processing_map) = SPEECH_PROCESSING.lock() {
        if let Some(flag) = processing_map.get(session_id) {
            return flag.load(Ordering::Relaxed);
        }
    }
    false
}

pub async fn start_speech_processing(
    session_id: String,
    _audio_path: PathBuf,
    app_handle: AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("🎤 Starting intelligent mock speech processing for session: {}", session_id);
    
    // Create and store processing flag
    let is_processing = Arc::new(AtomicBool::new(true));
    {
        let mut processing_map = SPEECH_PROCESSING.lock().unwrap();
        processing_map.insert(session_id.clone(), Arc::clone(&is_processing));
    }
    
    // Spawn background task that generates more realistic transcription
    let session_id_clone = session_id.clone();
    let app_handle_clone = app_handle.clone();
    
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_millis(500)); // Check every 500ms
        let mut phrase_index = 0;
        let mut current_phrase_progress = 0;
        let mut words_in_current_phrase = Vec::new();
        let mut last_emission_time = std::time::Instant::now();
        
        // Wait a bit before starting
        tokio::time::sleep(Duration::from_secs(1)).await;
        
        while is_speech_processing(&session_id_clone) {
            interval.tick().await;
            
            // Get current phrase and split into words
            if words_in_current_phrase.is_empty() {
                let phrase = MOCK_SPEECH_PHRASES[phrase_index % MOCK_SPEECH_PHRASES.len()];
                words_in_current_phrase = phrase.split_whitespace()
                    .map(|s| s.to_string())
                    .collect();
                current_phrase_progress = 0;
                phrase_index += 1;
            }
            
            // Check if enough time has passed (simulate natural speech pace)
            let time_since_last = last_emission_time.elapsed();
            let should_emit = time_since_last >= Duration::from_millis(800 + (rand::random::<u64>() % 400));
            
            if should_emit && current_phrase_progress < words_in_current_phrase.len() {
                // Emit partial phrase (words spoken so far)
                let words_so_far = &words_in_current_phrase[0..=current_phrase_progress];
                let partial_text = words_so_far.join(" ");
                
                // Only emit if we have a meaningful chunk (2+ words or end of phrase)
                if words_so_far.len() >= 2 || current_phrase_progress == words_in_current_phrase.len() - 1 {
                    let _ = app_handle_clone.emit("polka://transcript-line", serde_json::json!({
                        "session_id": session_id_clone,
                        "text": partial_text,
                        "timestamp": chrono::Utc::now().timestamp_millis()
                    }));
                    
                    println!("🎤 Transcribed: {}", partial_text);
                    last_emission_time = std::time::Instant::now();
                }
                
                current_phrase_progress += 1;
                
                // If we've finished the current phrase, clear it
                if current_phrase_progress >= words_in_current_phrase.len() {
                    words_in_current_phrase.clear();
                    // Add a pause between phrases
                    tokio::time::sleep(Duration::from_millis(1500)).await;
                }
            }
        }
        
        println!("🎤 Intelligent mock speech processing stopped for session: {}", session_id_clone);
    });
    
    Ok(())
}

// Simple random number generation for timing variation
mod rand {
    use std::sync::atomic::{AtomicU64, Ordering};
    static SEED: AtomicU64 = AtomicU64::new(1);
    
    pub fn random<T>() -> T 
    where 
        T: From<u64>
    {
        let seed = SEED.load(Ordering::Relaxed);
        let next = seed.wrapping_mul(1103515245).wrapping_add(12345);
        SEED.store(next, Ordering::Relaxed);
        T::from(next)
    }
}

pub fn stop_speech_processing(session_id: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("🎤 Stopping mock speech processing for session: {}", session_id);
    
    // Set processing flag to false
    if let Ok(processing_map) = SPEECH_PROCESSING.lock() {
        if let Some(flag) = processing_map.get(session_id) {
            flag.store(false, Ordering::Relaxed);
        }
    }
    
    Ok(())
}

pub fn cleanup_speech_context(session_id: &str) {
    // Remove from global state
    {
        let mut processing_map = SPEECH_PROCESSING.lock().unwrap();
        processing_map.remove(session_id);
    }
    
    println!("🎤 Cleaned up mock speech context for session: {}", session_id);
}
