import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Session } from '../types/session';

interface SessionManagerProps {
  className?: string;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ className }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({ title: '', course: '' });

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<Session[]>('cmd_list_sessions');
      setSessions(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSession.title.trim() || !newSession.course.trim()) {
      setError('Title and course are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await invoke<Session>('cmd_create_session', {
        title: newSession.title.trim(),
        course: newSession.course.trim(),
      });
      
      setSessions(prev => [result, ...prev]);
      setNewSession({ title: '', course: '' });
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setError(null);
      await invoke('cmd_update_session_status', { id, status });
      await loadSessions(); // Reload to get updated data
    } catch (err) {
      setError(err as string);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'recording': return 'bg-red-100 text-red-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">Session Manager</h2>
      
      {/* Create New Session */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Create New Session</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Session Title"
            value={newSession.title}
            onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={newSession.course}
            onChange={(e) => setNewSession(prev => ({ ...prev, course: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createSession}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Sessions ({sessions.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No sessions found. Create your first session above.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{session.title}</h4>
                    <p className="text-sm text-gray-600">{session.course}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {formatDate(session.created_at)}
                    </p>
                    {session.duration_ms > 0 && (
                      <p className="text-xs text-gray-500">
                        Duration: {Math.round(session.duration_ms / 1000)}s
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    
                    <select
                      value={session.status}
                      onChange={(e) => updateStatus(session.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="recording">Recording</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                </div>
                
                {/* File paths display */}
                {(session.notes_path || session.audio_path || session.transcript_path) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-1">
                      {session.notes_path && <div>Notes: {session.notes_path}</div>}
                      {session.audio_path && <div>Audio: {session.audio_path}</div>}
                      {session.transcript_path && <div>Transcript: {session.transcript_path}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
