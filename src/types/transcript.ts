import { TranscriptLine as BackendTranscriptLine } from './session';

export interface TranscriptLineData {
  id: string;
  timestamp: number;
  text: string;
  speaker?: string;
  isBookmarked?: boolean;
}

/**
 * Convert backend TranscriptLine to frontend TranscriptLineData
 * @param backendLine - Backend transcript line data
 * @param index - Line index for unique ID generation
 * @returns Formatted transcript line data for frontend use
 */
export const convertTranscriptLine = (
  backendLine: BackendTranscriptLine, 
  index: number
): TranscriptLineData => ({
  id: `line-${backendLine.t_ms}-${index}`,
  timestamp: Math.floor(backendLine.t_ms / 1000), // Convert ms to seconds
  text: backendLine.text,
  speaker: backendLine.speaker,
  isBookmarked: false,
});
