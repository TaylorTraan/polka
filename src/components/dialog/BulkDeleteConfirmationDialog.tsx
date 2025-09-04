import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Session } from '@/types';

interface BulkDeleteConfirmationDialogProps {
  sessions: Session[];
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function BulkDeleteConfirmationDialog({
  sessions,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false
}: BulkDeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-background border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded"
          disabled={isDeleting}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pr-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Delete Multiple Sessions</h3>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-foreground mb-3">
              Are you sure you want to delete these {sessions.length} session{sessions.length === 1 ? '' : 's'}?
            </p>
            
            <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
              {sessions.map((session, index) => (
                <div key={session.id} className={`${index > 0 ? 'mt-2 pt-2 border-t border-border' : ''}`}>
                  <p className="font-medium text-sm">{session.title}</p>
                  {session.course && (
                    <p className="text-xs text-muted-foreground">{session.course}</p>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              This will permanently delete all notes, transcripts, and audio recordings associated with these sessions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              size="sm"
            >
              {isDeleting ? 'Deleting...' : `Delete ${sessions.length} Session${sessions.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
