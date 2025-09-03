use anyhow::{Result, anyhow};
use cpal::{StreamConfig, SampleRate};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use hound::{WavWriter, WavSpec};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::io::BufWriter;
use std::fs::File;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use tokio::time::{interval, Duration};
use std::collections::HashMap;
use once_cell::sync::Lazy;

// Simple recorder that doesn't store the stream to avoid Send issues
pub struct AudioRecorder {
    session_id: String,
    output_path: PathBuf,
    is_recording: Arc<AtomicBool>,
}

impl AudioRecorder {
    pub fn new(session_id: String, session_dir: PathBuf) -> Result<Self> {
        let output_path = session_dir.join("audio.wav");
        
        Ok(AudioRecorder {
            session_id,
            output_path,
            is_recording: Arc::new(AtomicBool::new(false)),
        })
    }

    pub async fn start_recording(&self, app_handle: AppHandle) -> Result<()> {
        if self.is_recording.load(Ordering::Relaxed) {
            return Err(anyhow!("Already recording"));
        }

        println!("🎙️ Starting audio recording for session: {}", self.session_id);

        // Get the default input device
        let host = cpal::default_host();
        let device = host.default_input_device()
            .ok_or_else(|| anyhow!("No default input device available"))?;

        println!("🎙️ Using audio device: {}", device.name().unwrap_or_default());

        // Get supported configurations and pick the best one
        let mut supported_configs = device.supported_input_configs()
            .map_err(|e| anyhow!("Failed to get supported configs: {}", e))?;
        
        let supported_config = supported_configs
            .find(|config| {
                // Prefer configs that support mono and reasonable sample rates
                config.channels() >= 1 && 
                config.min_sample_rate().0 <= 44100 && 
                config.max_sample_rate().0 >= 16000
            })
            .ok_or_else(|| anyhow!("No suitable audio configuration found"))?;

        println!("🎙️ Using config: channels={}, sample_rate_range={:?}-{:?}", 
                supported_config.channels(),
                supported_config.min_sample_rate(),
                supported_config.max_sample_rate());

            // Use the device's preferred sample rate for best compatibility
    let sample_rate = supported_config.max_sample_rate().0;
    
    println!("🎙️ Selected sample rate: {}Hz (device supports {}-{}Hz)", 
             sample_rate,
             supported_config.min_sample_rate().0,
             supported_config.max_sample_rate().0);

        let config = StreamConfig {
            channels: 1.min(supported_config.channels()), // Mono if possible, otherwise use minimum
            sample_rate: SampleRate(sample_rate),
            buffer_size: cpal::BufferSize::Default,
        };

        println!("🎙️ Final config: channels={}, sample_rate={}", config.channels, config.sample_rate.0);

        // Create WAV writer - always mono since we convert multi-channel to mono
        let spec = WavSpec {
            channels: 1, // Always mono output
            sample_rate: config.sample_rate.0,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let writer = Arc::new(Mutex::new(Some(WavWriter::create(&self.output_path, spec)?)));

        // Set up level monitoring channel
        let (level_tx, mut level_rx) = mpsc::unbounded_channel::<f32>();

        // Spawn task to emit audio level events
        let app_handle_clone = app_handle.clone();
        let session_id_clone = self.session_id.clone();
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_millis(100)); // 10Hz updates
            while let Ok(level) = level_rx.try_recv() {
                interval.tick().await;
                let _ = app_handle_clone.emit("polka://audio-level", serde_json::json!({
                    "session_id": session_id_clone,
                    "level": level
                }));
            }
        });

        // Create the audio stream
        let writer_clone = Arc::clone(&writer);
        let is_recording_clone = Arc::clone(&self.is_recording);
        let channels = config.channels;

        let stream = device.build_input_stream(
            &config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if !is_recording_clone.load(Ordering::Relaxed) {
                    return;
                }

                // Calculate RMS level for VU meter (use all channels for level calculation)
                let rms = calculate_rms(data);
                let _ = level_tx.send(rms);

                // Write audio data to WAV file
                if let Ok(mut writer_guard) = writer_clone.lock() {
                    if let Some(ref mut writer) = *writer_guard {
                        if channels == 1 {
                            // Mono: write samples directly
                            for &sample in data {
                                let sample_i16 = (sample * i16::MAX as f32) as i16;
                                let _ = writer.write_sample(sample_i16);
                            }
                        } else {
                            // Multi-channel: convert to mono by averaging channels
                            for chunk in data.chunks(channels as usize) {
                                let mono_sample: f32 = chunk.iter().sum::<f32>() / chunk.len() as f32;
                                let sample_i16 = (mono_sample * i16::MAX as f32) as i16;
                                let _ = writer.write_sample(sample_i16);
                            }
                        }
                    }
                }
            },
            move |err| {
                eprintln!("🎙️ Audio stream error: {}", err);
            },
            None
        )?;

        // Start the stream and keep it alive by leaking it (simple approach)
        stream.play()?;
        std::mem::forget(stream); // Keep stream alive
        self.is_recording.store(true, Ordering::Relaxed);

        println!("🎙️ Audio recording started successfully");
        Ok(())
    }

    pub async fn stop_recording(&self) -> Result<()> {
        if !self.is_recording.load(Ordering::Relaxed) {
            return Err(anyhow!("Not currently recording"));
        }

        println!("🎙️ Stopping audio recording for session: {}", self.session_id);

        self.is_recording.store(false, Ordering::Relaxed);

        // Note: In this simplified implementation, we leak the stream to avoid Send issues
        // The stream will be cleaned up when the process exits
        // In a production app, you'd want a more sophisticated approach

        println!("🎙️ Audio recording stopped successfully");
        println!("🎙️ Audio file should be saved to: {:?}", self.output_path);
        Ok(())
    }

    pub fn is_recording(&self) -> bool {
        self.is_recording.load(Ordering::Relaxed)
    }
}

