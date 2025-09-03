import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Play, Clock, BookOpen } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

export default function Home() {
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
            onClick={() => console.log('New Session clicked')}
          >
            <Mic className="w-6 h-6 mr-3" />
            Start New Session
          </Button>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
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

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        className="mt-12"
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>
              Your recent note-taking sessions will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sessions yet. Start your first recording to see it here!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </PageTransition>
  );
}
