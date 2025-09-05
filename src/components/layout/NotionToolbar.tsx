import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  Bookmark, 
  Sparkles, 
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Mic,
  Pause,
  Settings,
  Trash2,
  Type
} from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components';
import DeleteConfirmationDialog from '@/components/features/common/DeleteConfirmationDialog';
import FormattingPanel from '@/components/features/common/FormattingPanel';
import { Session } from '@/types';
import { formatTime, formatDate, getStatusColor, formatDuration } from '@/lib/utils';
import { useConfirmationDialog } from '@/hooks';

interface NotionToolbarProps {
  session: Session;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  isPlayingAudio: boolean;
  playbackTimeRemaining: number;
  isFullscreen: boolean;
  onToggleRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onAddBookmark: () => void;
  onGenerateSummary: () => void;
  onPlayAudio: () => void;
  onStopAudio: () => void;
  onDeleteSession: () => void;
  onToggleFullscreen: () => void;
  editorRef?: React.RefObject<HTMLDivElement | null>;
}

export default function NotionToolbar({
  session,
  isRecording,
  isPaused,
  recordingTime,
  isPlayingAudio,
  playbackTimeRemaining,
  isFullscreen,
  onToggleRecording,
  onPauseRecording,
  onResumeRecording,
  onAddBookmark,
  onGenerateSummary,
  onPlayAudio,
  onStopAudio,
  onDeleteSession,
  onToggleFullscreen,
  editorRef
}: NotionToolbarProps) {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const deleteDialog = useConfirmationDialog();

  const handleDeleteClick = () => {
    setShowFileMenu(false);
    deleteDialog.open();
  };

  const handleDeleteConfirm = async () => {
    await deleteDialog.executeWithLoading(onDeleteSession);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
    >
      {/* Main Toolbar */}
      <div className="flex items-center px-4 py-2 gap-1">
        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFullscreen}
          className="h-7 px-2 text-xs fast-tooltip tooltip-left"
          data-tooltip={isFullscreen ? "Show Tabs & Sections" : "Hide Tabs & Sections"}
        >
          {isFullscreen ? (
            <EyeOff className="w-3 h-3" />
          ) : (
            <Eye className="w-3 h-3" />
          )}
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Recording Controls Group */}
        <div className="flex items-center">
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            onClick={onToggleRecording}
            className="h-7 px-2 text-xs fast-tooltip tooltip"
            data-tooltip={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <Square className="w-3 h-3" />
            ) : (
              <Mic className="w-3 h-3" />
            )}
          </Button>

          {isRecording && (
            <Button
              variant="ghost"
              size="sm"
              onClick={isPaused ? onResumeRecording : onPauseRecording}
              className="h-7 px-2 fast-tooltip tooltip-right"
              data-tooltip={isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {isPaused ? (
                <Play className="w-3 h-3" />
              ) : (
                <Pause className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>

        {/* Timer */}
        {isRecording && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <div 
              className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 rounded text-xs fast-tooltip"
              data-tooltip={isPaused ? "Recording Paused" : "Recording in Progress"}
            >
              <Clock className={`w-3 h-3 ${isPaused ? 'text-yellow-600' : 'text-red-600'}`} />
              <span className="font-mono">{formatTime(recordingTime)}</span>
              {isPaused && <span className="text-yellow-600 ml-1">PAUSED</span>}
            </div>
          </>
        )}

        <div className="w-px h-4 bg-border mx-1" />

        {/* Action Buttons */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddBookmark}
            disabled={!isRecording}
            className="h-7 px-2 fast-tooltip"
            data-tooltip="Add Bookmark"
          >
            <Bookmark className="w-3 h-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={isPlayingAudio ? onStopAudio : onPlayAudio}
            disabled={!session?.audio_path}
            className="h-7 px-2 fast-tooltip"
            data-tooltip={isPlayingAudio ? "Stop Audio" : "Play Audio"}
          >
            {isPlayingAudio ? (
              <Square className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>

          {session?.status === 'complete' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateSummary}
              className="h-7 px-2 fast-tooltip"
              data-tooltip="Generate Summary"
            >
              <Sparkles className="w-3 h-3" />
            </Button>
          )}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Formatting Button */}
        {editorRef && (
          <Button
            variant={showFormatting ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowFormatting(!showFormatting)}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="h-7 px-2 fast-tooltip"
            data-tooltip="Text Formatting"
          >
            <Type className="w-3 h-3" />
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Session Menu */}
        <DropdownMenu open={showFileMenu} onOpenChange={setShowFileMenu}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              //className="h-7 px-2 text-xs fast-tooltip"
              data-tooltip="Session Details"
            >
              <Settings className="w-3 h-3 mr-1" />
              Session
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="p-3 space-y-3">
              <div>
                <h4 className="font-medium mb-2 text-sm">Session Details</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className="truncate max-w-[150px]">{session.title}</span>
                  </div>
                  {session.course && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Course:</span>
                      <span>{session.course}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(session.status, 'dark-aware')}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(session.created_at)}</span>
                  </div>
                  {session.duration_ms > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(session.duration_ms)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              onClick={handleDeleteClick}
              disabled={isRecording}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Audio Playback Timer */}
        {isPlayingAudio && playbackTimeRemaining > 0 && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <span 
              className="text-xs text-muted-foreground fast-tooltip"
              data-tooltip="Audio Playback Time Remaining"
            >
              {playbackTimeRemaining}s
            </span>
          </>
        )}
      </div>

      {/* Formatting Panel */}
      <AnimatePresence>
        {showFormatting && editorRef && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <FormattingPanel editorRef={editorRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        session={session}
        isOpen={deleteDialog.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteDialog.close}
        isDeleting={deleteDialog.isLoading}
      />
    </motion.div>
  );
}