fn calculate_rms(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }

    // Calculate RMS with peak detection for more responsive VU meter
    let sum_squares: f32 = samples.iter().map(|&x| x * x).sum();
    let rms = (sum_squares / samples.len() as f32).sqrt();
    
    // Also calculate peak level for responsiveness
    let peak = samples.iter().fold(0.0f32, |acc, &x| acc.max(x.abs()));
    
    // Combine RMS and peak for better voice detection
    let combined_level = (rms * 0.7) + (peak * 0.3);
    
    // Apply noise gate - ignore very quiet signals (likely background noise)
    const NOISE_THRESHOLD: f32 = 0.002; // Slightly higher threshold for cleaner response
    if combined_level < NOISE_THRESHOLD {
        return 0.0;
    }
    
    // Voice-optimized scaling - more responsive to speech patterns
    let voice_scaled = if combined_level > 0.01 {
        // Above speech threshold - use logarithmic scaling
        let db_scale = 20.0 * combined_level.log10().max(-40.0); // Cap at -40dB for voice
        let normalized = (db_scale + 40.0) / 40.0; // Convert -40dB to 0dB range to 0-1
        normalized * 1.5 // Boost for visibility
    } else {
        // Below speech threshold - linear scaling for quiet sounds
        combined_level * 50.0
    };
    
    // Clamp to 0-1 range
    voice_scaled.min(1.0).max(0.0)
}

// Global recording state with WAV writers for proper cleanup
static RECORDING_SESSIONS: Lazy<Mutex<HashMap<String, Arc<AtomicBool>>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

static WAV_WRITERS: Lazy<Mutex<HashMap<String, Arc<Mutex<Option<WavWriter<BufWriter<File>>>>>>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

// Global pause state for sessions
static PAUSED_SESSIONS: Lazy<Mutex<HashMap<String, Arc<AtomicBool>>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

// Store audio segments for appending
static AUDIO_SEGMENTS: Lazy<Mutex<HashMap<String, Vec<PathBuf>>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

// Track segment counter for each session
static SEGMENT_COUNTERS: Lazy<Mutex<HashMap<String, usize>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

pub fn is_recording(session_id: &str) -> bool {
    let sessions = RECORDING_SESSIONS.lock().unwrap();
    if let Some(flag) = sessions.get(session_id) {
        flag.load(Ordering::Relaxed)
    } else {
        false
    }
}

pub fn is_paused(session_id: &str) -> bool {
    let paused = PAUSED_SESSIONS.lock().unwrap();
    if let Some(flag) = paused.get(session_id) {
        flag.load(Ordering::Relaxed)
    } else {
        false
    }
}

