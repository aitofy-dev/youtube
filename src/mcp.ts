#!/usr/bin/env node
/**
 * MCP Server for YouTube Tools
 *
 * Allows Claude, ChatGPT, and other AI assistants to fetch
 * YouTube transcripts and video information.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
    getTranscript,
    getTranscriptText,
    listTranscripts,
    getVideoInfo,
    getChannelVideos,
    getChannelInfo,
    searchVideos,
} from './index.js';

// Create MCP server
const server = new Server(
    {
        name: 'youtube-tools',
        version: '0.1.0',
    },
    {
        capabilities: {
            tools: {},
        },
    },
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'get_youtube_transcript',
            description:
                'Get the transcript/subtitles of a YouTube video. Returns timestamped segments.',
            inputSchema: {
                type: 'object',
                properties: {
                    video_id: {
                        type: 'string',
                        description: 'YouTube video ID or URL (e.g., dQw4w9WgXcQ)',
                    },
                    language: {
                        type: 'string',
                        description: 'Preferred language code (e.g., en, vi). Default: en',
                    },
                },
                required: ['video_id'],
            },
        },
        {
            name: 'get_youtube_transcript_text',
            description:
                'Get the transcript of a YouTube video as plain text (no timestamps).',
            inputSchema: {
                type: 'object',
                properties: {
                    video_id: {
                        type: 'string',
                        description: 'YouTube video ID or URL',
                    },
                },
                required: ['video_id'],
            },
        },
        {
            name: 'list_youtube_transcripts',
            description: 'List available transcript languages for a YouTube video.',
            inputSchema: {
                type: 'object',
                properties: {
                    video_id: {
                        type: 'string',
                        description: 'YouTube video ID or URL',
                    },
                },
                required: ['video_id'],
            },
        },
        {
            name: 'get_youtube_video_info',
            description:
                'Get detailed information about a YouTube video (title, views, duration, etc).',
            inputSchema: {
                type: 'object',
                properties: {
                    video_id: {
                        type: 'string',
                        description: 'YouTube video ID or URL',
                    },
                },
                required: ['video_id'],
            },
        },
        {
            name: 'get_youtube_channel_videos',
            description: 'Get a list of videos from a YouTube channel.',
            inputSchema: {
                type: 'object',
                properties: {
                    channel: {
                        type: 'string',
                        description: 'Channel ID, URL, or @handle (e.g., @Fireship)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of videos to return. Default: 15',
                    },
                },
                required: ['channel'],
            },
        },
        {
            name: 'get_youtube_channel_info',
            description: 'Get information about a YouTube channel.',
            inputSchema: {
                type: 'object',
                properties: {
                    channel: {
                        type: 'string',
                        description: 'Channel ID, URL, or @handle',
                    },
                },
                required: ['channel'],
            },
        },
        {
            name: 'search_youtube_videos',
            description: 'Search for YouTube videos.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of results. Default: 10',
                    },
                },
                required: ['query'],
            },
        },
    ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'get_youtube_transcript': {
                const videoId = args?.video_id as string;
                const language = (args?.language as string) || 'en';
                const segments = await getTranscript(videoId, { languages: [language] });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(segments, null, 2),
                        },
                    ],
                };
            }

            case 'get_youtube_transcript_text': {
                const videoId = args?.video_id as string;
                const text = await getTranscriptText(videoId);
                return {
                    content: [{ type: 'text', text }],
                };
            }

            case 'list_youtube_transcripts': {
                const videoId = args?.video_id as string;
                const tracks = await listTranscripts(videoId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(tracks, null, 2),
                        },
                    ],
                };
            }

            case 'get_youtube_video_info': {
                const videoId = args?.video_id as string;
                const info = await getVideoInfo(videoId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(info, null, 2),
                        },
                    ],
                };
            }

            case 'get_youtube_channel_videos': {
                const channel = args?.channel as string;
                const limit = (args?.limit as number) || 15;
                const videos = await getChannelVideos({ channel, limit });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(videos, null, 2),
                        },
                    ],
                };
            }

            case 'get_youtube_channel_info': {
                const channel = args?.channel as string;
                const info = await getChannelInfo(channel);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(info, null, 2),
                        },
                    ],
                };
            }

            case 'search_youtube_videos': {
                const query = args?.query as string;
                const limit = (args?.limit as number) || 10;
                const results = await searchVideos({ query, limit });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(results, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${message}`,
                },
            ],
            isError: true,
        };
    }
});

// Run server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('YouTube Tools MCP Server running on stdio');
}

main().catch(console.error);
