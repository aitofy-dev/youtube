/**
 * HTTP Fetcher with retry, rate limiting, and caching
 */

import { YouTubeToolsError, ErrorCodes } from '../types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DEFAULT_HEADERS = {
    'User-Agent': DEFAULT_USER_AGENT,
    'Accept-Language': 'en-US,en;q=0.9',
    Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

export interface FetchOptions extends RequestInit {
    /** Number of retry attempts */
    retries?: number;

    /** Delay between retries in ms */
    retryDelay?: number;

    /** Request timeout in ms */
    timeout?: number;

    /** Custom headers */
    headers?: Record<string, string>;
}

// ============================================================================
// Simple Cache
// ============================================================================

const cache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(url: string): string | null {
    const entry = cache.get(url);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    cache.delete(url);
    return null;
}

function setCache(url: string, data: string): void {
    cache.set(url, { data, timestamp: Date.now() });
}

export function clearCache(): void {
    cache.clear();
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch URL with retry and error handling
 */
export async function fetchWithRetry(
    url: string,
    options: FetchOptions = {},
): Promise<string> {
    const { retries = 3, retryDelay = 1000, timeout = 30000, ...fetchOptions } = options;

    // Check cache first
    const cached = getCached(url);
    if (cached) {
        return cached;
    }

    const headers = {
        ...DEFAULT_HEADERS,
        ...options.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 429) {
                throw new YouTubeToolsError(
                    'Rate limited by YouTube. Please wait and try again.',
                    ErrorCodes.RATE_LIMITED,
                    429,
                );
            }

            if (!response.ok) {
                throw new YouTubeToolsError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    ErrorCodes.NETWORK_ERROR,
                    response.status,
                );
            }

            const text = await response.text();
            setCache(url, text);
            return text;
        } catch (error) {
            lastError = error as Error;

            // Don't retry on rate limit or abort
            if (
                error instanceof YouTubeToolsError &&
                error.code === ErrorCodes.RATE_LIMITED
            ) {
                throw error;
            }

            if ((error as Error).name === 'AbortError') {
                throw new YouTubeToolsError(
                    'Request timed out',
                    ErrorCodes.NETWORK_ERROR,
                );
            }

            // Wait before retry
            if (attempt < retries) {
                await sleep(retryDelay * (attempt + 1));
            }
        }
    }

    throw (
        lastError ||
        new YouTubeToolsError('Failed to fetch', ErrorCodes.NETWORK_ERROR)
    );
}

/**
 * Fetch and parse JSON
 */
export async function fetchJSON<T>(
    url: string,
    options?: FetchOptions,
): Promise<T> {
    const text = await fetchWithRetry(url, options);
    try {
        return JSON.parse(text) as T;
    } catch {
        throw new YouTubeToolsError(
            'Failed to parse JSON response',
            ErrorCodes.PARSING_ERROR,
        );
    }
}

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse video ID from various URL formats
 */
export function parseVideoId(input: string): string {
    // Already a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    // Try to extract from URL
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
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

/**
 * Parse channel identifier from various formats
 */
export function parseChannelId(input: string): {
    type: 'id' | 'handle' | 'custom' | 'url';
    value: string;
} {
    // Channel ID (UC...)
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(input)) {
        return { type: 'id', value: input };
    }

    // Handle (@username)
    if (input.startsWith('@')) {
        return { type: 'handle', value: input };
    }

    // URL patterns
    const patterns = [
        { regex: /youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/, type: 'id' as const },
        { regex: /youtube\.com\/@([a-zA-Z0-9_-]+)/, type: 'handle' as const },
        { regex: /youtube\.com\/c\/([a-zA-Z0-9_-]+)/, type: 'custom' as const },
        { regex: /youtube\.com\/user\/([a-zA-Z0-9_-]+)/, type: 'custom' as const },
    ];

    for (const { regex, type } of patterns) {
        const match = input.match(regex);
        if (match) {
            return { type, value: type === 'handle' ? `@${match[1]}` : match[1] };
        }
    }

    // Assume it's a custom URL or handle without @
    return { type: 'custom', value: input };
}
