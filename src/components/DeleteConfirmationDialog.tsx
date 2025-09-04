import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Session } from '@/types/session';

interface DeleteConfirmationDialogProps {
  session: Session;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmationDialog({
  session,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false
}: DeleteConfirmationDialogProps) {
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
              <h3 className="text-lg font-semibold">Delete Session</h3>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-foreground mb-2">
              Are you sure you want to delete this session?
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium text-sm">{session.title}</p>
              {session.course && (
                <p className="text-xs text-muted-foreground">{session.course}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Created: {new Date(session.created_at * 1000).toLocaleDateString()}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              This will permanently delete all notes, transcripts, and audio recordings associated with this session.
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
              {isDeleting ? 'Deleting...' : 'Delete Session'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
