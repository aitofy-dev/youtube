/**
 * Get Channel Videos
 *
 * Sử dụng 2 methods:
 * 1. RSS Feed - nhanh, stable, nhưng chỉ 15 videos
 * 2. Scraping - lấy được nhiều hơn với pagination
 */

import { XMLParser } from 'fast-xml-parser';
import { YouTubeToolsError, ErrorCodes, type YouTubeVideo } from '../types';
import { parseChannelId } from '../utils/fetcher';

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface GetChannelVideosOptions {
    /** Channel ID, URL, or handle (@username) */
    channel: string;

    /** Maximum videos to fetch. Default: 15 (RSS), set higher to use scraping */
    limit?: number;

    /** Sort by: newest, oldest, popular */
    sortBy?: 'newest' | 'oldest' | 'popular';

    /** Content type filter */
    contentType?: 'videos' | 'shorts' | 'streams';
}

/**
 * Get videos from a YouTube channel
 */
export async function getChannelVideos(
    options: GetChannelVideosOptions | string,
): Promise<YouTubeVideo[]> {
    const opts = typeof options === 'string' ? { channel: options } : options;
    const { channel, limit = 15, sortBy = 'newest', contentType = 'videos' } = opts;

    // Parse channel identifier
    const channelInfo = parseChannelId(channel);

    // If limit <= 15 and sorting by newest, use RSS (faster)
    if (limit <= 15 && sortBy === 'newest' && contentType === 'videos') {
        try {
            const channelId = await resolveChannelId(channelInfo);
            return getVideosFromRSS(channelId, limit);
        } catch {
            // Fall back to scraping
        }
    }

    // Use scraping for more videos or different sorting
    return getVideosFromScraping(channelInfo, limit, sortBy, contentType);
}

/**
 * Get videos using RSS feed (fast, but limited to 15)
 */
async function getVideosFromRSS(channelId: string, limit: number): Promise<YouTubeVideo[]> {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Failed to fetch RSS: ${response.status}`,
            ErrorCodes.NETWORK_ERROR,
            response.status,
        );
    }

    const xml = await response.text();
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    });
    const data = parser.parse(xml);

    const entries = data?.feed?.entry || [];
    const videos: YouTubeVideo[] = [];

    for (const entry of entries.slice(0, limit)) {
        videos.push({
            videoId: entry['yt:videoId'],
            title: entry.title,
            description: entry['media:group']?.['media:description'] || '',
            publishedAt: entry.published,
            url: entry.link?.['@_href'] || `https://youtube.com/watch?v=${entry['yt:videoId']}`,
            thumbnails: {
                default: entry['media:group']?.['media:thumbnail']?.['@_url'],
                medium: entry['media:group']?.['media:thumbnail']?.['@_url']?.replace(
                    'default',
                    'mqdefault',
                ),
                high: entry['media:group']?.['media:thumbnail']?.['@_url']?.replace(
                    'default',
                    'hqdefault',
                ),
            },
            channelId: entry['yt:channelId'],
            channelTitle: entry.author?.name,
        });
    }

    return videos;
}

/**
 * Get videos using page scraping (supports pagination)
 */
async function getVideosFromScraping(
    channelInfo: { type: string; value: string },
    limit: number,
    sortBy: string,
    contentType: string,
): Promise<YouTubeVideo[]> {
    // Build URL based on channel type
    let baseUrl: string;
    if (channelInfo.type === 'id') {
        baseUrl = `https://www.youtube.com/channel/${channelInfo.value}`;
    } else if (channelInfo.type === 'handle') {
        baseUrl = `https://www.youtube.com/${channelInfo.value}`;
    } else {
        baseUrl = `https://www.youtube.com/c/${channelInfo.value}`;
    }

    // Add content type path
    const contentPath = contentType === 'shorts' ? '/shorts' : contentType === 'streams' ? '/streams' : '/videos';
    const url = baseUrl + contentPath;

    // Add sort parameter
    const sortParam = sortBy === 'popular' ? '?sort=p' : sortBy === 'oldest' ? '?sort=da' : '';
    const fullUrl = url + sortParam;

    const response = await fetch(fullUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Failed to fetch channel page: ${response.status}`,
            ErrorCodes.NETWORK_ERROR,
            response.status,
        );
    }

    const html = await response.text();
    return extractVideosFromHTML(html, limit);
}

/**
 * Extract videos from HTML page
 */
function extractVideosFromHTML(html: string, limit: number): YouTubeVideo[] {
    // Find ytInitialData
    const dataMatch = html.match(/var ytInitialData = (.+?);<\/script>/s);
    if (!dataMatch) {
        return [];
    }

    try {
        const data = JSON.parse(dataMatch[1]);
        const videos: YouTubeVideo[] = [];

        // Navigate to videos tab content
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];

        for (const tab of tabs) {
            const tabContent = tab?.tabRenderer?.content;
            if (!tabContent) continue;

            // Try different content structures
            const items =
                tabContent?.richGridRenderer?.contents ||
                tabContent?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ||
                [];

            for (const item of items) {
                if (videos.length >= limit) break;

                const videoRenderer =
                    item?.richItemRenderer?.content?.videoRenderer ||
                    item?.gridVideoRenderer ||
                    item?.videoRenderer;

                if (videoRenderer?.videoId) {
                    videos.push(parseVideoRenderer(videoRenderer));
                }
            }

            if (videos.length > 0) break;
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
        title: renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || '',
        description: renderer.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '',
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

    const match = viewText.match(/[\d,]+/);
    if (match) {
        return parseInt(match[0].replace(/,/g, ''), 10);
    }
    return undefined;
}

async function resolveChannelId(
    channelInfo: { type: string; value: string },
): Promise<string> {
    if (channelInfo.type === 'id') {
        return channelInfo.value;
    }

    // Need to fetch page to get channel ID
    let url: string;
    if (channelInfo.type === 'handle') {
        url = `https://www.youtube.com/${channelInfo.value}`;
    } else {
        url = `https://www.youtube.com/c/${channelInfo.value}`;
    }

    const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
    });

    const html = await response.text();
    const match = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);

    if (match) {
        return match[1];
    }

    throw new YouTubeToolsError(
        `Could not resolve channel ID for: ${channelInfo.value}`,
        ErrorCodes.CHANNEL_NOT_FOUND,
    );
}
