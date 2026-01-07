/**
 * Search YouTube Videos
 */

import { YouTubeToolsError, ErrorCodes, type YouTubeVideo } from '../types';

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface SearchOptions {
    /** Search query */
    query: string;

    /** Maximum results */
    limit?: number;

    /** Sort by */
    sortBy?: 'relevance' | 'date' | 'viewCount' | 'rating';

    /** Filter by upload date */
    uploadDate?: 'hour' | 'today' | 'week' | 'month' | 'year';

    /** Filter by duration */
    duration?: 'short' | 'medium' | 'long';

    /** Filter by type */
    type?: 'video' | 'channel' | 'playlist';
}

/**
 * Search YouTube videos
 */
export async function searchVideos(
    queryOrOptions: string | SearchOptions,
): Promise<YouTubeVideo[]> {
    const options = typeof queryOrOptions === 'string'
        ? { query: queryOrOptions }
        : queryOrOptions;

    const { query, limit = 20, sortBy = 'relevance' } = options;

    const searchUrl = buildSearchUrl(query, options);

    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Search failed: ${response.status}`,
            ErrorCodes.NETWORK_ERROR,
            response.status,
        );
    }

    const html = await response.text();
    return extractSearchResults(html, limit);
}

// ============================================================================
// Internal Functions
// ============================================================================

function buildSearchUrl(query: string, options: SearchOptions): string {
    const params = new URLSearchParams({
        search_query: query,
    });

    // Add sort parameter
    if (options.sortBy === 'date') {
        params.set('sp', 'CAI%3D'); // Sort by date
    } else if (options.sortBy === 'viewCount') {
        params.set('sp', 'CAM%3D'); // Sort by view count
    } else if (options.sortBy === 'rating') {
        params.set('sp', 'CAE%3D'); // Sort by rating
    }

    return `https://www.youtube.com/results?${params.toString()}`;
}

function extractSearchResults(html: string, limit: number): YouTubeVideo[] {
    const dataMatch = html.match(/var ytInitialData = (.+?);<\/script>/s);
    if (!dataMatch) {
        return [];
    }

    try {
        const data = JSON.parse(dataMatch[1]);
        const videos: YouTubeVideo[] = [];

        // Navigate to search results
        const contents =
            data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
                ?.contents || [];

        for (const section of contents) {
            const items = section?.itemSectionRenderer?.contents || [];

            for (const item of items) {
                if (videos.length >= limit) break;

                const videoRenderer = item?.videoRenderer;
                if (videoRenderer?.videoId) {
                    videos.push(parseVideoRenderer(videoRenderer));
                }
            }
        }

        return videos;
    } catch {
        return [];
    }
}

function parseVideoRenderer(renderer: any): YouTubeVideo {
    const videoId = renderer.videoId;

    return {
        videoId,
        title: renderer.title?.runs?.[0]?.text || '',
        description: renderer.detailedMetadataSnippets?.[0]?.snippetText?.runs
            ?.map((r: any) => r.text)
            .join('') || '',
        publishedAt: renderer.publishedTimeText?.simpleText || '',
        duration: renderer.lengthText?.simpleText || '',
        durationSeconds: parseDuration(renderer.lengthText?.simpleText),
        viewCount: parseViewCount(renderer.viewCountText?.simpleText),
        url: `https://youtube.com/watch?v=${videoId}`,
        thumbnails: {
            default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
            medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        },
        channelId: renderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
        channelTitle: renderer.ownerText?.runs?.[0]?.text,
    };
}

function parseDuration(duration?: string): number | undefined {
    if (!duration) return undefined;

    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return parts[0];
}

function parseViewCount(viewText?: string): number | undefined {
    if (!viewText) return undefined;

    // Handle "1,234 views" or "1.2M views"
    const match = viewText.match(/([\d,.]+)\s*([KMB])?/i);
    if (!match) return undefined;

    let num = parseFloat(match[1].replace(/,/g, ''));
    const suffix = match[2]?.toUpperCase();

    if (suffix === 'K') num *= 1000;
    else if (suffix === 'M') num *= 1000000;
    else if (suffix === 'B') num *= 1000000000;

    return Math.round(num);
}