pub fn start_recording_simple(session_id: String, session_dir: PathBuf, app_handle: AppHandle) -> Result<()> {
    // Check if already recording
    if is_recording(&session_id) {
        return Err(anyhow!("Already recording"));
    }

    // Create a temporary segment file for this recording session
    let segment_number = {
        let mut counters = SEGMENT_COUNTERS.lock().unwrap();
        let counter = counters.entry(session_id.clone()).or_insert(0);
        let current = *counter;
        *counter += 1;
        current
    };
    
    let segment_path = session_dir.join(format!("audio_segment_{}.wav", segment_number));
    println!("🎙️ Creating segment file: {:?}", segment_path);
    
    println!("🎙️ Starting audio recording for session: {}", session_id);

    // Get the default input device
    let host = cpal::default_host();
    println!("🎙️ Audio host: {}", host.id().name());
    
    let device = host.default_input_device()
        .ok_or_else(|| anyhow!("No default input device available. Please check microphone permissions in System Preferences > Security & Privacy > Privacy > Microphone"))?;

    let device_name = device.name().unwrap_or_else(|_| "Unknown Device".to_string());
    println!("🎙️ Using audio device: {}", device_name);

    // Get supported configurations and pick the best one
    let mut supported_configs = device.supported_input_configs()
        .map_err(|e| anyhow!("Failed to get supported configs: {}", e))?;
    
    let supported_config = supported_configs
        .find(|config| {
            // Prefer configs that support mono and reasonable sample rates
            config.channels() >= 1 && 
            config.min_sample_rate().0 <= 44100 && 
            config.max_sample_rate().0 >= 16000
        })
        .ok_or_else(|| anyhow!("No suitable audio configuration found"))?;

    // Use a sample rate that the device supports, prefer 16kHz if available
    let sample_rate = if supported_config.min_sample_rate().0 <= 16000 && 
                         supported_config.max_sample_rate().0 >= 16000 {
        16000
    } else {
        supported_config.min_sample_rate().0
    };

    let config = StreamConfig {
        channels: 1.min(supported_config.channels()),
        sample_rate: SampleRate(sample_rate),
        buffer_size: cpal::BufferSize::Default,
    };

    // Create WAV writer - always mono since we convert multi-channel to mono
    let spec = WavSpec {
        channels: 1,
        sample_rate: config.sample_rate.0,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    // Create WAV writer with BufWriter for better performance - write to segment file
    let file = File::create(&segment_path)?;
    let buf_writer = BufWriter::new(file);
    let wav_writer = WavWriter::new(buf_writer, spec)?;
    let writer = Arc::new(Mutex::new(Some(wav_writer)));

    // Set up recording flag and pause state
    let recording_flag = Arc::new(AtomicBool::new(true));
    let pause_flag = Arc::new(AtomicBool::new(false));
    {
        let mut sessions = RECORDING_SESSIONS.lock().unwrap();
        sessions.insert(session_id.clone(), Arc::clone(&recording_flag));
        
        let mut paused = PAUSED_SESSIONS.lock().unwrap();
        paused.insert(session_id.clone(), Arc::clone(&pause_flag));
        
        // Store the writer for proper cleanup
        let mut writers = WAV_WRITERS.lock().unwrap();
        writers.insert(session_id.clone(), Arc::clone(&writer));
        
        // Add the segment path to the segments list
        let mut segments = AUDIO_SEGMENTS.lock().unwrap();
        let session_segments = segments.entry(session_id.clone()).or_insert_with(Vec::new);
        session_segments.push(segment_path.clone());
    }

    // Set up level monitoring channel
    let (level_tx, mut level_rx) = mpsc::unbounded_channel::<f32>();

    // Spawn task to emit audio level events with better timing
    let app_handle_clone = app_handle.clone();
    let session_id_clone = session_id.clone();
    let recording_flag_clone = Arc::clone(&recording_flag);
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_millis(50)); // 20Hz updates for smoother VU meter
        let mut last_level = 0.0f32;
        let mut level_buffer = Vec::with_capacity(4); // Buffer for smoothing
        
        while recording_flag_clone.load(Ordering::Relaxed) {
            interval.tick().await;
            
            // Collect multiple level readings if available
            let mut current_levels = Vec::new();
            while let Ok(level) = level_rx.try_recv() {
                current_levels.push(level);
            }
            
            if !current_levels.is_empty() {
                // Use the maximum level from recent readings for responsiveness
                let max_level = current_levels.iter().fold(0.0f32, |a, &b| a.max(b));
                
                // Add to buffer for smoothing
                level_buffer.push(max_level);
                if level_buffer.len() > 4 {
                    level_buffer.remove(0);
                }
                
                // Calculate smoothed level (weighted average favoring recent values)
                let smoothed_level = if level_buffer.len() == 1 {
                    level_buffer[0]
                } else {
                    let mut weighted_sum = 0.0f32;
                    let mut weight_sum = 0.0f32;
                    for (i, &level) in level_buffer.iter().enumerate() {
                        let weight = (i + 1) as f32; // Recent values have higher weight
                        weighted_sum += level * weight;
                        weight_sum += weight;
                    }
                    weighted_sum / weight_sum
                };
                
                last_level = smoothed_level;
            }
            
            // Always emit the current level (even if it's the same) for consistent updates
            let _ = app_handle_clone.emit("polka://audio-level", serde_json::json!({
                "session_id": session_id_clone,
                "level": last_level
            }));
            
            // Decay the level gradually when no new audio
            if current_levels.is_empty() && last_level > 0.0 {
                last_level *= 0.85; // Gradual decay
                if last_level < 0.01 {
                    last_level = 0.0;
                }
            }
        }
    });

    // Create the audio stream
    let writer_clone = Arc::clone(&writer);
    let recording_flag_clone2 = Arc::clone(&recording_flag);
    let pause_flag_clone = Arc::clone(&pause_flag);
    let channels = config.channels;

    let stream = device.build_input_stream(
        &config,
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            if !recording_flag_clone2.load(Ordering::Relaxed) {
                return;
            }

            // Calculate RMS level for VU meter (always calculate for UI feedback)
            let rms = calculate_rms(data);
            let _ = level_tx.send(rms);

            // Only write audio data if not paused
            if !pause_flag_clone.load(Ordering::Relaxed) {
                // Write audio data to WAV file
                if let Ok(mut writer_guard) = writer_clone.lock() {
                    if let Some(ref mut writer) = *writer_guard {
                        if channels == 1 {
                            // Mono: write samples directly
                            for &sample in data {
                                let sample_i16 = (sample * i16::MAX as f32) as i16;
                                if let Err(e) = writer.write_sample(sample_i16) {
                                    eprintln!("🎙️ Error writing sample: {}", e);
                                }
                            }
                        } else {
                            // Multi-channel: convert to mono by averaging channels
                            for chunk in data.chunks(channels as usize) {
                                let mono_sample: f32 = chunk.iter().sum::<f32>() / chunk.len() as f32;
                                let sample_i16 = (mono_sample * i16::MAX as f32) as i16;
                                if let Err(e) = writer.write_sample(sample_i16) {
                                    eprintln!("🎙️ Error writing sample: {}", e);
                                }
                            }
                        }
                    } else {
                        eprintln!("🎙️ Warning: Writer is None in audio callback");
                    }
                } else {
                    eprintln!("🎙️ Warning: Could not lock writer in audio callback");
                }
            }
        },
        move |err| {
            eprintln!("🎙️ Audio stream error: {}", err);
        },
        None
    )?;

    // Start the stream and keep it alive by leaking it
    stream.play()?;
    std::mem::forget(stream);

    println!("🎙️ Audio recording started successfully");
    Ok(())
}

