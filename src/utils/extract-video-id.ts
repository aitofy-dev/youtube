/**
 * Extract YouTube video ID from URL or return as-is if already an ID
 */

import { YouTubeToolsError, ErrorCodes } from '../types';

/**
 * Extract video ID from YouTube URL or return as-is if already an ID
 *
 * Supported formats:
 * - Video ID: J6OnBDmErUg
 * - Short URL: https://youtu.be/J6OnBDmErUg
 * - Watch URL: https://www.youtube.com/watch?v=J6OnBDmErUg
 * - Embed URL: https://www.youtube.com/embed/J6OnBDmErUg
 * - Shorts URL: https://www.youtube.com/shorts/J6OnBDmErUg
 *
 * @param videoIdOrUrl - YouTube URL or video ID
 * @returns Video ID (11 characters)
 * @throws {YouTubeToolsError} If input is invalid
 */
export function extractVideoId(videoIdOrUrl: string): string {
    if (!videoIdOrUrl || typeof videoIdOrUrl !== 'string') {
        throw new YouTubeToolsError(
            'Video ID or URL is required',
            ErrorCodes.INVALID_INPUT,
        );
    }

    const input = videoIdOrUrl.trim();

    if (!input) {
        throw new YouTubeToolsError('Video ID or URL cannot be empty', ErrorCodes.INVALID_INPUT);
    }

    // If already a valid video ID (11 chars, alphanumeric, dash, underscore)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    // Try to extract from various URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/, // youtube.com/watch?v=ID
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/, // youtu.be/ID
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, // youtube.com/embed/ID
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/, // youtube.com/v/ID
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/, // youtube.com/shorts/ID
        /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/, // youtube.com/live/ID
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // If no pattern matches, throw error
    throw new YouTubeToolsError(
        `Invalid YouTube URL or video ID: "${input}". Expected a video ID (11 characters) or a valid YouTube URL.`,
        ErrorCodes.INVALID_INPUT,
    );
}
