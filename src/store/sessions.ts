import { create } from 'zustand';
import { Session, CreateSessionRequest, UpdateSessionStatusRequest } from '@/types/session';
import { sessionsClient } from '@/lib/sessions';

interface SessionsState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  
  // Actions
  load: () => Promise<void>;
  create: (request: CreateSessionRequest) => Promise<Session | null>;
  updateStatus: (request: UpdateSessionStatusRequest) => Promise<void>;
  delete: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: [],
  loading: false,
  error: null,

  load: async () => {
    try {
      set({ loading: true, error: null });
      const sessions = await sessionsClient.listSessions();
      set({ sessions, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load sessions', 
        loading: false 
      });
    }
  },

  create: async (request: CreateSessionRequest) => {
    try {
      set({ loading: true, error: null });
      const newSession = await sessionsClient.createSession(request);
      set(state => ({ 
        sessions: [newSession, ...state.sessions], 
        loading: false 
      }));
      return newSession;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create session', 
        loading: false 
      });
      return null;
    }
  },

  updateStatus: async (request: UpdateSessionStatusRequest) => {
    try {
      set({ error: null });
      await sessionsClient.updateSessionStatus(request);
      set(state => ({
        sessions: state.sessions.map(session =>
          session.id === request.id
            ? { ...session, status: request.status }
            : session
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update session status' 
      });
      throw error; // Re-throw so caller can handle
    }
  },

  delete: async (id: string) => {
    try {
      set({ error: null }); // Don't set loading to true to prevent screen reset
      await sessionsClient.deleteSession(id);
      set(state => ({
        sessions: state.sessions.filter(session => session.id !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete session'
      });
      throw error; // Re-throw to handle in UI if needed
    }
  },

  clearError: () => set({ error: null }),
}));