pub fn pause_recording_simple(session_id: &str) -> Result<()> {
    println!("⏸️ Pausing audio recording for session: {}", session_id);
    
    // Check if currently recording
    if !is_recording(session_id) {
        return Err(anyhow!("Not currently recording"));
    }
    
    // Set pause flag
    let paused = PAUSED_SESSIONS.lock().unwrap();
    if let Some(pause_flag) = paused.get(session_id) {
        pause_flag.store(true, Ordering::Relaxed);
        
        // Give a moment for any pending writes to complete
        std::thread::sleep(std::time::Duration::from_millis(100));
        
        // Finalize current segment but keep writer reference for stream callback
        let writer_arc = {
            let writers = WAV_WRITERS.lock().unwrap();
            writers.get(session_id).cloned()
        };
        
        if let Some(writer_arc) = writer_arc {
            if let Ok(mut writer_guard) = writer_arc.lock() {
                if let Some(wav_writer) = writer_guard.take() {
                    match wav_writer.finalize() {
                        Ok(_) => {
                            println!("⏸️ Current segment finalized successfully");
                            
                            // Add a small delay to ensure file is fully written
                            std::thread::sleep(std::time::Duration::from_millis(50));
                            
                            // Immediately append this segment to the main audio file
                            if let Err(e) = append_current_segment_to_main(session_id) {
                                println!("⚠️ Warning: Failed to append segment to main file: {}", e);
                            }
                        },
                        Err(e) => println!("⚠️ Warning: Failed to finalize current segment: {}", e),
                    }
                }
                // Keep the writer_guard but with None content - this prevents stream callback from writing
            }
        }
        
        println!("⏸️ Audio recording paused successfully");
        Ok(())
    } else {
        Err(anyhow!("Session not found"))
    }
}

