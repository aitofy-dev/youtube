/**
 * Get Video Info
 *
 * Lấy thông tin chi tiết của video từ YouTube page
 */

import { YouTubeToolsError, ErrorCodes, type YouTubeVideo } from '../types';

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface VideoInfo extends YouTubeVideo {
    /** Video description (full) */
    description: string;

    /** Like count */
    likeCount?: number;

    /** Comment count */
    commentCount?: number;

    /** Video category */
    category?: string;

    /** Video tags */
    tags?: string[];

    /** Video chapters */
    chapters?: VideoChapter[];

    /** Is live stream */
    isLive?: boolean;

    /** Is upcoming premiere */
    isUpcoming?: boolean;

    /** Keywords */
    keywords?: string[];
}

export interface VideoChapter {
    title: string;
    startTime: number;
    endTime?: number;
}

/**
 * Get detailed video information
 */
export async function getVideoInfo(videoIdOrUrl: string): Promise<VideoInfo> {
    const videoId = parseVideoId(videoIdOrUrl);
    const html = await fetchVideoPage(videoId);

    return extractVideoInfo(html, videoId);
}

/**
 * Get basic video info (faster, less data)
 */
export async function getBasicVideoInfo(videoIdOrUrl: string): Promise<YouTubeVideo> {
    const videoId = parseVideoId(videoIdOrUrl);

    // Use oEmbed for fast basic info
    const url = `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new YouTubeToolsError(
            `Video not found: ${videoId}`,
            ErrorCodes.VIDEO_NOT_FOUND,
            response.status,
        );
    }

    const data = (await response.json()) as {
        title: string;
        author_name: string;
        thumbnail_url: string;
    };

    return {
        videoId,
        title: data.title,
        url: `https://youtube.com/watch?v=${videoId}`,
        channelTitle: data.author_name,
        thumbnails: {
            default: data.thumbnail_url,
            high: data.thumbnail_url.replace('hqdefault', 'maxresdefault'),
        },
        publishedAt: '',
    };
}

// ============================================================================
// Internal Functions
// ============================================================================

function parseVideoId(input: string): string {
    // Already a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    // Try to extract from URL
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
            return match[1];
        }
    }

    throw new YouTubeToolsError(
        `Invalid video ID or URL: ${input}`,
        ErrorCodes.VIDEO_NOT_FOUND,
    );
}

async function fetchVideoPage(videoId: string): Promise<string> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
            Cookie: 'CONSENT=YES+',
        },
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Failed to fetch video page: ${response.status}`,
            ErrorCodes.NETWORK_ERROR,
            response.status,
        );
    }

    return response.text();
}

function extractVideoInfo(html: string, videoId: string): VideoInfo {
    // Extract ytInitialPlayerResponse
    const playerMatch = html.match(
        /ytInitialPlayerResponse\s*=\s*({.+?});(?:var|<\/script>)/s,
    );

    // Extract ytInitialData
    const dataMatch = html.match(/var ytInitialData = (.+?);<\/script>/s);

    let playerData: any = {};
    let pageData: any = {};

    try {
        if (playerMatch) {
            playerData = JSON.parse(playerMatch[1]);
        }
        if (dataMatch) {
            pageData = JSON.parse(dataMatch[1]);
        }
    } catch {
        // Continue with partial data
    }

    const videoDetails = playerData?.videoDetails || {};
    const microformat = playerData?.microformat?.playerMicroformatRenderer || {};

    return {
        videoId,
        title: videoDetails.title || '',
        description: videoDetails.shortDescription || '',
        publishedAt: microformat.publishDate || '',
        duration: formatDuration(parseInt(videoDetails.lengthSeconds || '0', 10)),
        durationSeconds: parseInt(videoDetails.lengthSeconds || '0', 10),
        viewCount: parseInt(videoDetails.viewCount || '0', 10),
        likeCount: extractLikeCount(pageData),
        commentCount: extractCommentCount(pageData),
        url: `https://youtube.com/watch?v=${videoId}`,
        thumbnails: {
            default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
            medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        },
        channelId: videoDetails.channelId,
        channelTitle: videoDetails.author,
        category: microformat.category,
        tags: videoDetails.keywords,
        keywords: videoDetails.keywords,
        chapters: extractChapters(pageData),
        isLive: videoDetails.isLiveContent,
        isUpcoming: videoDetails.isUpcoming,
    };
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function extractLikeCount(pageData: any): number | undefined {
    try {
        const contents =
            pageData?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];

        for (const content of contents) {
            const buttons =
                content?.videoPrimaryInfoRenderer?.videoActions?.menuRenderer?.topLevelButtons || [];

            for (const button of buttons) {
                const likeButton = button?.segmentedLikeDislikeButtonViewModel?.likeButtonViewModel;
                if (likeButton?.likeButtonViewModel?.toggleButtonViewModel) {
                    const countText =
                        likeButton.likeButtonViewModel.toggleButtonViewModel.toggleButtonViewModel
                            ?.defaultButtonViewModel?.buttonViewModel?.title;
                    if (countText) {
                        return parseCount(countText);
                    }
                }
            }
        }
    } catch {
        // Ignore
    }
    return undefined;
}

function extractCommentCount(pageData: any): number | undefined {
    try {
        const contents =
            pageData?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];

        for (const content of contents) {
            const header = content?.itemSectionRenderer?.contents?.[0]?.commentsEntryPointHeaderRenderer;
            if (header?.commentCount?.simpleText) {
                return parseCount(header.commentCount.simpleText);
            }
        }
    } catch {
        // Ignore
    }
    return undefined;
}

function extractChapters(pageData: any): VideoChapter[] {
    try {
        const panels = pageData?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer
            ?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer?.markersMap || [];

        for (const panel of panels) {
            if (panel?.key === 'AUTO_CHAPTERS' || panel?.key === 'DESCRIPTION_CHAPTERS') {
                const markers = panel?.value?.chapters || [];
                return markers.map((m: any) => ({
                    title: m.chapterRenderer?.title?.simpleText || '',
                    startTime: m.chapterRenderer?.timeRangeStartMillis / 1000 || 0,
                }));
            }
        }
    } catch {
        // Ignore
    }
    return [];
}

function parseCount(text: string): number {
    // Handle formats like "1.2K", "5M", "123"
    const match = text.match(/([\d.]+)\s*([KMB])?/i);
    if (!match) return 0;

    let num = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();

    if (suffix === 'K') num *= 1000;
    else if (suffix === 'M') num *= 1000000;
    else if (suffix === 'B') num *= 1000000000;

    return Math.round(num);
}
