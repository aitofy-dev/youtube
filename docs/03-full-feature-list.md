# YouTube Packages - Full Feature List

> Last Updated: 2026-01-07
>
> Danh sách đầy đủ các tính năng hoạt động của mỗi package

---

## 📊 Feature Matrix

| Feature | youtube-transcript-api | scrapetube | yt-dlp |
|---------|:----------------------:|:----------:|:------:|
| **Get Transcript** | ✅ | ❌ | ✅ |
| **List Languages** | ✅ | ❌ | ✅ |
| **Format Text/SRT/VTT** | ✅ | ❌ | ❌ |
| **Translate Transcript** | ✅ | ❌ | ❌ |
| **Channel Videos** | ❌ | ✅ | ✅ |
| **Sort Videos** | ❌ | ✅ | ❌ |
| **Get Shorts** | ❌ | ✅ | ❌ |
| **Get Streams** | ❌ | ✅ | ❌ |
| **Playlist** | ❌ | ✅ | ✅ |
| **Search** | ❌ | ✅ | ✅ |
| **Video Info** | ❌ | ❌ | ✅ |
| **Thumbnails** | ❌ | ❌ | ✅ |
| **Comments** | ❌ | ❌ | ✅ |
| **Video Formats** | ❌ | ❌ | ✅ |
| **Chapters** | ❌ | ❌ | ✅ |

---

## 📝 youtube-transcript-api

**Install:** `pip install youtube-transcript-api`  
**GitHub:** https://github.com/jdepoix/youtube-transcript-api

### Features hoạt động:

| # | Feature | Code Example | Output |
|---|---------|--------------|--------|
| 1 | **Fetch Transcript** | `ytt.fetch(video_id)` | 67 segments |
| 2 | **List Languages** | `ytt.list(video_id)` | Available languages |
| 3 | **Specific Language** | `ytt.fetch(video_id, languages=['en'])` | English transcript |
| 4 | **Format: Text** | `TextFormatter().format_transcript(t)` | Plain text |
| 5 | **Format: JSON** | `JSONFormatter().format_transcript(t)` | JSON array |
| 6 | **Format: SRT** | `SRTFormatter().format_transcript(t)` | SRT subtitles |
| 7 | **Format: WebVTT** | `WebVTTFormatter().format_transcript(t)` | VTT subtitles |
| 8 | **Translate** | `transcript.translate('vi')` | Vietnamese |

### Usage:

```python
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter, SRTFormatter

ytt = YouTubeTranscriptApi()

# Get transcript
transcript = ytt.fetch("VIDEO_ID")

# List available languages
for t in ytt.list("VIDEO_ID"):
    print(f"{t.language_code}: {t.language}")

# Format as text
text = TextFormatter().format_transcript(transcript)

# Format as SRT
srt = SRTFormatter().format_transcript(transcript)

# Translate to Vietnamese
transcript_list = ytt.list("VIDEO_ID")
for t in transcript_list:
    if t.is_translatable:
        vietnamese = t.translate('vi')
        print(vietnamese.fetch())
```

---

## 📺 scrapetube

**Install:** `pip install scrapetube`  
**GitHub:** https://github.com/dermasmid/scrapetube

### Features hoạt động:

| # | Feature | Code Example | Output |
|---|---------|--------------|--------|
| 1 | **Channel Videos** | `get_channel(channel_id)` | Video list |
| 2 | **Sort by Popular** | `get_channel(id, sort_by="popular")` | Sorted videos |
| 3 | **Get Shorts** | `get_channel(id, content_type="shorts")` | Shorts only |
| 4 | **Get Streams** | `get_channel(id, content_type="streams")` | Livestreams |
| 5 | **Playlist Videos** | `get_playlist(playlist_id)` | Playlist videos |
| 6 | **Search** | `get_search(query)` | Search results |

### Usage:

```python
import scrapetube

# Get channel videos
videos = scrapetube.get_channel("CHANNEL_ID", limit=50)
for video in videos:
    print(video['videoId'], video['title']['runs'][0]['text'])

# Sort by popular
popular = scrapetube.get_channel("CHANNEL_ID", sort_by="popular")

# Get shorts only
shorts = scrapetube.get_channel("CHANNEL_ID", content_type="shorts")

# Get livestreams
streams = scrapetube.get_channel("CHANNEL_ID", content_type="streams")

# Get playlist
playlist = scrapetube.get_playlist("PLAYLIST_ID")

# Search
results = scrapetube.get_search("nodejs tutorial", limit=20)
```

---

## 🎬 yt-dlp

**Install:** `pip install yt-dlp`  
**GitHub:** https://github.com/yt-dlp/yt-dlp

### Features hoạt động:

