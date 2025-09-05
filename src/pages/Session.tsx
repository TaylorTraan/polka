import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ArrowLeft } from 'lucide-react';
import { Button, ErrorBanner, PageTransition, VUMeter, NotionToolbar, NotionLayout, CatchUpSummaryModal } from '@/components';
import { useSessionsStore } from '@/store/sessions';
import { Session as SessionType, TranscriptLineData, convertTranscriptLine } from '@/types';
import { sessionsClient } from '@/lib/sessions';
import { useAutoSave } from '@/hooks';
import { useFullscreen } from '@/contexts/FullscreenContext';

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
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const recordingTimeRef = useRef(0);
  const editorRef = useRef<HTMLDivElement>(null);
  // Real-time transcription handled in Rust backend via events

  useEffect(() => {
    console.log('🔍 Session loading effect - id from URL:', id);
    console.log('🔍 Available sessions:', sessions.map(s => ({ id: s.id, title: s.title })));
    
    if (id && sessions.length > 0) {
      const foundSession = sessions.find(s => s.id === id);
      console.log('🔍 Found session:', foundSession);
      if (foundSession) {
        setSession(foundSession);
      } else {
        console.log('🔍 No session found with ID:', id);
      }
    } else {
      console.log('🔍 Not loading session - id:', id, 'sessions length:', sessions.length);
    }
  }, [id, sessions]);

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

  const handleBack = () => {
    navigate('/app/home');
  };

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
        
        // Session remains in draft status during recording
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

  // Auto-save notes with debouncing
  const saveNotesFunction = useCallback(async (notesToSave: string) => {
    if (session?.id) {
      try {
        await sessionsClient.writeNotes(session.id, notesToSave);
        console.log('📝 Notes auto-saved successfully');
      } catch (error) {
        console.error('❌ Error auto-saving notes:', error);
        // Could show a toast notification here
      }
    }
  }, [session?.id]);

  useAutoSave(
    saveNotesFunction, 
    notes,
    {
      delay: 1000, // Save 1 second after user stops typing
      saveOnUnmount: true,
      saveOnPageHide: true
    }
  );

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    // The useAutoSave hook will automatically handle the debounced saving
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

  const handleToggleFullscreen = () => {
    toggleFullscreen();
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



  if (!session) {
    return (
      <PageTransition>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">Session not found</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
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
      <div className="h-screen flex flex-col">
        {/* Notion-style Toolbar */}
        <NotionToolbar
          session={session}
          isRecording={isRecording}
          isPaused={isPaused}
          recordingTime={recordingTime}
          isPlayingAudio={isPlayingAudio}
          playbackTimeRemaining={playbackTimeRemaining}
          isFullscreen={isFullscreen}
          onToggleRecording={toggleRecording}
          onPauseRecording={handlePauseRecording}
          onResumeRecording={handleResumeRecording}
          onAddBookmark={handleAddBookmark}
          onGenerateSummary={handleGenerateSummary}
          onPlayAudio={handlePlayAudio}
          onStopAudio={handleStopAudio}
          onDeleteSession={handleDeleteSession}
          onToggleFullscreen={handleToggleFullscreen}
          editorRef={editorRef}
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
          <ErrorBanner 
            message={`Recording Error: ${recordingError}`}
            onDismiss={() => setRecordingError(null)}
          />
        )}

        {/* Main Content - Notion Style */}
        <div className="flex-1 overflow-hidden">
          <NotionLayout
            transcriptLines={transcriptLines}
            isRecording={isRecording}
            notes={notes}
            onNotesChange={handleNotesChange}
            sessionTitle={session?.title}
            isFullscreen={isFullscreen}
            editorRef={editorRef}
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
