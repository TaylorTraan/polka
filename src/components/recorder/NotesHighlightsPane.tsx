import { useState, useEffect } from 'react';
import { BookOpen, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NotesHighlightsPaneProps {
  isRecording: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
}

export default function NotesHighlightsPane({ 
  isRecording, 
  notes, 
  onNotesChange, 
  onSaveNotes: _onSaveNotes // Keep for interface compatibility but don't use
}: NotesHighlightsPaneProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'highlights'>('notes');
  const [localNotes, setLocalNotes] = useState(notes);

  // Update local notes when notes prop changes
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    onNotesChange(value);
    // Auto-save is now handled by the useAutoSave hook in the parent component
  };

  const tabs = [
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'highlights', label: 'Highlights', icon: Star },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-4">Notes & Highlights</h3>
        
        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {activeTab === 'notes' ? (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Session Notes</h4>
            </div>
            
            <div className="flex-1 flex flex-col">
              <textarea
                value={localNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start typing your notes here..."
                className="flex-1 w-full p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                style={{ minHeight: '300px' }}
              />
              
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Notes are automatically saved as you type</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Key Highlights</h4>
              <Button
                variant="outline"
                size="sm"
                disabled={!isRecording}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Highlight
              </Button>
            </div>
            
            <div className="space-y-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">
                    {isRecording 
                      ? "Click 'Add Highlight' to mark important moments"
                      : "Start recording to add highlights to your session"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
