import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { ArrowLeft, Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionsStore } from '@/store/sessions';
import { Session as SessionType } from '@/types/session';
import { sessionsClient } from '@/lib/sessions';
import PageTransition from '@/components/PageTransition';
import { 
  RecorderLayout, 
  RecordingControls, 
  CatchUpSummaryModal,
  TranscriptLineData,
  convertTranscriptLine
} from '@/components/recorder';

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLineData[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const { sessions, updateStatus } = useSessionsStore();
  const recordingTimeRef = useRef(0);

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

  const handleBack = () => {
    navigate('/app/home');
  };

  // Timer effect for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime; // Keep ref in sync
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Mock transcript generation every 2 seconds while recording
  useEffect(() => {
    console.log('📹 Transcript generation effect triggered - isRecording:', isRecording, 'sessionId:', session?.id);
    let interval: NodeJS.Timeout;
    if (isRecording && session?.id) {
      console.log('📹 Starting transcript generation for session:', session.id);
      const generateTranscriptLine = async () => {
        const mockTexts = [
          "This is a sample transcript line that demonstrates the recording functionality.",
          "The system is currently generating mock transcript data for testing purposes.",
          "Each line appears every two seconds to simulate real-time transcription.",
          "You can add bookmarks to important moments during the recording.",
          "The transcript will auto-scroll to show the latest content.",
          "This mock implementation shows how the UI will look and feel.",
          "In the real version, this would be actual speech-to-text transcription.",
          "The recording controls provide a professional interface for session management."
        ];
        
        const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        const currentRecordingTime = recordingTimeRef.current;
        const currentTimeMs = currentRecordingTime * 1000;
        
        // Add to frontend state first (for immediate UI feedback)
        const newLine: TranscriptLineData = {
          id: `line-${Date.now()}`,
          timestamp: currentRecordingTime,
          text: randomText,
          speaker: 'Speaker'
        };
        
        setTranscriptLines(prev => [...prev, newLine]);

        // Then save to backend
        try {
          console.log('💾 About to save transcript line to backend...');
          await sessionsClient.appendTranscriptLine(
            session.id,
            currentTimeMs,
            'Speaker',
            randomText
          );
          console.log('✅ Successfully saved transcript line to backend');
        } catch (error) {
          console.error('❌ Error saving transcript line:', error);
        }
      };

      // Generate first line immediately
      generateTranscriptLine();
      
      // Then generate every 2 seconds
      interval = setInterval(generateTranscriptLine, 2000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, session?.id]);

  const toggleRecording = async () => {
    console.log('🎬 toggleRecording called - current isRecording:', isRecording);
    try {
      if (isRecording) {
        // Stop recording
        console.log('🛑 Stopping recording...');
        setIsRecording(false);
        if (session) {
          // Update session status to complete
          await updateStatus({ id: session.id, status: 'complete' });
          setSession(prev => prev ? { ...prev, status: 'complete' } : null);
        }
      } else {
        // Start recording
        console.log('▶️ Starting recording...');
        setIsRecording(true);
        
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
        
        if (session) {
          // Update session status to recording
          await updateStatus({ id: session.id, status: 'recording' });
          setSession(prev => prev ? { ...prev, status: 'recording' } : null);
        }
      }
    } catch (error) {
      console.error('Error in toggleRecording:', error);
      // Reset state on error
      setIsRecording(false);
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

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleSaveNotes = async () => {
    if (session?.id) {
      try {
        await sessionsClient.writeNotes(session.id, notes);
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }
  };

  // Debug function to test transcript operations
  const handleTestTranscript = async () => {
    if (!session?.id) {
      console.log('🧪 No session ID available for test');
      return;
    }
    
    console.log('🧪 Testing transcript operations with session ID:', session.id);
    console.log('🧪 Available sessions:', sessions.map(s => ({ id: s.id, title: s.title, transcript_path: s.transcript_path })));
    
    try {
      // First, test basic Tauri connectivity with a simple command
      console.log('🧪 Step 0: Testing basic backend connectivity...');
      try {
        const testResult = await invoke('test_backend');
        console.log('🧪 Backend test result:', testResult);
      } catch (error) {
        console.error('🧪 Backend test failed:', error);
        return;
      }
      
      console.log('🧪 Step 0.5: Testing session listing...');
      const allSessions = await sessionsClient.listSessions();
      console.log('🧪 Basic Tauri works - got sessions:', allSessions.length);
      
      // First, test if we can read existing data
      console.log('🧪 Step 1: Reading existing transcript...');
      const existingResult = await sessionsClient.readTranscript(session.id);
      console.log('🧪 Existing transcript:', existingResult);
      
      // Test write
      console.log('🧪 Step 2: Writing new transcript line...');
      const testTime = Date.now();
      await sessionsClient.appendTranscriptLine(
        session.id, 
        testTime, 
        'Test Speaker', 
        `Manual test line at ${new Date().toLocaleTimeString()}`
      );
      console.log('🧪 Test write completed');
      
      // Test read again
      console.log('🧪 Step 3: Reading transcript after write...');
      const result = await sessionsClient.readTranscript(session.id);
      console.log('🧪 Test read result:', result);
      
      // Update UI
      if (result.length > 0) {
        console.log('🧪 Step 4: Converting and updating UI...');
        const frontendTranscript = result.map((line, index) => {
          const converted = convertTranscriptLine(line, index);
          console.log('🧪 Converting:', line, '→', converted);
          return converted;
        });
        console.log('🧪 Setting transcript lines:', frontendTranscript);
        setTranscriptLines(frontendTranscript);
      } else {
        console.log('🧪 No transcript lines returned');
      }
    } catch (error) {
      console.error('🧪 Test failed:', error);
    }
  };

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
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-10 w-10 p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{session.title}</h1>
              {session.course && (
                <p className="text-lg text-muted-foreground">{session.course}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recording Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <RecordingControls
            isRecording={isRecording}
            recordingTime={recordingTime}
            status={session?.status || 'draft'}
            onToggleRecording={toggleRecording}
            onGenerateSummary={session?.status === 'complete' ? handleGenerateSummary : undefined}
          />
        </motion.div>

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  session.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  session.status === 'recording' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {session.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(session.created_at * 1000).toLocaleDateString()}</span>
              </div>
              {session.duration_ms > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{Math.round(session.duration_ms / 1000)}s</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                View Notes
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Play className="w-4 h-4 mr-2" />
                Play Audio
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                View Transcript
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleTestTranscript}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                🧪 Test Transcript
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recorder Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 h-[600px]"
        >
          <RecorderLayout
            transcriptLines={transcriptLines}
            isRecording={isRecording}
            notes={notes}
            onAddBookmark={handleAddBookmark}
            onNotesChange={handleNotesChange}
            onSaveNotes={handleSaveNotes}
          />
        </motion.div>
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
