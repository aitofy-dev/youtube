/**
 * @automate-hub/youtube-tools
 *
 * Free YouTube utilities - get channel videos, transcripts, and more without API key
 *
 * 100% TypeScript, no Python dependencies
 */

// Channel functions
export { getChannelVideos, type GetChannelVideosOptions } from './channel/get-videos';
export { getChannelInfo } from './channel/get-info';

// Video functions
export {
    getTranscript,
    getTranscriptText,
    getTranscriptSRT,
    getTranscriptVTT,
    listTranscripts,
    type TranscriptTrack,
    type FetchTranscriptOptions,
} from './video/get-transcript';
export { getVideoInfo, getBasicVideoInfo, type VideoInfo } from './video/get-info';
export { searchVideos, type SearchOptions } from './video/search';

// Types
export * from './types';
