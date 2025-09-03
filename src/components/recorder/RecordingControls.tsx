import { motion } from 'framer-motion';
import { Mic, Square, Clock, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';


interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  status: 'draft' | 'recording' | 'complete';
  onToggleRecording: () => void;
  onGenerateSummary?: () => void;
}

export default function RecordingControls({
  isRecording,
  recordingTime,
  status,
  onToggleRecording,
  onGenerateSummary
}: RecordingControlsProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
      case 'recording':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'complete':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-lg p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Status Chip */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </div>
          
          {/* Timer */}
          {isRecording && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-lg font-mono"
            >
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
              {formatTime(recordingTime)}
            </motion.div>
          )}
        </div>

        {/* Device Selection */}
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <select 
            disabled 
            className="w-48 h-10 px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select Input Device</option>
            <option value="default">Default Microphone</option>
            <option value="external">External Microphone</option>
          </select>
        </div>
      </div>

      {/* Main Recording Button */}
      <div className="flex justify-center mb-6">
        <Button
          size="lg"
          onClick={onToggleRecording}
          disabled={status === 'complete'}
          className={`h-20 px-12 text-xl font-semibold transition-all duration-200 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200' 
              : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-8 h-8 mr-3" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 mr-3" />
              Start Recording
            </>
          )}
        </Button>
      </div>

      {/* Generate Summary Button */}
      {status === 'complete' && onGenerateSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={onGenerateSummary}
            className="px-8 py-3"
          >
            <Play className="w-5 h-5 mr-2" />
            Generate Catch-Up Summary
          </Button>
        </motion.div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-pulse" />
            Recording in progress... Click stop when finished
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
