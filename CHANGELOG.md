# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-11

### Added
- ✨ **URL Parsing Support** - All video functions now accept YouTube URLs in addition to video IDs
  - Supported formats: `youtu.be/ID`, `youtube.com/watch?v=ID`, `youtube.com/embed/ID`, `youtube.com/shorts/ID`, `youtube.com/v/ID`, `youtube.com/live/ID`
  - Works with query parameters (e.g., `?v=ID&t=120s`, `?v=ID&list=...`)
  - Automatically extracts video ID from any supported URL format
- New `extractVideoId()` utility for normalizing video ID/URL inputs
- `INVALID_INPUT` error code for better error handling

### Changed
- 🔧 `getTranscript()`, `getTranscriptText()`, `getTranscriptSRT()`, `getTranscriptVTT()`, `listTranscripts()` now accept URLs
- 🔧 `getVideoInfo()` and `getBasicVideoInfo()` now accept URLs
- Updated function signatures to accept `videoIdOrUrl: string` parameter

### Technical
- Unified URL parsing logic in `src/utils/extract-video-id.ts`
- Comprehensive test coverage for all URL formats
- Better error messages for invalid inputs


## [0.1.1] - 2026-01-07

### Fixed
- `getChannelVideos()` now returns `channelId` and `channelTitle` for all videos
- `getChannelVideos()` now supports pagination to fetch more than 30 videos using continuation tokens
- `getChannelInfo()` improved title extraction with multiple fallback methods

### Changed
- Internal `parseVideoRenderer()` now accepts channel context for consistent metadata

## [0.1.0] - 2026-01-07

### Added
- Initial release
- `getTranscript()` - Fetch video transcript segments
- `getTranscriptText()` - Get transcript as plain text
- `getTranscriptSRT()` - Get transcript as SRT format
- `getTranscriptVTT()` - Get transcript as WebVTT format
- `listTranscripts()` - List available transcript languages
- `getChannelVideos()` - Get videos from a channel
- `getChannelInfo()` - Get channel metadata
- `getVideoInfo()` - Get detailed video information
- `getBasicVideoInfo()` - Get basic video info (faster)
- `searchVideos()` - Search YouTube videos

### Technical
- Pure TypeScript implementation
- Uses YouTube Innertube API (no API key required)
- ESM and CommonJS support
- Full TypeScript type definitions
