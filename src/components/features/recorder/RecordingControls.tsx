import { motion } from 'framer-motion';
import { Mic, Square, Clock, Settings, Play, Pause } from 'lucide-react';
import { Button } from '@/components';
import { formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';


interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  status: 'draft' | 'recording' | 'complete';
  onToggleRecording: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  onGenerateSummary?: () => void;
}

export default function RecordingControls({
  isRecording,
  isPaused,
  recordingTime,
  status,
  onToggleRecording,
  onPauseRecording,
  onResumeRecording,
  onGenerateSummary
}: RecordingControlsProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-lg p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Status Chip */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status, 'dark-aware')}`}>
            {getStatusLabel(status, isPaused)}
          </div>
          
          {/* Timer */}
          {isRecording && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-lg font-mono"
            >
              <Clock className={`w-5 h-5 ${isPaused ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
              {formatTime(recordingTime, true)}
              {isPaused && <span className="text-sm text-yellow-600 dark:text-yellow-400 ml-2">PAUSED</span>}
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

      {/* Main Recording Controls */}
      <div className="flex justify-center gap-4 mb-6">
        {!isRecording ? (
          // Start Recording Button
          <Button
            size="lg"
            onClick={onToggleRecording}
            disabled={status === 'complete'}
            className="h-20 px-12 text-xl font-semibold transition-all duration-200 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Mic className="w-8 h-8 mr-3" />
            Start Recording
          </Button>
        ) : (
          // Recording Controls
          <>
            {isPaused ? (
              // Resume Button
              <Button
                size="lg"
                onClick={onResumeRecording}
                className="h-20 px-12 text-xl font-semibold transition-all duration-200 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
              >
                <Play className="w-8 h-8 mr-3" />
                Resume
              </Button>
            ) : (
              // Pause Button
              <Button
                size="lg"
                onClick={onPauseRecording}
                className="h-20 px-12 text-xl font-semibold transition-all duration-200 bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-200"
              >
                <Pause className="w-8 h-8 mr-3" />
                Pause
              </Button>
            )}
            
            {/* Stop Button */}
            <Button
              size="lg"
              onClick={onToggleRecording}
              className="h-20 px-12 text-xl font-semibold transition-all duration-200 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
            >
              <Square className="w-8 h-8 mr-3" />
              Stop
            </Button>
          </>
        )}
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
            <div className={`w-2 h-2 rounded-full ${
              isPaused 
                ? 'bg-yellow-600 dark:bg-yellow-400' 
                : 'bg-red-600 dark:bg-red-400 animate-pulse'
            }`} />
            {isPaused 
              ? 'Recording paused... Click resume to continue or stop to finish'
              : 'Recording in progress... Click pause to pause or stop to finish'
            }
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
