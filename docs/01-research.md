# YouTube Tools - Research Notes

> Last Updated: 2026-01-07
>
> Research về cách lấy data từ YouTube không cần API key

---

## 📊 Các phương pháp lấy data

### 1. RSS Feed (Recommended for Channel Videos)

**Endpoint:**
```
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
```

**Ưu điểm:**
- ✅ Không cần API key
- ✅ Stable, ít bị block
- ✅ XML dễ parse
- ✅ Fast response

**Nhược điểm:**
- ❌ Chỉ trả về 15 videos gần nhất
- ❌ Thiếu metadata (views, likes, duration)

**Data trả về:**
```xml
<entry>
  <yt:videoId>VIDEO_ID</yt:videoId>
  <title>Video Title</title>
  <published>2026-01-01T00:00:00+00:00</published>
  <media:group>
    <media:thumbnail url="https://..." />
    <media:description>Description...</media:description>
  </media:group>
</entry>
```

---

### 2. Scraping YouTube Page

**Get Channel Videos:**
```
https://www.youtube.com/@username/videos
https://www.youtube.com/channel/CHANNEL_ID/videos
```

**Ưu điểm:**
- ✅ Lấy được tất cả videos (với pagination)
- ✅ Có đầy đủ metadata
- ✅ Không giới hạn 15 videos

**Nhược điểm:**
- ❌ Cần parse JavaScript/JSON từ HTML
- ❌ Có thể bị block nếu request nhiều
- ❌ Format có thể thay đổi

**Cách parse:**

```typescript
// Trong HTML có đoạn:
// var ytInitialData = {...JSON...};

const html = await fetch(url).then(r => r.text());
const match = html.match(/var ytInitialData = (.+?);<\/script>/);
const data = JSON.parse(match[1]);

// Navigate to video list:
// data.contents.twoColumnBrowseResultsRenderer
//     .tabs[1].tabRenderer.content
//     .richGridRenderer.contents
```

---

### 3. YouTube Internal API (youtubei)

**Endpoint:**
```
POST https://www.youtube.com/youtubei/v1/browse
```

**Request:**
```json
{
  "context": {
    "client": {
      "clientName": "WEB",
      "clientVersion": "2.20240101.00.00"
    }
  },
  "browseId": "CHANNEL_ID",
  "params": "EgZ2aWRlb3PyBgQKAjoA"  // Videos tab
}
```

**Ưu điểm:**
- ✅ Đầy đủ data nhất
- ✅ Pagination support
- ✅ Giống API chính thức

**Nhược điểm:**
- ❌ Undocumented, có thể thay đổi
- ❌ Cần reverse engineer
- ❌ Rate limiting nghiêm ngặt hơn

---

### 4. Lấy Transcript/Captions

**Phương pháp 1: Parse từ video page**

```typescript
// Trong HTML của watch page có:
// "captionTracks": [{"baseUrl": "...", "languageCode": "en", ...}]

const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`).then(r => r.text());
const captionMatch = html.match(/"captionTracks":(\[.+?\])/);
const captions = JSON.parse(captionMatch[1]);

// Download transcript
const transcriptUrl = captions[0].baseUrl;
const transcript = await fetch(transcriptUrl).then(r => r.text());
```

**Phương pháp 2: youtube-transcript package**

```typescript
import { YoutubeTranscript } from 'youtube-transcript';

const transcript = await YoutubeTranscript.fetchTranscript('VIDEO_ID');
// [{ text: "...", duration: 2.5, offset: 0 }, ...]
```

**Transcript XML format:**
```xml
<?xml version="1.0" encoding="utf-8" ?>
<transcript>
  <text start="0" dur="2.5">First line</text>
  <text start="2.5" dur="3.2">Second line</text>
</transcript>
```

---

## 📦 Existing npm Packages

### 1. youtube-transcript

```bash
npm install youtube-transcript
```

```typescript
import { YoutubeTranscript } from 'youtube-transcript';

const transcript = await YoutubeTranscript.fetchTranscript('VIDEO_ID');
```

**Pros:** Simple, focused
**Cons:** Only transcripts, no other features

---

### 2. youtubei.js

```bash
npm install youtubei.js
```

```typescript
import { Innertube } from 'youtubei.js';

const youtube = await Innertube.create();
const channel = await youtube.getChannel('CHANNEL_ID');
const videos = await channel.getVideos();
```

**Pros:** Full featured, well maintained
**Cons:** Complex, overkill for simple tasks

---

### 3. ytdl-core

```bash
npm install ytdl-core
```

```typescript
import ytdl from 'ytdl-core';

const info = await ytdl.getInfo('VIDEO_URL');
```

**Pros:** Popular, download focused
**Cons:** Heavy, not for channel data

---

### 4. youtube-sr

```bash
npm install youtube-sr
```

```typescript
import YouTube from 'youtube-sr';

const videos = await YouTube.search('keyword');
const channel = await YouTube.getChannel('CHANNEL_URL');
```

**Pros:** Search + Channel support
**Cons:** Less maintained

---

## 🔧 Recommended Stack

### Option A: Lightweight (DIY)

```typescript
// Dependencies
import { fetch } from 'undici';        // HTTP client
import { XMLParser } from 'fast-xml-parser';  // RSS parsing
import * as cheerio from 'cheerio';    // HTML parsing

// Workflow:
// 1. RSS for recent 15 videos
// 2. Scraping for full video list
// 3. Direct parsing for transcripts
```

### Option B: Using youtubei.js

```typescript
import { Innertube } from 'youtubei.js';

// All-in-one solution
// Handles auth, pagination, rate limiting
```

### Recommendation: **Option A** (Lightweight)

Lý do:
- Control được hoàn toàn
- Nhẹ hơn, ít dependencies
- Học được cách YouTube hoạt động
- Dễ maintain và customize

---

## 📝 Implementation Priority

| Feature | Priority | Difficulty | Approach |
|---------|----------|------------|----------|
| Get channel videos (15 recent) | 🔥 HIGH | Easy | RSS |
| Get channel videos (all) | HIGH | Medium | Scraping |
| Get transcript | 🔥 HIGH | Easy | Package / Scraping |
| Get video info | MEDIUM | Easy | Scraping |
| Search videos | MEDIUM | Medium | Scraping |

---

## ⚠️ Rate Limiting & Anti-Bot

### YouTube's Protection:

1. **Rate limiting** - Too many requests = temporary block
2. **Bot detection** - Need realistic headers
3. **CAPTCHA** - Extreme cases

### Best Practices:

```typescript
// 1. Use realistic User-Agent
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// 2. Add delays between requests
await sleep(1000 + Math.random() * 2000);

// 3. Rotate proxies for heavy usage
const proxy = getNextProxy();

// 4. Cache responses
const cached = cache.get(url);
if (cached) return cached;

// 5. Respect rate limits
if (response.status === 429) {
  await sleep(60000);  // Wait 1 minute
}
```

---

## 🎯 Next Steps

1. [ ] Set up package.json với TypeScript
2. [ ] Implement RSS fetcher cho channel videos
3. [ ] Implement transcript extractor
4. [ ] Add caching layer
5. [ ] Write tests
6. [ ] CLI interface
