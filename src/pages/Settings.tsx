import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  HardDrive, 
  Shield, 
  Mic, 
  Sun, 
  Moon, 
  FolderOpen,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/lib/theme';
import PageTransition from '@/components/PageTransition';
import { invoke } from '@tauri-apps/api/core';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [dataDir, setDataDir] = useState('~/.polka/data');
  const [consentReminder, setConsentReminder] = useState(true);
  const [sampleRate, setSampleRate] = useState('44100');

  // Mock function to get data directory - would be replaced with actual Tauri command
  React.useEffect(() => {
    // For now, use the known path structure from the Rust code
    const homeDir = '~';
    setDataDir(`${homeDir}/.polka/data`);
  }, []);

  const handleOpenDataFolder = async () => {
    try {
      // This would need to be implemented as a Tauri command
      // For now, we'll show an alert with the path
      alert(`Data directory: ${dataDir.replace('~', process.env.HOME || '~')}`);
    } catch (error) {
      console.error('Failed to open data folder:', error);
    }
  };

  const sampleRateOptions = [
    { value: '44100', label: '44.1 kHz' },
    { value: '48000', label: '48 kHz' },
    { value: '96000', label: '96 kHz' },
    { value: '192000', label: '192 kHz' },
  ];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Customize your Polka experience and manage your data.
            </p>
          </div>

          <div className="space-y-6">
            {/* Appearance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Theme</Label>
                      <div className="text-sm text-muted-foreground">
                        Choose between light and dark mode
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      <Switch
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                        aria-label="Toggle theme"
                      />
                      <Moon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Storage Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Storage
                  </CardTitle>
                  <CardDescription>
                    Manage your local data and storage preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base">Data Directory</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-muted rounded-md text-sm font-mono">
                        {dataDir}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenDataFolder}
                        className="flex items-center gap-2"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Open Folder
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      This is where your sessions, recordings, and notes are stored locally.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Privacy Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy
                  </CardTitle>
                  <CardDescription>
                    Control your privacy settings and data usage consent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Consent Reminder</Label>
                      <div className="text-sm text-muted-foreground">
                        Show reminders about data usage and privacy
                      </div>
                    </div>
                    <Switch
                      checked={consentReminder}
                      onCheckedChange={setConsentReminder}
                      aria-label="Toggle consent reminder"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Privacy Notice</p>
                      <p>
                        All your recordings and data are stored locally on your device. 
                        Polka does not send your audio or transcripts to external servers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recording Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Recording
                  </CardTitle>
                  <CardDescription>
                    Configure your audio recording preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base">Sample Rate</Label>
                    <Select value={sampleRate} onValueChange={setSampleRate} disabled>
                      <SelectTrigger className="w-full opacity-50">
                        <SelectValue placeholder="Select sample rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleRateOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Audio sample rate for recordings. Higher rates provide better quality but larger files.
                      <span className="text-amber-600 dark:text-amber-400 ml-1">
                        (Currently disabled - coming soon)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
