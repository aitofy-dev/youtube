# Contributing to youtube-tools

Thank you for your interest in contributing! 🎉

## Quick Start

```bash
# Clone the repo
git clone https://github.com/aitofy-dev/youtube.git
cd youtube-tools

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Development

### Project Structure

```
src/
├── index.ts          # Main exports
├── types.ts          # TypeScript types
├── video/
│   ├── get-transcript.ts
│   ├── get-info.ts
│   └── search.ts
├── channel/
│   ├── get-videos.ts
│   └── get-info.ts
└── utils/
    └── fetcher.ts
```

### Adding a New Feature

1. Create a new file in the appropriate directory
2. Export from `src/index.ts`
3. Add tests in `tests/`
4. Update README.md

## Pull Request Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Code Style

- Use TypeScript
- Follow existing code style
- Add JSDoc comments for public functions
- No `any` types

## Reporting Bugs

Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Node.js version
- Package version

## Feature Requests

Open an issue with:
- Description of the feature
- Use case / motivation
- Proposed API (if applicable)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