pub fn resume_recording_simple(session_id: String, session_dir: PathBuf) -> Result<()> {
    println!("▶️ Resuming audio recording for session: {}", session_id);
    
    // Check if currently recording and paused
    if !is_recording(&session_id) {
        return Err(anyhow!("Not currently recording"));
    }
    
    if !is_paused(&session_id) {
        return Err(anyhow!("Recording is not paused"));
    }
    
    // Create a new segment file
    let segment_number = {
        let mut counters = SEGMENT_COUNTERS.lock().unwrap();
        if let Some(counter) = counters.get_mut(&session_id) {
            let current = *counter;
            *counter += 1;
            current
        } else {
            return Err(anyhow!("No segment counter found for session"));
        }
    };
    
    let segment_path = session_dir.join(format!("audio_segment_{}.wav", segment_number));
    println!("▶️ Creating new segment file: {:?}", segment_path);
    
    // Create new WAV writer for the new segment with consistent format
    // Get the sample rate from the main audio file if it exists, otherwise use 16kHz
    let spec = {
        let main_audio_path = session_dir.join("audio.wav");
        if main_audio_path.exists() {
            // Read spec from existing main file to ensure consistency
            match hound::WavReader::open(&main_audio_path) {
                Ok(reader) => {
                    let existing_spec = reader.spec();
                    println!("▶️ Using existing main file spec: channels={}, sample_rate={}, bits={}", 
                            existing_spec.channels, existing_spec.sample_rate, existing_spec.bits_per_sample);
                    existing_spec
                },
                Err(_) => {
                    println!("▶️ Could not read main file spec, using default");
                    WavSpec {
                        channels: 1,
                        sample_rate: 16000,
                        bits_per_sample: 16,
                        sample_format: hound::SampleFormat::Int,
                    }
                }
            }
        } else {
            println!("▶️ No main file exists, using default spec");
            WavSpec {
                channels: 1,
                sample_rate: 16000,
                bits_per_sample: 16,
                sample_format: hound::SampleFormat::Int,
            }
        }
    };
    
    let file = File::create(&segment_path)?;
    let buf_writer = BufWriter::new(file);
    let wav_writer = WavWriter::new(buf_writer, spec)?;
    let writer = Arc::new(Mutex::new(Some(wav_writer)));
    
    // Update the writer - replace the existing one or insert new one
    {
        let mut writers = WAV_WRITERS.lock().unwrap();
        if let Some(existing_writer_arc) = writers.get(&session_id) {
            // Replace the content of existing writer
            if let Ok(mut existing_guard) = existing_writer_arc.lock() {
                let new_wav_writer = {
                    let file = File::create(&segment_path)?;
                    let buf_writer = BufWriter::new(file);
                    WavWriter::new(buf_writer, spec)?
                };
                *existing_guard = Some(new_wav_writer);
                println!("▶️ Replaced existing writer with new segment writer");
            }
        } else {
            // Insert new writer if none exists
            writers.insert(session_id.clone(), writer);
            println!("▶️ Inserted new writer for session");
        }
        
        // Add new segment to the list
        let mut segments = AUDIO_SEGMENTS.lock().unwrap();
        let session_segments = segments.entry(session_id.clone()).or_insert_with(Vec::new);
        session_segments.push(segment_path.clone());
    }
    
    // Clear pause flag
    let paused = PAUSED_SESSIONS.lock().unwrap();
    if let Some(pause_flag) = paused.get(&session_id) {
        pause_flag.store(false, Ordering::Relaxed);
        println!("▶️ Audio recording resumed successfully");
        Ok(())
    } else {
        Err(anyhow!("Session not found"))
    }
}

