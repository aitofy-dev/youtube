/**
 * YouTube Transcript Fetcher - Pure Node.js
 *
 * Port từ youtube-transcript-api (Python) sang TypeScript
 * Sử dụng Innertube API như Python library
 */

import { YouTubeToolsError, ErrorCodes, type TranscriptSegment } from '../types';

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const WATCH_URL = 'https://www.youtube.com/watch?v=';
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?key=';

// YouTube Innertube context - giống với web client
const INNERTUBE_CONTEXT = {
    client: {
        hl: 'en',
        gl: 'US',
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
    },
};

export interface TranscriptTrack {
    languageCode: string;
    language: string;
    baseUrl: string;
    isGenerated: boolean;
    isTranslatable: boolean;
}

export interface FetchTranscriptOptions {
    /** Preferred language codes in order of preference */
    languages?: string[];
    /** If true, prefer auto-generated over manual */
    preferGenerated?: boolean;
}

/**
 * Fetch available transcript tracks for a video
 */
export async function listTranscripts(videoId: string): Promise<TranscriptTrack[]> {
    const captionsData = await fetchCaptionsData(videoId);
    return captionsData.tracks;
}

/**
 * Fetch transcript segments for a video
 */
export async function getTranscript(
    videoId: string,
    options: FetchTranscriptOptions = {},
): Promise<TranscriptSegment[]> {
    const { languages = ['en'], preferGenerated = false } = options;

    // Get available tracks via Innertube API
    const captionsData = await fetchCaptionsData(videoId);
    const tracks = captionsData.tracks;

    if (tracks.length === 0) {
        throw new YouTubeToolsError(
            `No transcripts available for video: ${videoId}`,
            ErrorCodes.TRANSCRIPT_NOT_AVAILABLE,
        );
    }

    // Find best matching track
    const track = findBestTrack(tracks, languages, preferGenerated);

    if (!track) {
        throw new YouTubeToolsError(
            `No transcript found for languages: ${languages.join(', ')}`,
            ErrorCodes.TRANSCRIPT_NOT_AVAILABLE,
        );
    }

    // Fetch transcript content - remove fmt=srv3 if present (like Python does)
    const url = track.baseUrl.replace('&fmt=srv3', '');
    return fetchTranscriptXML(url);
}

/**
 * Fetch transcript and format as plain text
 */
export async function getTranscriptText(
    videoId: string,
    options: FetchTranscriptOptions = {},
): Promise<string> {
    const segments = await getTranscript(videoId, options);
    return segments.map((s) => s.text).join('\n');
}

/**
 * Fetch transcript and format as SRT
 */
export async function getTranscriptSRT(
    videoId: string,
    options: FetchTranscriptOptions = {},
): Promise<string> {
    const segments = await getTranscript(videoId, options);
    return formatAsSRT(segments);
}

/**
 * Fetch transcript and format as WebVTT
 */
export async function getTranscriptVTT(
    videoId: string,
    options: FetchTranscriptOptions = {},
): Promise<string> {
    const segments = await getTranscript(videoId, options);
    return formatAsVTT(segments);
}

// ============================================================================
// Core: Innertube API (giống Python youtube-transcript-api)
// ============================================================================

interface CaptionsData {
    tracks: TranscriptTrack[];
    translationLanguages: string[];
}

async function fetchCaptionsData(videoId: string): Promise<CaptionsData> {
    // Step 1: Fetch video HTML to get API key
    const html = await fetchVideoHtml(videoId);
    const apiKey = extractInnertubeApiKey(html);

    // Step 2: Call Innertube API
    const data = await fetchInnertubeData(videoId, apiKey);

    // Step 3: Extract captions info
    return extractCaptionsData(data, videoId);
}

async function fetchVideoHtml(videoId: string): Promise<string> {
    const url = WATCH_URL + videoId;

    const response = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
            Accept: 'text/html,application/xhtml+xml',
        },
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Failed to fetch video page: ${response.status}`,
            ErrorCodes.NETWORK_ERROR,
            response.status,
        );
    }

    // Decode HTML entities
    const html = await response.text();
    return decodeHtmlEntities(html);
}

function extractInnertubeApiKey(html: string): string {
    const match = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);

    if (match && match[1]) {
        return match[1];
    }

    // Check if IP is blocked
    if (html.includes('class="g-recaptcha"')) {
        throw new YouTubeToolsError(
            'IP blocked by YouTube (reCAPTCHA required)',
            ErrorCodes.RATE_LIMITED,
        );
    }

    throw new YouTubeToolsError(
        'Could not extract Innertube API key',
        ErrorCodes.PARSING_ERROR,
    );
}

async function fetchInnertubeData(videoId: string, apiKey: string): Promise<any> {
    const url = INNERTUBE_API_URL + apiKey;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            context: INNERTUBE_CONTEXT,
            videoId: videoId,
        }),
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Innertube API failed: ${response.status}`,
            ErrorCodes.NETWORK_ERROR,
            response.status,
        );
    }

    return response.json();
}

