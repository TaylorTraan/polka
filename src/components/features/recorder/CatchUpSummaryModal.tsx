import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Clock } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components';

interface CatchUpSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTitle: string;
  recordingDuration: number;
}

export default function CatchUpSummaryModal({
  isOpen,
  onClose,
  sessionTitle,
  recordingDuration
}: CatchUpSummaryModalProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">Catch-Up Summary</h2>
                <p className="text-sm text-muted-foreground">{sessionTitle}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Recording Duration: {formatDuration(recordingDuration)}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Points Discussed</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Ut enim ad minim veniam, quis nostrud exercitation ullamco
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Laboris nisi ut aliquip ex ea commodo consequat
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Action Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      Follow up on lorem ipsum implementation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      Review dolor sit amet requirements
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      Schedule next session for consectetur adipiscing
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-muted">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Export Summary
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