pub fn stop_recording_simple(session_id: &str) -> Result<()> {
    println!("🎙️ Stopping audio recording for session: {}", session_id);
    
    // Stop the recording flag first
    let recording_flag = {
        let mut sessions = RECORDING_SESSIONS.lock().unwrap();
        sessions.remove(session_id)
    };
    
    // Remove pause flag and segment counter
    {
        let mut paused = PAUSED_SESSIONS.lock().unwrap();
        paused.remove(session_id);
        
        let mut counters = SEGMENT_COUNTERS.lock().unwrap();
        counters.remove(session_id);
    }
    
    if let Some(flag) = recording_flag {
        flag.store(false, Ordering::Relaxed);
        
        // Give a moment for any pending writes to complete
        std::thread::sleep(std::time::Duration::from_millis(100));
        
        // Properly finalize the current segment WAV file
        let writer = {
            let mut writers = WAV_WRITERS.lock().unwrap();
            writers.remove(session_id)
        };
        
        if let Some(writer_arc) = writer {
            if let Ok(mut writer_guard) = writer_arc.lock() {
                if let Some(wav_writer) = writer_guard.take() {
                    match wav_writer.finalize() {
                        Ok(_) => {
                            println!("🎙️ Final segment finalized successfully");
                            
                            // Append final segment to main audio file
                            if let Err(e) = append_current_segment_to_main(session_id) {
                                println!("⚠️ Warning: Failed to append final segment: {}", e);
                            }
                        },
                        Err(e) => println!("⚠️ Warning: Failed to finalize final segment: {}", e),
                    }
                }
            }
        }
        
        // Clean up any remaining segments
        if let Err(e) = combine_audio_segments(session_id) {
            println!("⚠️ Warning: Failed to finalize audio segments: {}", e);
            // Continue anyway - main audio file should be available
        }
        
        println!("🎙️ Audio recording stopped successfully");
        Ok(())
    } else {
        Err(anyhow!("Not currently recording"))
    }
}

