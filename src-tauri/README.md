# Polka Tauri Backend - SQLite Database Implementation

This directory contains the Tauri backend implementation with a lightweight local SQLite database for managing sessions.

## Database Structure

The database is automatically created at `~/.polka/data/polka.db` when the application starts.

### Sessions Table Schema

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    duration_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('draft', 'recording', 'complete')),
    notes_path TEXT,
    audio_path TEXT,
    transcript_path TEXT
);
```

## Available Tauri Commands

### 1. List Sessions
```typescript
// Frontend usage
const sessions = await invoke('cmd_list_sessions');
```

**Backend**: `cmd_list_sessions() -> Result<Vec<Session>, String>`
- Returns all sessions ordered by creation date (newest first)
- Returns empty array if no sessions exist

### 2. Create Session
```typescript
// Frontend usage
const newSession = await invoke('cmd_create_session', {
  title: "Lecture 1: Introduction",
  course: "Computer Science 101"
});
```

**Backend**: `cmd_create_session(title: String, course: String) -> Result<Session, String>`
- Creates a new session with auto-generated ID
- Sets status to "draft" by default
- Sets creation timestamp to current UTC time
- Returns the created session object

### 3. Update Session Status
```typescript
// Frontend usage
await invoke('cmd_update_session_status', {
  id: "session_id_here",
  status: "recording" // or "draft", "complete"
});
```

**Backend**: `cmd_update_session_status(id: String, status: String) -> Result<(), String>`
- Updates the status of an existing session
- Validates status values: "draft", "recording", "complete"
- Returns error if invalid status or session not found

## Data Models

### Session Struct
```rust
pub struct Session {
    pub id: String,                    // Unique identifier
    pub title: String,                 // Session title
    pub course: String,                // Course name
    pub created_at: i64,               // Unix timestamp
    pub duration_ms: i64,              // Duration in milliseconds
    pub status: SessionStatus,         // Current status
    pub notes_path: Option<String>,    // Path to markdown notes
    pub audio_path: Option<String>,    // Path to audio file (wav/flac)
    pub transcript_path: Option<String>, // Path to transcript (jsonl)
}
```

### SessionStatus Enum
```rust
pub enum SessionStatus {
    Draft,      // Session is being prepared
    Recording,  // Session is currently recording
    Complete    // Session recording is finished
}
```

## Error Handling

All database operations return `Result<T, String>` where errors are converted to human-readable strings. Common error scenarios:

- Database connection failures
- Invalid status values
- Missing session IDs
- File system permission issues

## Database Operations

### Core Functions
- `init_db()` - Initialize database and create tables
- `insert_session(session: &Session)` - Insert or update session
- `list_sessions()` - Retrieve all sessions
- `update_session_status(id: &str, status: &SessionStatus)` - Update session status
- `get_session(id: &str)` - Retrieve specific session by ID

## File Paths

The database and related files are stored in the user's home directory:
- Database: `~/.polka/data/polka.db`
- Notes: `~/.polka/notes/` (planned)
- Audio: `~/.polka/audio/` (planned)
- Transcripts: `~/.polka/transcripts/` (planned)

## Testing

Run the test suite to verify functionality:
```bash
cd src-tauri
cargo test
```

Tests cover:
- Session creation and validation
- Status parsing and conversion
- Database operations
- Error handling

## Dependencies

- `rusqlite` - SQLite database driver
- `serde` - Serialization/deserialization
- `anyhow` - Error handling
- `nanoid` - Unique ID generation
- `time` - Timestamp handling
- `dirs` - Cross-platform directory handling
