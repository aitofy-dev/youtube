/**
 * Get Channel Info
 */

import { YouTubeToolsError, ErrorCodes, type YouTubeChannel } from '../types';
import { parseChannelId } from '../utils/fetcher';

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Get channel information
 */
export async function getChannelInfo(channel: string): Promise<YouTubeChannel> {
    const channelInfo = parseChannelId(channel);

    // Build URL
    let url: string;
    if (channelInfo.type === 'id') {
        url = `https://www.youtube.com/channel/${channelInfo.value}`;
    } else if (channelInfo.type === 'handle') {
        url = `https://www.youtube.com/${channelInfo.value}`;
    } else {
        url = `https://www.youtube.com/c/${channelInfo.value}`;
    }

    const response = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new YouTubeToolsError(
            `Channel not found: ${channel}`,
            ErrorCodes.CHANNEL_NOT_FOUND,
            response.status,
        );
    }

    const html = await response.text();
    return extractChannelInfo(html);
}

// ============================================================================
// Internal Functions
// ============================================================================

function extractChannelInfo(html: string): YouTubeChannel {
    const dataMatch = html.match(/var ytInitialData = (.+?);<\/script>/s);
    if (!dataMatch) {
        throw new YouTubeToolsError(
            'Could not parse channel data',
            ErrorCodes.PARSING_ERROR,
        );
    }

    try {
        const data = JSON.parse(dataMatch[1]);
        const metadata = data?.metadata?.channelMetadataRenderer || {};
        const header = data?.header?.c4TabbedHeaderRenderer ||
            data?.header?.pageHeaderRenderer?.pageHeaderViewModel || {};

        // Extract channel ID
        const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
        const channelId = channelIdMatch?.[1] || metadata.externalId || '';

        // Extract subscriber count
        let subscriberCount: number | undefined;
        const subText = header?.subscriberCountText?.simpleText ||
            header?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.metadataParts?.[0]?.text?.content;
        if (subText) {
            subscriberCount = parseCount(subText);
        }

        // Extract video count
        let videoCount: number | undefined;
        const videoText = header?.videosCountText?.runs?.[0]?.text;
        if (videoText) {
            videoCount = parseInt(videoText.replace(/,/g, ''), 10);
        }

        // Extract channel title with multiple fallbacks
        let title = metadata.title || '';
        if (!title) {
            // Try from header
            title = header?.title || header?.channelHandleModel?.channelHandleRenderer?.title?.simpleText || '';
        }
        if (!title) {
            // Try from og:title meta tag
            const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
            title = ogTitleMatch?.[1] || '';
        }

        return {
            channelId,
            title,
            description: metadata.description || '',
            customUrl: metadata.vanityChannelUrl?.split('/').pop() || '',
            subscriberCount,
            videoCount,
            url: `https://youtube.com/channel/${channelId}`,
            thumbnails: {
                default: metadata.avatar?.thumbnails?.[0]?.url,
                high: metadata.avatar?.thumbnails?.slice(-1)[0]?.url,
            },
        };
    } catch (error) {
        throw new YouTubeToolsError(
            'Failed to parse channel info',
            ErrorCodes.PARSING_ERROR,
        );
    }
}

function parseCount(text: string): number {
    // Handle formats like "1.2K subscribers", "5M", "123"
    const match = text.match(/([\d.]+)\s*([KMB])?/i);
    if (!match) return 0;

    let num = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();

    if (suffix === 'K') num *= 1000;
    else if (suffix === 'M') num *= 1000000;
    else if (suffix === 'B') num *= 1000000000;

    return Math.round(num);
}