fn append_current_segment_to_main(session_id: &str) -> Result<()> {
    println!("🔗 Appending current segment to main audio file for session: {}", session_id);
    
    // Get the most recent segment and remove it from tracking
    let current_segment_path = {
        let mut segments = AUDIO_SEGMENTS.lock().unwrap();
        if let Some(session_segments) = segments.get_mut(session_id) {
            if session_segments.is_empty() {
                println!("🔗 No segments found in tracking list");
                return Err(anyhow!("No segments found"));
            }
            println!("🔗 Found {} segments in tracking list", session_segments.len());
            // Remove and return the last segment
            let segment = session_segments.pop().unwrap();
            println!("🔗 Removed segment from tracking: {:?}", segment);
            segment
        } else {
            println!("🔗 Session not found in segments tracking");
            return Err(anyhow!("Session not found"));
        }
    };
    
    println!("🔗 Processing segment: {:?}", current_segment_path);
    let main_audio_path = current_segment_path.parent().unwrap().join("audio.wav");
    
    // Verify segment file exists and has content
    if !current_segment_path.exists() {
        println!("🔗 ERROR: Segment file does not exist: {:?}", current_segment_path);
        return Err(anyhow!("Segment file does not exist"));
    }
    
    let segment_size = std::fs::metadata(&current_segment_path)?.len();
    println!("🔗 Segment file size: {} bytes", segment_size);
    
    if segment_size == 0 {
        println!("🔗 ERROR: Segment file is empty");
        return Err(anyhow!("Segment file is empty"));
    }
    
    // Check if main audio file already exists
    if main_audio_path.exists() {
        println!("🔗 Appending to existing main audio file");
        
        // Read existing main file
        let mut main_reader = hound::WavReader::open(&main_audio_path)?;
        let spec = main_reader.spec();
        let main_samples: Result<Vec<i16>, _> = main_reader.samples().collect();
        let main_samples = main_samples?;
        
        // Read current segment
        let mut segment_reader = hound::WavReader::open(&current_segment_path)?;
        let segment_spec = segment_reader.spec();
        
        // Log specs for debugging
        println!("🔗 Main file spec: channels={}, sample_rate={}, bits={}", 
                spec.channels, spec.sample_rate, spec.bits_per_sample);
        println!("🔗 Segment spec: channels={}, sample_rate={}, bits={}", 
                segment_spec.channels, segment_spec.sample_rate, segment_spec.bits_per_sample);
        
        if segment_spec != spec {
            println!("⚠️ Warning: Segment spec mismatch with main file, but continuing");
        }
        
        let segment_samples: Result<Vec<i16>, _> = segment_reader.samples().collect();
        let segment_samples = segment_samples?;
        
        println!("🔗 Main file samples: {}, Segment samples: {}", main_samples.len(), segment_samples.len());
        
        // Create temporary file for the combined audio
        let temp_path = main_audio_path.with_extension("temp.wav");
        let mut writer = hound::WavWriter::create(&temp_path, spec)?;
        
        // Write main audio samples first
        for sample in main_samples {
            writer.write_sample(sample)?;
        }
        
        // Then append segment samples
        for sample in segment_samples {
            writer.write_sample(sample)?;
        }
        
        writer.finalize()?;
        
        // Replace main file with combined file
        std::fs::rename(&temp_path, &main_audio_path)?;
        
        println!("🔗 Successfully appended segment to main audio file");
    } else {
        println!("🔗 Creating new main audio file from first segment");
        // No main file exists, just rename the segment to be the main file
        std::fs::rename(&current_segment_path, &main_audio_path)?;
        println!("🔗 First segment became the main audio file");
    }
    
    // Remove the segment file if it still exists (only if we copied it)
    if current_segment_path.exists() {
        if let Err(e) = std::fs::remove_file(&current_segment_path) {
            println!("⚠️ Warning: Failed to remove segment file {:?}: {}", current_segment_path, e);
        } else {
            println!("🔗 Cleaned up segment file: {:?}", current_segment_path);
        }
    }
    
    Ok(())
}

fn combine_audio_segments(session_id: &str) -> Result<()> {
    println!("🔗 Finalizing audio segments for session: {}", session_id);
    
    // Get remaining segments
    let segments = {
        let mut segments_map = AUDIO_SEGMENTS.lock().unwrap();
        segments_map.remove(session_id).unwrap_or_default()
    };
    
    // If there are any remaining segments, append the final one
    if let Some(last_segment) = segments.last() {
        let main_audio_path = last_segment.parent().unwrap().join("audio.wav");
        
        if !main_audio_path.exists() {
            // If main file doesn't exist, just rename the last segment
            std::fs::rename(last_segment, &main_audio_path)?;
            println!("🔗 Final segment became the main audio file");
        } else {
            // Append the final segment to main file
            let mut main_reader = hound::WavReader::open(&main_audio_path)?;
            let spec = main_reader.spec();
            let main_samples: Result<Vec<i16>, _> = main_reader.samples().collect();
            let main_samples = main_samples?;
            
            let mut segment_reader = hound::WavReader::open(last_segment)?;
            let segment_samples: Result<Vec<i16>, _> = segment_reader.samples().collect();
            let segment_samples = segment_samples?;
            
            let temp_path = main_audio_path.with_extension("temp.wav");
            let mut writer = hound::WavWriter::create(&temp_path, spec)?;
            
            // Write all samples
            for sample in main_samples {
                writer.write_sample(sample)?;
            }
            for sample in segment_samples {
                writer.write_sample(sample)?;
            }
            
            writer.finalize()?;
            std::fs::rename(&temp_path, &main_audio_path)?;
            
            println!("🔗 Final segment appended to main audio file");
        }
        
        // Clean up remaining segment files
        for segment_path in &segments {
            if segment_path.exists() {
                if let Err(e) = std::fs::remove_file(segment_path) {
                    println!("⚠️ Warning: Failed to remove segment file {:?}: {}", segment_path, e);
                }
            }
        }
    }
    
    println!("🔗 Audio finalization completed for session: {}", session_id);
    Ok(())
}
