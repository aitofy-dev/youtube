# YouTube Packages Evaluation

> Last Updated: 2026-01-07
>
> Kết quả test thực tế các package YouTube hiện có

---

## 📊 Test Results Summary (Actual - 2026-01-07)

| Package | Get Videos | Get Transcript | Search | Video Info | Status |
|---------|------------|----------------|--------|------------|--------|
| **youtubei.js** | ✅ Works | ❌ Broken | ✅ Works | ✅ Works | 🟡 Partial |
| **youtube-transcript** | ❌ No | ❌ Returns empty | ❌ No | ❌ No | 🔴 Broken |
| **youtube-sr** | ❌ No | ❌ No | ✅ Works | ✅ Works | 🟡 Limited |
| **RSS Feed** | ✅ 15 videos | ❌ No | ❌ No | ❌ No | 🟢 Stable |
| **yt-dlp** | ✅ Works | ✅ Works | ❌ No | ✅ Works | 🟢 Best |

### ⚠️ Key Findings

1. **Transcript APIs có vấn đề** - YouTube đang block/thay đổi API
2. **yt-dlp là reliable nhất** nhưng cần system install
3. **RSS Feed là stable** - luôn work, nhưng giới hạn 15 videos
4. **youtubei.js** - tốt cho video/channel nhưng transcript broken

---

## 🔍 Detailed Analysis

### 1. youtubei.js ⭐ RECOMMENDED

**GitHub:** https://github.com/LuanRT/YouTube.js  
**npm:** `npm install youtubei.js`  
**Stars:** 3.5K+

**Pros:**
- ✅ Full featured - videos, channels, search, playlists
- ✅ Well maintained, active development
- ✅ TypeScript support
- ✅ No API key needed
- ✅ Channel videos pagination works!

**Cons:**
- ⚠️ API thay đổi - cần check docs
- ⚠️ Heavy (~2MB)

**Test Results:**
```
✅ Get channel videos: Works (30+ videos with pagination)
✅ Get video info: Works (title, views, duration)
✅ Search: Works
⚠️ Get transcript: API changed (need to use getBasicInfo then get captions)
```

**Usage:**
```typescript
import { Innertube } from 'youtubei.js';

const youtube = await Innertube.create();

// Get channel videos
const channel = await youtube.getChannel('CHANNEL_ID');
const videos = await channel.getVideos();

// Get video info
const video = await youtube.getInfo('VIDEO_ID');

// Search
const results = await youtube.search('query');
```

---

### 2. youtube-transcript

**GitHub:** https://github.com/Kakulukian/youtube-transcript  
**npm:** `npm install youtube-transcript`  
**Stars:** 500+

**Pros:**
- ✅ Simple, focused on transcripts
- ✅ Lightweight
- ✅ Easy to use

**Cons:**
- ❌ Transcript only, no other features
- ⚠️ Returns empty array nếu video không có captions

**Test Results:**
```
✅ Get transcript: Works (returned empty for music video - no captions)
```

**Usage:**
```typescript
import { YoutubeTranscript } from 'youtube-transcript';

const transcript = await YoutubeTranscript.fetchTranscript('VIDEO_ID');
// [{ text: '...', duration: 2.5, offset: 0 }, ...]
```

---

### 3. youtube-sr

**GitHub:** https://github.com/DevAndromeda/youtube-sr  
**npm:** `npm install youtube-sr`  
**Stars:** 200+

**Pros:**
- ✅ Good for search
- ✅ Video info works

**Cons:**
- ❌ getChannel không hoạt động (API changed)
- ❌ Không có transcript

**Test Results:**
```
✅ Search: Works (5 results)
✅ Video info: Works
❌ Get channel: Failed
```

**Usage:**
```typescript
import YouTube from 'youtube-sr';

const results = await YouTube.search('nodejs tutorial', { limit: 5 });
const video = await YouTube.getVideo('VIDEO_URL');
```

---

### 4. RSS Feed (Native)

**No package needed - just fetch()**

**Pros:**
- ✅ Không cần package
- ✅ Stable, YouTube chính thức support
- ✅ Nhanh

**Cons:**
- ❌ Chỉ trả về 15 videos gần nhất
- ❌ Thiếu metadata (views, likes, duration)

**Test Results:**
```
✅ Works - got 15 videos from Fireship channel
```

**Usage:**
```typescript
const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const xml = await fetch(url).then(r => r.text());
// Parse XML...
```

---

### 5. yt-dlp (System Command)

**Install:** `brew install yt-dlp`

**Pros:**
- ✅ Most reliable - actively maintained
- ✅ Works with everything YouTube
- ✅ Can download videos, subtitles, etc.

**Cons:**
- ⚠️ Requires system installation
- ⚠️ Slower (spawns process)
- ⚠️ Not pure JavaScript

**Usage:**
```bash
# Get video info
yt-dlp --dump-json "https://youtube.com/watch?v=VIDEO_ID"

# List channel videos
yt-dlp --flat-playlist --print "%(id)s | %(title)s" "https://youtube.com/@channel/videos"

# Download subtitles
yt-dlp --write-sub --skip-download "https://youtube.com/watch?v=VIDEO_ID"
```

---

## 🎯 Recommended Stack

### For Our Free Tools:

| Feature | Use | Why |
|---------|-----|-----|
| **Get channel videos** | `youtubei.js` | Full list with pagination |
| **Get transcript** | `youtube-transcript` | Simple, focused |
| **Video info** | `youtubei.js` or `youtube-sr` | Both work |
| **Search** | `youtube-sr` | Lightweight |
| **Fallback** | RSS Feed | No deps, always works |

### Wrapper Strategy:

```
@automate-hub/youtube-tools
├── Uses youtubei.js internally for channel/video
├── Uses youtube-transcript for transcripts
├── Falls back to RSS for simple cases
└── Provides unified, simple API
```

---

## 📝 Next Steps

1. [x] Test existing packages
2. [ ] Fix youtubei.js transcript test
3. [ ] Test với video có captions (không phải music video)
4. [ ] Build simple wrapper với unified API
5. [ ] Add CLI interface
6. [ ] Publish to npm
