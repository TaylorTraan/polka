export interface Session {
  id: string;
  title: string;
  course: string;
  created_at: number;
  duration_ms: number;
  status: SessionStatus;
  notes_path: string | null;
  audio_path: string | null;
  transcript_path: string | null;
}

export type SessionStatus = 'draft' | 'recording' | 'complete' | 'archived';

export interface CreateSessionRequest {
  title: string;
  course: string;
}

export interface UpdateSessionStatusRequest {
  id: string;
  status: SessionStatus;
}

export interface TranscriptLine {
  t_ms: number;
  speaker: string;
  text: string;
}
