import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Play, Square, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionsStore } from '@/store/sessions';
import { Session as SessionType } from '@/types/session';
import PageTransition from '@/components/PageTransition';

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { sessions } = useSessionsStore();

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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual recording logic
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Recording Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  onClick={toggleRecording}
                  className={`h-16 px-8 text-lg font-semibold ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-6 h-6 mr-3" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 mr-3" />
                      Start Recording
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  {isRecording ? (
                    <span className="text-red-600 font-medium">● Recording...</span>
                  ) : (
                    <span>Click to start recording your session</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Placeholder for future recorder functionality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recorder Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Recorder Coming Soon</p>
                <p className="text-sm">
                  The audio recording interface will be implemented here in the next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
