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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SessionStatus {
    Draft,
    Complete,
    Archived,
}

impl SessionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionStatus::Draft => "draft",
            SessionStatus::Complete => "complete",
            SessionStatus::Archived => "archived",
        }
    }
}

impl FromStr for SessionStatus {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "draft" => Ok(SessionStatus::Draft),
            "complete" => Ok(SessionStatus::Complete),
            "archived" => Ok(SessionStatus::Archived),
            _ => Err(format!("Invalid status: {}. Must be one of: draft, complete, archived", s)),
        }
    }
}

impl Default for SessionStatus {
    fn default() -> Self {
        SessionStatus::Draft
    }
}

impl Serialize for SessionStatus {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for SessionStatus {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        SessionStatus::from_str(&s).map_err(serde::de::Error::custom)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TranscriptLine {
    pub t_ms: u64,
    pub speaker: String,
    pub text: String,
}
