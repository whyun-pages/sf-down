# sourceforge downloader

An easy-to-use tool to download files from SourceForge projects.

## Features
- Download files from a specified SourceForge project and path.
- Supports concurrent downloads.

## Installation

```bash
npm install sf-down
```
## Usage

### As a library

```typescript
import { download } from 'sf-down';
await download({
    project: 'your-project-name',
    paths: ['/path/to/files'],
    saveDir: './downloads',
    concurrency: 5,// Optional: number of concurrent downloads, default is 8
    reqTimeoutMs: 15000 // Optional: request timeout in milliseconds, default is 10000
});
```

### As a CLI tool

```bash
npx sf-down --project your-project-name --paths /path/to/files --dir ./downloads --concurrency 5 --timeout 15000
```