function extractCaptionsData(data: any, videoId: string): CaptionsData {
    // Check playability status
    const playabilityStatus = data?.playabilityStatus?.status;
    if (playabilityStatus && playabilityStatus !== 'OK') {
        const reason = data?.playabilityStatus?.reason || 'Video unavailable';
        throw new YouTubeToolsError(
            `Video not playable: ${reason}`,
            ErrorCodes.VIDEO_NOT_FOUND,
        );
    }

    // Extract captions
    const captionsData = data?.captions?.playerCaptionsTracklistRenderer;

    if (!captionsData || !captionsData.captionTracks) {
        throw new YouTubeToolsError(
            `No transcripts available for video: ${videoId}`,
            ErrorCodes.TRANSCRIPT_NOT_AVAILABLE,
        );
    }

    const tracks: TranscriptTrack[] = captionsData.captionTracks.map((track: any) => ({
        languageCode: track.languageCode,
        language: track.name?.runs?.[0]?.text || track.name?.simpleText || track.languageCode,
        baseUrl: track.baseUrl,
        isGenerated: track.kind === 'asr',
        isTranslatable: track.isTranslatable || false,
    }));

    const translationLanguages = (captionsData.translationLanguages || []).map(
        (lang: any) => lang.languageCode,
    );

    return { tracks, translationLanguages };
}

// ============================================================================
// Transcript Fetching & Parsing
// ============================================================================

async function fetchTranscriptXML(url: string): Promise<TranscriptSegment[]> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Failed to fetch transcript: ${response.status}`,
            ErrorCodes.NETWORK_ERROR,
            response.status,
        );
    }

    const xml = await response.text();
    return parseTranscriptXML(xml);
}

function parseTranscriptXML(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    // Parse XML using regex (lightweight, no external dependency)
    // Format: <text start="0.24" dur="4.559">text content</text>
    const regex = /<text\s+start="([^"]+)"\s+dur="([^"]*)"[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
        const text = decodeHtmlEntities(match[3]).trim();
        if (text) {
            segments.push({
                start: parseFloat(match[1]),
                duration: parseFloat(match[2] || '0'),
                text: text,
            });
        }
    }

    // If no matches with dur, try alternate format
    if (segments.length === 0) {
        const altRegex = /<text\s+start="([^"]+)"[^>]*>([^<]*)<\/text>/g;
        while ((match = altRegex.exec(xml)) !== null) {
            const text = decodeHtmlEntities(match[2]).trim();
            if (text) {
                segments.push({
                    start: parseFloat(match[1]),
                    duration: 0,
                    text: text,
                });
            }
        }
    }

    return segments;
}

// ============================================================================
// Helpers
// ============================================================================

function findBestTrack(
    tracks: TranscriptTrack[],
    languages: string[],
    preferGenerated: boolean,
): TranscriptTrack | null {
    // Sort tracks: manual first (unless preferGenerated)
    const sortedTracks = [...tracks].sort((a, b) => {
        if (a.isGenerated !== b.isGenerated) {
            if (preferGenerated) {
                return a.isGenerated ? -1 : 1;
            }
            return a.isGenerated ? 1 : -1;
        }
        return 0;
    });

    // Find first matching language
    for (const lang of languages) {
        const track = sortedTracks.find(
            (t) => t.languageCode === lang || t.languageCode.startsWith(lang + '-'),
        );
        if (track) {
            return track;
        }
    }

    // If no language match, return first track
    return sortedTracks[0] || null;
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/\n/g, ' ')
        .replace(/\\n/g, ' ');
}

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatTimeVTT(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function formatAsSRT(segments: TranscriptSegment[]): string {
    return segments
        .map((seg, i) => {
            const start = formatTime(seg.start);
            const end = formatTime(seg.start + seg.duration);
            return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
        })
        .join('\n');
}

function formatAsVTT(segments: TranscriptSegment[]): string {
    const lines = ['WEBVTT\n'];

    for (const seg of segments) {
        const start = formatTimeVTT(seg.start);
        const end = formatTimeVTT(seg.start + seg.duration);
        lines.push(`${start} --> ${end}\n${seg.text}\n`);
    }

    return lines.join('\n');
}
