import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionsStore } from '@/store/sessions';
import { Session as SessionType } from '@/types/session';
import PageTransition from '@/components/PageTransition';
import { 
  RecorderLayout, 
  RecordingControls, 
  CatchUpSummaryModal,
  TranscriptLineData 
} from '@/components/recorder';

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLineData[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const { sessions, updateStatus } = useSessionsStore();

  useEffect(() => {
    if (id && sessions.length > 0) {
      const foundSession = sessions.find(s => s.id === id);
      if (foundSession) {
        setSession(foundSession);
      }
    }
  }, [id, sessions]);

  const handleBack = () => {
    navigate('/app/home');
  };

  // Timer effect for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Mock transcript generation every 2 seconds while recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      // Generate first line immediately
      const generateTranscriptLine = () => {
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
        const newLine: TranscriptLineData = {
          id: `line-${Date.now()}`,
          timestamp: recordingTime,
          text: randomText
        };
        
        setTranscriptLines(prev => [...prev, newLine]);
      };

      // Generate first line immediately
      generateTranscriptLine();
      
      // Then generate every 2 seconds
      interval = setInterval(generateTranscriptLine, 2000);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTime]);

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        setIsRecording(false);
        if (session) {
          // Update session status to complete
          await updateStatus({ id: session.id, status: 'complete' });
          setSession(prev => prev ? { ...prev, status: 'complete' } : null);
        }
      } else {
        // Start recording
        setIsRecording(true);
        setRecordingTime(0);
        setTranscriptLines([]);
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
            onAddBookmark={handleAddBookmark}
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
