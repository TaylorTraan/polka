import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Button } from '@/components/ui/button';
import { useSessionsStore } from '@/store/sessions';
import { Session as SessionType } from '@/types/session';
import { sessionsClient } from '@/lib/sessions';
import PageTransition from '@/components/PageTransition';
import VUMeter from '@/components/VUMeter';
import NotionToolbar from '@/components/NotionToolbar';
import NotionLayout from '@/components/NotionLayout';
import { useTabsStore } from '@/store/tabs';

// Real-time transcription now handled in Rust backend
import { 
  CatchUpSummaryModal,
  TranscriptLineData,
  convertTranscriptLine
} from '@/components/recorder';

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLineData[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackTimeRemaining, setPlaybackTimeRemaining] = useState(0);
  const { sessions, updateStatus, delete: deleteSession } = useSessionsStore();
  const { updateTab } = useTabsStore();
  const recordingTimeRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const pendingNotesRef = useRef<string>('');
  // Real-time transcription handled in Rust backend via events

  useEffect(() => {
    console.log('🔍 Session loading effect - id from URL:', id);
    console.log('🔍 Available sessions:', sessions.map(s => ({ id: s.id, title: s.title })));
    
    if (id && sessions.length > 0) {
      const foundSession = sessions.find(s => s.id === id);
      console.log('🔍 Found session:', foundSession);
      if (foundSession) {
        setSession(foundSession);
        
        // Update tab title with session title
        try {
          const tabs = useTabsStore.getState().tabs;
          const currentActiveTabId = useTabsStore.getState().activeTabId;
          const currentActiveTab = tabs.find(tab => tab.id === currentActiveTabId);
          if (currentActiveTab) {
            updateTab(currentActiveTab.id, { 
              title: foundSession.title,
              path: `/app/session/${id}`,
              icon: 'FileText'
            });
          }
        } catch (error) {
          console.error('Error updating tab title:', error);
        }
      } else {
        console.log('🔍 No session found with ID:', id);
        setSession(null);
      }
    } else if (id && sessions.length === 0) {
      // Sessions are still loading, don't set session to null yet
      console.log('🔍 Sessions still loading...');
    } else {
      console.log('🔍 Not loading session - id:', id, 'sessions length:', sessions.length);
      setSession(null);
    }
  }, [id, sessions, updateTab]);

  // Load existing transcript and notes when session is found
  useEffect(() => {
    if (session?.id) {
                console.log('🔄 Loading session data for:', session.id);
      const loadSessionData = async () => {
        try {
          // Load existing transcript
          const backendTranscript = await sessionsClient.readTranscript(session.id);
          console.log('📄 Loaded transcript lines:', backendTranscript.length);
          
          if (backendTranscript.length > 0) {
            const frontendTranscript = backendTranscript.map((line, index) => 
              convertTranscriptLine(line, index)
            );
            setTranscriptLines(frontendTranscript);
          } else {
            setTranscriptLines([]);
          }

          // Load existing notes
          const existingNotes = await sessionsClient.readNotes(session.id);
          setNotes(existingNotes);
        } catch (error) {
          console.error('❌ Error loading session data:', error);
        }
      };

      loadSessionData();
    }
  }, [session?.id]);

  // Listen for audio level events
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupAudioLevelListener = async () => {
      try {
        unlisten = await listen<{ session_id: string; level: number }>('polka://audio-level', (event) => {
          if (event.payload.session_id === session?.id) {
            setAudioLevel(event.payload.level);
          }
        });
      } catch (error) {
        console.error('❌ Failed to setup audio level listener:', error);
      }
    };

    if (session?.id && isRecording && !isPaused) {
      setupAudioLevelListener();
    } else if (isPaused) {
      // Set audio level to 0 when paused
      setAudioLevel(0);
    }

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [session?.id, isRecording, isPaused]);


  // Timer effect for recording (only increment when not paused)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime; // Keep ref in sync
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Real-time speech recognition is now handled in the speech recognition useEffect above

  const toggleRecording = async () => {
    console.log('🎬 toggleRecording called - current isRecording:', isRecording);
    if (!session?.id) {
      setRecordingError('No session available');
      return;
    }

    try {
      setRecordingError(null);
      
      if (isRecording) {
        // Stop recording
        console.log('🛑 Stopping recording...');
        await invoke('cmd_stop_recording', { id: session.id });
        setIsRecording(false);
        setIsPaused(false);
        setAudioLevel(0);
        
        // Update session status to complete
        await updateStatus({ id: session.id, status: 'complete' });
        setSession(prev => prev ? { ...prev, status: 'complete' } : null);
      } else {
        // Start recording
        console.log('▶️ Starting recording...');
        
        // Only reset recording time if this is a fresh session (no existing transcripts)
        if (transcriptLines.length === 0) {
          setRecordingTime(0);
          recordingTimeRef.current = 0;
        } else {
          // Find the last transcript timestamp and continue from there
          const lastTimestamp = Math.max(...transcriptLines.map(line => line.timestamp));
          const nextTime = lastTimestamp + 1; // Continue 1 second after the last line
          setRecordingTime(nextTime);
          recordingTimeRef.current = nextTime;
        }
        
        await invoke('cmd_start_recording', { id: session.id });
        setIsRecording(true);
        setIsPaused(false);
        
        // Update session status to recording
        await updateStatus({ id: session.id, status: 'recording' });
        setSession(prev => prev ? { ...prev, status: 'recording' } : null);
      }
    } catch (error) {
      console.error('Error in toggleRecording:', error);
      setRecordingError(error instanceof Error ? error.message : 'Recording failed');
      // Reset state on error
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
    }
  };

  const handlePauseRecording = async () => {
    console.log('⏸️ handlePauseRecording called');
    if (!session?.id) {
      setRecordingError('No session available');
      return;
    }

    try {
      setRecordingError(null);
      await invoke('cmd_pause_recording', { id: session.id });
      setIsPaused(true);
      console.log('⏸️ Recording paused successfully');
    } catch (error) {
      console.error('Error pausing recording:', error);
      setRecordingError(error instanceof Error ? error.message : 'Failed to pause recording');
    }
  };

  const handleResumeRecording = async () => {
    console.log('▶️ handleResumeRecording called');
    if (!session?.id) {
      setRecordingError('No session available');
      return;
    }

    try {
      setRecordingError(null);
      await invoke('cmd_resume_recording', { id: session.id });
      setIsPaused(false);
      console.log('▶️ Recording resumed successfully');
    } catch (error) {
      console.error('Error resuming recording:', error);
      setRecordingError(error instanceof Error ? error.message : 'Failed to resume recording');
    }
  };

  const handleAddBookmark = () => {
    if (transcriptLines.length > 0) {
      const lastLine = transcriptLines[transcriptLines.length - 1];
      setTranscriptLines(prev => 
        prev.map(line => 
          line.id === lastLine.id 
            ? { ...line, isBookmarked: true }
            : line
        )
      );
    }
  };

  const handleGenerateSummary = () => {
    setShowSummaryModal(true);
  };

  // Debounced auto-save function
  const saveNotesToServer = useCallback(async (notesToSave: string) => {
    if (!session?.id || isSavingRef.current) return;
    
    isSavingRef.current = true;
    try {
      console.log('💾 Auto-saving notes...');
      await sessionsClient.writeNotes(session.id, notesToSave);
      console.log('✅ Notes saved successfully');
    } catch (error) {
      console.error('❌ Error saving notes:', error);
      // Retry once after a short delay
      setTimeout(() => {
        if (session?.id) {
          sessionsClient.writeNotes(session.id, notesToSave).catch(console.error);
        }
      }, 1000);
    } finally {
      isSavingRef.current = false;
    }
  }, [session?.id]);

  // Immediate save function for critical moments (navigation, beforeunload)
  const saveNotesImmediately = useCallback(async (notesToSave?: string) => {
    const finalNotes = notesToSave ?? pendingNotesRef.current ?? notes;
    if (!session?.id || !finalNotes) return;
    
    try {
      await sessionsClient.writeNotes(session.id, finalNotes);
      console.log('✅ Notes saved immediately');
    } catch (error) {
      console.error('❌ Error saving notes immediately:', error);
    }
  }, [session?.id, notes]);

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    pendingNotesRef.current = newNotes;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveNotesToServer(newNotes);
    }, 500); // 500ms debounce
  };

  const handleSaveNotes = () => {
    // For backward compatibility - trigger immediate save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveNotesToServer(pendingNotesRef.current || notes);
  };

  const handleDeleteSession = async () => {
    if (session?.id) {
      try {
        await deleteSession(session.id);
        // Navigate back to home after successful deletion
        navigate('/app/home');
      } catch (error) {
        console.error('Error deleting session:', error);
        // Error is already handled by the store
      }
    }
  };

  const handlePlayAudio = async () => {
    if (!session?.id) {
      setRecordingError('No session available');
      return;
    }

    try {
      setRecordingError(null);
      setIsPlayingAudio(true);
      
      console.log('🔊 Getting audio duration for session:', session.id);
      // First get the audio duration
      const duration = await invoke<number>('cmd_get_audio_duration', { id: session.id });
      console.log('🔊 Audio duration:', duration, 'seconds');
      
      console.log('🔊 Playing audio for session:', session.id);
      // Then start playing the audio
      await invoke('cmd_play_audio', { id: session.id });
      
      console.log('🔊 Audio playback started successfully');
      
      // Set up countdown timer for remaining playback time
      setPlaybackTimeRemaining(Math.ceil(duration));
      
      const countdownInterval = setInterval(() => {
        setPlaybackTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsPlayingAudio(false);
            console.log('🔊 Audio playback completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Fallback timeout in case countdown doesn't work perfectly
      const durationMs = Math.ceil(duration * 1000) + 500; // Add 500ms buffer
      setTimeout(() => {
        clearInterval(countdownInterval);
        setIsPlayingAudio(false);
        setPlaybackTimeRemaining(0);
        console.log('🔊 Audio playback completed (fallback)');
      }, durationMs);
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setRecordingError(error instanceof Error ? error.message : 'Failed to play audio');
      setIsPlayingAudio(false);
      setPlaybackTimeRemaining(0);
    }
  };

  const handleStopAudio = async () => {
    try {
      console.log('🔊 Stopping audio playback');
      await invoke('cmd_stop_audio');
      setIsPlayingAudio(false);
      setPlaybackTimeRemaining(0);
      console.log('🔊 Audio playback stopped successfully');
    } catch (error) {
      console.error('Error stopping audio:', error);
      // Even if the backend stop fails, reset the UI state
      setIsPlayingAudio(false);
      setPlaybackTimeRemaining(0);
    }
  };

  // Cleanup playback state when session changes
  useEffect(() => {
    setIsPlayingAudio(false);
    setPlaybackTimeRemaining(0);
  }, [session?.id]);

  // Listen for real-time transcription events from Rust backend
  useEffect(() => {
    if (!session?.id) return;

    const unlisten = listen<{ session_id: string; text: string; timestamp: number }>('polka://transcript-line', async (event) => {
      if (event.payload.session_id === session.id) {
        console.log('🎤 Received transcript from backend:', event.payload.text);
        
        // Calculate recording time for consistent timestamps
        const currentRecordingTime = recordingTimeRef.current;
        
        const newLine: TranscriptLineData = {
          id: `line-${Date.now()}`,
          timestamp: currentRecordingTime, // Use recording time for consistency
          text: event.payload.text,
          speaker: 'Speaker'
        };
        
        // Add to frontend state immediately
        setTranscriptLines(prev => [...prev, newLine]);

        // Save to backend
        try {
          console.log('💾 Saving real-time transcript to backend...');
          await sessionsClient.appendTranscriptLine(
            session.id,
            currentRecordingTime * 1000, // Convert to ms
            'Speaker',
            event.payload.text
          );
          console.log('✅ Successfully saved real-time transcript to backend');
        } catch (error) {
          console.error('❌ Error saving real-time transcript:', error);
        }
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [session?.id]);

  // Cleanup and save on component unmount or navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingNotesRef.current && pendingNotesRef.current !== notes) {
        // Save immediately before page unload
        saveNotesImmediately(pendingNotesRef.current);
        // Show browser warning if there are unsaved changes
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      // Save any pending changes immediately on unmount
      if (pendingNotesRef.current || saveTimeoutRef.current) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        if (pendingNotesRef.current && session?.id) {
          // Use synchronous save for cleanup
          sessionsClient.writeNotes(session.id, pendingNotesRef.current).catch(console.error);
        }
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session?.id, notes, saveNotesImmediately]);



  if (!session) {
    return (
      <PageTransition>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">Session not found</p>
              <Button onClick={() => navigate('/app/home')} variant="outline">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="h-full flex flex-col">

        {/* Notion-style Toolbar */}
        <NotionToolbar
          session={session}
          isRecording={isRecording}
          isPaused={isPaused}
          recordingTime={recordingTime}
          isPlayingAudio={isPlayingAudio}
          playbackTimeRemaining={playbackTimeRemaining}
          onToggleRecording={toggleRecording}
          onPauseRecording={handlePauseRecording}
          onResumeRecording={handleResumeRecording}
          onAddBookmark={handleAddBookmark}
          onGenerateSummary={handleGenerateSummary}
          onPlayAudio={handlePlayAudio}
          onStopAudio={handleStopAudio}
          onDeleteSession={handleDeleteSession}
        />

        {/* VU Meter - Compact */}
        {(isRecording && !isPaused) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-2 border-b bg-background/95"
          >
            <div className="flex justify-center">
              <VUMeter level={audioLevel} isRecording={true} />
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {recordingError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800"
          >
            <p className="text-red-800 dark:text-red-200 text-sm text-center">
              Recording Error: {recordingError}
            </p>
          </motion.div>
        )}

        {/* Main Content - Notion Style */}
        <div className="flex-1 overflow-hidden">
          <NotionLayout
            transcriptLines={transcriptLines}
            isRecording={isRecording}
            notes={notes}
            onNotesChange={handleNotesChange}
            onSaveNotes={handleSaveNotes}
          />
        </div>
      </div>

      {/* Catch-Up Summary Modal */}
      <CatchUpSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        sessionTitle={session?.title || ''}
        recordingDuration={recordingTime}
      />
    </PageTransition>
  );
}
