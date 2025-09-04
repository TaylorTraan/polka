import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, CheckCircle, X, AlertTriangle, FileText, Mic } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import { Session } from '@/types';

interface BulkStatusChangeModalProps {
  sessions: Session[];
  isOpen: boolean;
  onConfirm: (newStatus: string) => Promise<void>;
  onCancel: () => void;
  isUpdating?: boolean;
}

const statusOptions = [
  { value: 'draft', label: 'Draft', icon: FileText, description: 'Mark sessions as draft' },
  { value: 'recording', label: 'Recording', icon: Mic, description: 'Mark sessions as recording' },
  { value: 'complete', label: 'Complete', icon: CheckCircle, description: 'Mark sessions as complete' },
  { value: 'archived', label: 'Archived', icon: Archive, description: 'Archive sessions' },
];

export default function BulkStatusChangeModal({
  sessions,
  isOpen,
  onConfirm,
  onCancel,
  isUpdating = false
}: BulkStatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    await onConfirm(selectedStatus);
    setSelectedStatus('');
  };

  const handleCancel = () => {
    setSelectedStatus('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Change Status</CardTitle>
                    <CardDescription>
                      Update status for {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Selected Sessions Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Selected Sessions:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span className="truncate">{session.title}</span>
                      <span className="text-xs text-muted-foreground">({session.status})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">New Status:</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedStatus || isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
