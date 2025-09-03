import { invoke } from '@tauri-apps/api/core';
import { Session, CreateSessionRequest, UpdateSessionStatusRequest, TranscriptLine } from '@/types/session';

export const sessionsClient = {
  async listSessions(): Promise<Session[]> {
    return await invoke<Session[]>('cmd_list_sessions');
  },

  async createSession(request: CreateSessionRequest): Promise<Session> {
    return await invoke<Session>('cmd_create_session', { ...request });
  },

  async updateSessionStatus(request: UpdateSessionStatusRequest): Promise<void> {
    await invoke('cmd_update_session_status', { ...request });
  },

  // Transcript operations
  async appendTranscriptLine(id: string, t_ms: number, speaker: string, text: string): Promise<void> {
    try {
      await invoke('cmd_append_transcript_line', { id, tMs: t_ms, speaker, text });
    } catch (error) {
      console.error('Failed to save transcript line:', error);
      
      // Fallback to localStorage for development
      const key = `transcript_${id}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({ t_ms, speaker, text });
      localStorage.setItem(key, JSON.stringify(existing));
    }
  },

  async readTranscript(id: string): Promise<TranscriptLine[]> {
    try {
      const result = await invoke<TranscriptLine[]>('cmd_read_transcript', { id });
      return result;
    } catch (error) {
      console.error('Failed to read transcript:', error);
      
      // Fallback to localStorage for development
      const key = `transcript_${id}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing;
    }
  },

  // Notes operations
  async writeNotes(id: string, markdown: string): Promise<void> {
    await invoke('cmd_write_notes', { id, markdown });
  },

  async readNotes(id: string): Promise<string> {
    return await invoke<string>('cmd_read_notes', { id });
  }
};
