import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Plus, BookOpen, Clock } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { ViewToggle } from '@/components/ViewToggle';
import { SessionList } from '@/components/SessionList';
import { CreateSessionModal } from '@/components/CreateSessionModal';
import { useSessionsStore } from '@/store/sessions';

export default function Home() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { sessions, loading, error, load, create, clearError } = useSessionsStore();

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateSession = async (title: string, course: string) => {
    const newSession = await create({ title, course });
    if (newSession) {
      setShowCreateModal(false);
      navigate(`/app/session/${newSession.id}`);
    }
  };

  const handleSessionClick = (session: any) => {
    navigate(`/app/session/${session.id}`);
  };

  return (
    <PageTransition>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Polka
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered note-taking companion. Never miss important moments in class again.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex justify-center">
            <Button
              size="lg"
              className="h-16 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-6 h-6 mr-3" />
              New Session
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Record & Transcribe</CardTitle>
              <CardDescription>
                Capture audio from any source and get instant AI-powered transcriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>Smart Notes</CardTitle>
              <CardDescription>
                AI automatically highlights key concepts and creates study-friendly summaries
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Never Miss Out</CardTitle>
              <CardDescription>
                Engagement tracking detects when you zone out and helps you catch up
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Sessions Library */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Sessions Library</CardTitle>
                  <CardDescription>
                    {sessions.length > 0 
                      ? `${sessions.length} session${sessions.length === 1 ? '' : 's'}`
                      : 'No sessions yet'
                    }
                  </CardDescription>
                </div>
                <ViewToggle view={view} onViewChange={setView} />
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                >
                  {error}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="ml-2 h-auto p-1 text-destructive hover:bg-destructive/20"
                  >
                    ×
                  </Button>
                </motion.div>
              )}
              
              <SessionList
                sessions={sessions}
                loading={loading}
                view={view}
                onSessionClick={handleSessionClick}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Session Modal */}
        <CreateSessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSession}
          loading={loading}
        />
      </div>
    </PageTransition>
  );
}
