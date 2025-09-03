use serde::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Session {
    pub id: String,
    pub title: String,
    pub course: String,
    pub created_at: i64,
    pub duration_ms: i64,
    pub status: SessionStatus,
    pub notes_path: Option<String>,
    pub audio_path: Option<String>,
    pub transcript_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SessionStatus {
    Draft,
    Recording,
    Complete,
}

impl SessionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionStatus::Draft => "draft",
            SessionStatus::Recording => "recording",
            SessionStatus::Complete => "complete",
        }
    }
}

impl FromStr for SessionStatus {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "draft" => Ok(SessionStatus::Draft),
            "recording" => Ok(SessionStatus::Recording),
            "complete" => Ok(SessionStatus::Complete),
            _ => Err(format!("Invalid status: {}. Must be one of: draft, recording, complete", s)),
        }
    }
}

impl Default for SessionStatus {
    fn default() -> Self {
        SessionStatus::Draft
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TranscriptLine {
    pub t_ms: u64,
    pub speaker: String,
    pub text: String,
}