| # | Feature | Code Example | Output |
|---|---------|--------------|--------|
| 1 | **Video Info** | `extract_info(url)` | Title, duration, views, likes |
| 2 | **Video Formats** | `info['formats']` | 6+ formats |
| 3 | **Thumbnails** | `info['thumbnails']` | 42 thumbnails |
| 4 | **Subtitles List** | `info['automatic_captions']` | 157 languages |
| 5 | **Subtitle Content** | Fetch from URL | Full transcript |
| 6 | **Chapters** | `info['chapters']` | Video chapters |
| 7 | **Channel Videos** | `extract_info(channel_url)` | Video list |
| 8 | **Playlist** | `extract_info(playlist_url)` | Playlist videos |
| 9 | **Search** | `extract_info("ytsearch5:query")` | Search results |
| 10 | **Comments** | `getcomments=True` | Top comments |

### Usage:

```python
import yt_dlp

# Get video info
with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
    info = ydl.extract_info("https://youtube.com/watch?v=VIDEO_ID", download=False)
    print(f"Title: {info['title']}")
    print(f"Duration: {info['duration']}s")
    print(f"Views: {info['view_count']}")
    print(f"Likes: {info['like_count']}")
    print(f"Channel: {info['channel']}")

# Get channel videos
opts = {'quiet': True, 'extract_flat': True, 'playlistend': 50}
with yt_dlp.YoutubeDL(opts) as ydl:
    info = ydl.extract_info("https://youtube.com/@channel/videos", download=False)
    for video in info['entries']:
        print(f"{video['id']}: {video['title']}")

# Search
with yt_dlp.YoutubeDL(opts) as ydl:
    results = ydl.extract_info("ytsearch10:nodejs tutorial", download=False)
    for video in results['entries']:
        print(video['title'])

# Get comments
opts = {'quiet': True, 'getcomments': True}
with yt_dlp.YoutubeDL(opts) as ydl:
    info = ydl.extract_info("VIDEO_URL", download=False)
    for comment in info['comments'][:5]:
        print(comment['text'])

# Get subtitles
opts = {'writeautomaticsub': True, 'subtitleslangs': ['en']}
with yt_dlp.YoutubeDL(opts) as ydl:
    info = ydl.extract_info("VIDEO_URL", download=False)
    auto_subs = info['automatic_captions']
    # Get JSON3 format and fetch content
```

---

## 🎯 Recommendations

### Use Case → Package

| Use Case | Best Package | Why |
|----------|--------------|-----|
| **Get Transcript** | `youtube-transcript-api` | Formats, translate |
| **List Channel Videos** | `scrapetube` | Simple, lightweight |
| **Get Shorts/Streams** | `scrapetube` | Unique feature |
| **Video Metadata** | `yt-dlp` | Most complete |
| **Search Videos** | `scrapetube` or `yt-dlp` | Both work |
| **Get Comments** | `yt-dlp` | Only option |
| **Download Video** | `yt-dlp` | Best for this |

---

## 🔧 Combined Usage

Để có đầy đủ tính năng, sử dụng kết hợp:

```python
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import scrapetube
import yt_dlp

class YouTubeTools:
    def __init__(self):
        self.transcript_api = YouTubeTranscriptApi()
    
    def get_channel_videos(self, channel_id, limit=50):
        """Get all videos from channel"""
        return list(scrapetube.get_channel(channel_id, limit=limit))
    
    def get_transcript(self, video_id, lang='en'):
        """Get transcript as text"""
        transcript = self.transcript_api.fetch(video_id, languages=[lang])
        return TextFormatter().format_transcript(transcript)
    
    def get_video_info(self, video_id):
        """Get full video info"""
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            return ydl.extract_info(f"https://youtube.com/watch?v={video_id}", download=False)
    
    def search(self, query, limit=10):
        """Search videos"""
        return list(scrapetube.get_search(query, limit=limit))
    
    def get_comments(self, video_id, limit=10):
        """Get video comments"""
        opts = {'quiet': True, 'getcomments': True, 
                'extractor_args': {'youtube': {'max_comments': [str(limit)]}}}
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(f"https://youtube.com/watch?v={video_id}", download=False)
            return info.get('comments', [])

# Usage
tools = YouTubeTools()
videos = tools.get_channel_videos("UCsBjURrPoezykLs9EqgamOA")
transcript = tools.get_transcript("Tn6-PIqc4UM")
info = tools.get_video_info("Tn6-PIqc4UM")
```

---

## 📈 Performance Notes

| Package | Speed | Dependencies | Size |
|---------|-------|--------------|------|
| `youtube-transcript-api` | Fast | Light | ~500KB |
| `scrapetube` | Fast | Light | ~6KB |
| `yt-dlp` | Medium | Heavy | ~3MB |

---

## ⚠️ Limitations

1. **youtube-transcript-api**: Chỉ lấy transcript, không có video info
2. **scrapetube**: Không có video metadata chi tiết
3. **yt-dlp**: Heavy, có warning về EJS solver

---

## 🚀 Next Steps

1. [ ] Build Python CLI tool
2. [ ] Create Node.js wrapper (call Python)
3. [ ] Add caching layer
4. [ ] Publish to PyPI
