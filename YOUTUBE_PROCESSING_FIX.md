# YouTube Processing Fix

## Problem
The YouTube video processing was failing with the error:
```
youtube_cli.py: error: unrecognized arguments: --format json
```

## Root Cause
The issue was in the ProcessingBridge which was incorrectly passing the `--format json` argument to the unified CLI tool. The `--format json` argument is specific to the youtube_cli.py script and should be passed before the subcommand, not after.

## Solution
We implemented a proper YouTube processing flow in the ProcessingBridge:

### 1. Updated ConfigurationMapper.ts
Added YouTube-specific properties to the WebProcessingConfig interface:
- `youtubeMode?: boolean`
- `chunkDownload?: boolean`
- `advancedOptions?: { minDuration?: number; maxDuration?: number; }`

### 2. Enhanced ProcessingBridge.ts
Implemented a two-step YouTube processing flow:

#### Step 1: YouTube Video Download
- Detect YouTube URLs using pattern matching
- Download videos using youtube_cli.py with correct argument order:
  ```
  python3 youtube_cli.py --format json download --url [URL] --output-dir [DIR] --quality [QUALITY]
  ```
- Parse JSON output to get downloaded file path

#### Step 2: Video Processing
- Process the downloaded file using the unified CLI tool
- Pass all enhancement options (audio enhancement, color correction, smart selection, etc.)

### 3. Key Improvements
- Fixed argument order for youtube_cli.py
- Added proper YouTube URL detection
- Implemented proper error handling for download failures
- Added quality mapping for YouTube downloads
- Maintained backward compatibility for regular file processing

## Code Changes

### ConfigurationMapper.ts
```typescript
export interface WebProcessingConfig {
  // ... existing properties ...
  youtubeMode?: boolean
  chunkDownload?: boolean
  advancedOptions?: {
    minDuration?: number
    maxDuration?: number
  }
}
```

### ProcessingBridge.ts
Added new methods:
- `processYouTubeVideo()` - Handles YouTube-specific processing
- `downloadYouTubeVideo()` - Downloads YouTube videos using youtube_cli.py
- `processRegularVideo()` - Processes regular video files
- `mapYouTubeQuality()` - Maps quality presets for YouTube downloads
- `isYouTubeUrl()` - Detects YouTube URLs

Modified `startProcessing()` to route based on youtubeMode flag.

## Testing
Created test scripts to verify:
1. Correct argument order for youtube_cli.py
2. Proper YouTube URL detection
3. Two-step processing flow (download then process)
4. Error handling for download failures

## Benefits
1. **Fixed YouTube Processing**: YouTube videos can now be processed correctly
2. **Better Error Handling**: Clear error messages for download failures
3. **Maintained Compatibility**: Regular file processing unchanged
4. **Enhanced Flexibility**: Support for all video enhancement options with YouTube videos
5. **Proper Integration**: Seamless integration with existing job management system

## Usage
The fix is automatically applied when:
- A YouTube URL is provided as input
- The `youtubeMode` flag is set to true in the WebProcessingConfig
- The ProcessingBridge handles the rest automatically