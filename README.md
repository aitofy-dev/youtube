# @aitofy/youtube

> 🎬 Free YouTube utilities for Node.js - Get transcripts, channel videos, video info without API key

[![npm version](https://badge.fury.io/js/@aitofy%2Fyoutube.svg)](https://www.npmjs.com/package/@aitofy/youtube)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚠️ Disclaimer

This package accesses YouTube's internal APIs for educational and personal use. It may violate YouTube's Terms of Service. **Use at your own risk.** The authors are not responsible for any misuse or consequences.

---

## ✨ Features

- 📝 **Get Transcripts** - Fetch video captions/subtitles in multiple formats
- 📺 **List Channel Videos** - Get all videos from any YouTube channel
- 🔍 **Search Videos** - Search YouTube programmatically
- ℹ️ **Video Info** - Get metadata, views, duration, thumbnails
- 🤖 **MCP Integration** - Use with Claude, ChatGPT, and other AI assistants
- 🚫 **No API Key Required** - Works out of the box
- 📦 **Zero Config** - Just install and use

---

## 📦 Installation

```bash
npm install @aitofy/youtube
```

```bash
yarn add @aitofy/youtube
```

```bash
pnpm add @aitofy/youtube
```

---

## 🚀 Quick Start

### Get Transcript

```typescript
import { getTranscript, getTranscriptText } from '@aitofy/youtube';

// ✨ NEW: Now accepts both video IDs and URLs!

// Using video ID
const segments = await getTranscript('dQw4w9WgXcQ');

// Using YouTube URLs (all formats supported)
const segments = await getTranscript('https://youtu.be/dQw4w9WgXcQ');
const segments = await getTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
const segments = await getTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s');

console.log(segments);
// [
//   { start: 0.24, duration: 2.5, text: 'Never gonna give you up' },
//   { start: 2.74, duration: 2.3, text: 'Never gonna let you down' },
//   ...
// ]

// Get transcript as plain text
const text = await getTranscriptText('https://youtu.be/dQw4w9WgXcQ');
console.log(text);
// "Never gonna give you up\nNever gonna let you down\n..."
```

### Supported URL Formats

All video functions accept these URL formats:

```typescript
// ✅ Video ID
'J6OnBDmErUg'

// ✅ Short URLs
'https://youtu.be/J6OnBDmErUg'
'https://youtu.be/J6OnBDmErUg?si=xyz123'

// ✅ Watch URLs
'https://www.youtube.com/watch?v=J6OnBDmErUg'
'https://www.youtube.com/watch?v=J6OnBDmErUg&t=120s'
'https://www.youtube.com/watch?v=J6OnBDmErUg&list=PLxxx'

// ✅ Embed URLs
'https://www.youtube.com/embed/J6OnBDmErUg'

// ✅ Shorts URLs
'https://www.youtube.com/shorts/J6OnBDmErUg'

// ✅ Other formats
'https://www.youtube.com/v/J6OnBDmErUg'
'https://www.youtube.com/live/J6OnBDmErUg'
```

### Get Channel Videos

```typescript
import { getChannelVideos } from '@aitofy/youtube';

// By channel ID
const videos = await getChannelVideos('UCsBjURrPoezykLs9EqgamOA');

// By handle
const videos = await getChannelVideos('@Fireship');

// With options
const videos = await getChannelVideos({
  channel: '@Fireship',
  limit: 50,
  sortBy: 'popular', // 'newest' | 'oldest' | 'popular'
});

console.log(videos);
// [
//   { videoId: 'abc123', title: 'Video Title', viewCount: 12345, ... },
//   ...
// ]
```

### Search Videos

```typescript
import { searchVideos } from '@aitofy/youtube';

const results = await searchVideos('nodejs tutorial');

// With options
const results = await searchVideos({
  query: 'react hooks',
  limit: 20,
  sortBy: 'viewCount', // 'relevance' | 'date' | 'viewCount' | 'rating'
});
```

### Get Video Info

```typescript
import { getVideoInfo } from '@aitofy/youtube';

const info = await getVideoInfo('dQw4w9WgXcQ');
console.log(info);
// {
//   videoId: 'dQw4w9WgXcQ',
//   title: 'Rick Astley - Never Gonna Give You Up',
//   duration: '3:33',
//   viewCount: 1500000000,
//   channelTitle: 'Rick Astley',
//   thumbnails: { ... },
//   ...
// }
```

---

## 📖 API Reference

### Transcript Functions

All transcript functions accept both **video IDs** and **YouTube URLs**.

| Function | Description |
|----------|-------------|
| `getTranscript(videoIdOrUrl, options?)` | Get transcript segments |
| `getTranscriptText(videoIdOrUrl, options?)` | Get transcript as plain text |
| `getTranscriptSRT(videoIdOrUrl, options?)` | Get transcript as SRT subtitles |
| `getTranscriptVTT(videoIdOrUrl, options?)` | Get transcript as WebVTT |
| `listTranscripts(videoIdOrUrl)` | List available transcript languages |

### Channel Functions

| Function | Description |
|----------|-------------|
| `getChannelVideos(options)` | Get videos from a channel |
| `getChannelInfo(channel)` | Get channel metadata |

### Video Functions

All video functions accept both **video IDs** and **YouTube URLs**.

| Function | Description |
|----------|-------------|
| `getVideoInfo(videoIdOrUrl)` | Get detailed video info |
| `getBasicVideoInfo(videoIdOrUrl)` | Get basic video info (faster) |
| `searchVideos(query, options?)` | Search YouTube videos |

---

## 🔧 Options

### Transcript Options

```typescript
interface FetchTranscriptOptions {
  languages?: string[];      // Preferred languages, e.g. ['en', 'vi']
  preferGenerated?: boolean; // Prefer auto-generated over manual
}
```

### Channel Videos Options

```typescript
interface GetChannelVideosOptions {
  channel: string;                    // Channel ID, URL, or @handle
  limit?: number;                     // Max videos (default: 15)
  sortBy?: 'newest' | 'oldest' | 'popular';
  contentType?: 'videos' | 'shorts' | 'streams';
}
```

### Search Options

```typescript
interface SearchOptions {
  query: string;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'viewCount' | 'rating';
}
```

---

## 🎯 Use Cases

- 📊 **Content Analysis** - Analyze video transcripts for SEO
- 🤖 **AI/ML Training** - Collect transcripts for datasets
- 📱 **App Development** - Build YouTube-related apps
- 🔍 **Research** - Academic video content analysis
- ♿ **Accessibility** - Generate subtitles for accessibility

---

## 🤖 MCP Integration (Claude, ChatGPT)

Use YouTube tools directly in AI assistants via [Model Context Protocol](https://modelcontextprotocol.io/).

### Setup for Claude Desktop

1. Install the package globally:
```bash
npm install -g @aitofy/youtube
```

2. Add to Claude's config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "youtube": {
      "command": "youtube-mcp"
    }
  }
}
```

3. Restart Claude Desktop

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_youtube_transcript` | Get video transcript with timestamps |
| `get_youtube_transcript_text` | Get transcript as plain text |
| `list_youtube_transcripts` | List available languages |
| `get_youtube_video_info` | Get video metadata |
| `get_youtube_channel_videos` | List channel videos |
| `get_youtube_channel_info` | Get channel info |
| `search_youtube_videos` | Search YouTube |

### Example Usage in Claude

```
You: Get the transcript for YouTube video dQw4w9WgXcQ

Claude: [Uses get_youtube_transcript tool]
        Here's the transcript for "Never Gonna Give You Up"...
```

---

## ⚡ Rate Limiting

To avoid being blocked by YouTube:

```typescript
// Add delays between requests
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

for (const videoId of videoIds) {
  const transcript = await getTranscript(videoId);
  await sleep(1000); // Wait 1 second between requests
}
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

---

## 📄 License

MIT © [Aitofy](https://github.com/aitofy)

---

## 🙏 Credits

Inspired by:
- [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api) (Python)
- [youtubei.js](https://github.com/LuanRT/YouTube.js)
