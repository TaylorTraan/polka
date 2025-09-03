import { invoke } from '@tauri-apps/api/core';
import { Session, CreateSessionRequest, UpdateSessionStatusRequest } from '@/types/session';

export const sessionsClient = {
  async listSessions(): Promise<Session[]> {
    return await invoke<Session[]>('cmd_list_sessions');
  },

  async createSession(request: CreateSessionRequest): Promise<Session> {
    return await invoke<Session>('cmd_create_session', { ...request });
  },

  async updateSessionStatus(request: UpdateSessionStatusRequest): Promise<void> {
    await invoke('cmd_update_session_status', { ...request });
  }
};
