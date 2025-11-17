# CLI-Web Integration Documentation

## Overview

This document describes the complete integration between the advanced video processing CLI tool and the web application. The integration enables users to access professional-grade video processing through a user-friendly web interface while maintaining the full power of the CLI tool.

## Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Interface │────│ Processing Bridge │────│   CLI Tool      │
│                 │    │                  │    │                 │
│ - Upload UI     │    │ - Config Mapping │    │ - Video Proc.   │
│ - Progress      │    │ - Process Mgmt   │    │ - AI Features   │
│ - Downloads     │    │ - Error Handling │    │ - Enhancement   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────────────┐              │
         └──────────────│  File Manager  │──────────────┘
                        │                │
                        │ - Validation   │
                        │ - Security     │
                        │ - Storage      │
                        └────────────────┘
```

### Core Components

1. **CLIProcessManager**: Manages CLI process execution and lifecycle
2. **ConfigurationMapper**: Maps web options to CLI parameters
3. **ProcessingBridge**: Main integration layer
4. **CLIFileManager**: Handles file operations and security
5. **ProgressMonitor**: Real-time progress tracking
6. **CLIErrorHandler**: Error parsing and recovery

## Configuration

### Environment Variables

```bash
# CLI Tool Configuration
CLI_TOOL_PATH=/path/to/version2/clipper.py
PYTHON_PATH=python3
CLI_WORKING_DIR=/path/to/version2

# Processing Configuration
MAX_CONCURRENT_PROCESSES=3
PROCESS_TIMEOUT_MINUTES=30
MAX_FILE_SIZE_MB=500

# File Storage
UPLOAD_DIR=/path/to/uploads
OUTPUT_DIR=/path/to/public/processed
TEMP_DIR=/path/to/temp

# Security
JWT_SECRET=your-jwt-secret-key
DOWNLOAD_TOKEN_EXPIRY_HOURS=24
```

### CLI Tool Setup

1. **Install Dependencies**:
   ```bash
   cd version2
   pip install -r requirements.txt
   ```

2. **Install FFmpeg**:
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # CentOS/RHEL
   sudo yum install ffmpeg
   ```

3. **Verify CLI Tool**:
   ```bash
   python3 version2/clipper.py --help
   ```

## API Integration

### Enhanced Process API

**Endpoint**: `POST /api/v1/process`

**Request Body**:
```json
{
  "video_url": "https://example.com/video.mp4",
  "platform": "tiktok",
  "quality": "high",
  "clip_count": 5,
  "enhance_audio": true,
  "color_correction": true,
  "smart_selection": true
}
```

**Response**:
```json
{
  "job_id": "01JBG8TGRHQHQHQHQHQHQHQHQH",
  "status": "queued",
  "estimated_time": "3-5 minutes",
  "features_enabled": [
    "CLI Integration",
    "Smart Selection",
    "Audio Enhancement",
    "Color Correction"
  ],
  "processing_summary": {
    "platform": "TIKTOK",
    "quality": "PRO",
    "features": ["AI Smart Selection", "Audio Enhancement"],
    "estimated_time": "4 minutes"
  }
}
```

### Enhanced Status API

**Endpoint**: `GET /api/v1/status/{jobId}`

**Response**:
```json
{
  "id": "01JBG8TGRHQHQHQHQHQHQHQHQH",
  "status": "processing",
  "progress": 65,
  "stage": "enhancing",
  "message": "Applying quality enhancements...",
  "processing_source": "cli",
  "cli_metrics": {
    "overall_progress": 65,
    "current_stage": 4,
    "total_stages": 5,
    "estimated_time_remaining": 120,
    "processing_speed": 0.54,
    "elapsed_time": 180
  },
  "details": {
    "current_clip": 3,
    "total_clips": 5
  }
}
```

### Real-time Progress API

**Endpoint**: `GET /api/v1/progress/{jobId}`

Returns Server-Sent Events for real-time updates:

```
data: {"type":"progress","jobId":"123","progress":45,"stage":"processing","message":"Processing clips..."}

data: {"type":"progress","jobId":"123","progress":80,"stage":"enhancing","message":"Applying enhancements..."}

data: {"type":"progress","jobId":"123","progress":100,"stage":"completed","message":"Processing complete"}
```

## Quality Mapping

### Web to CLI Quality Mapping

| Web Quality | CLI Quality | Description |
|-------------|-------------|-------------|
| `standard`  | `social`    | Fast processing, social media optimized |
| `high`      | `pro`       | Balanced quality and speed |
| `premium`   | `cinematic` | Highest quality, slower processing |

### Platform Optimizations

| Platform | Aspect Ratio | Max Duration | Bitrate | Audio |
|----------|--------------|--------------|---------|-------|
| TikTok   | 9:16         | 60s          | 5000k   | 128k  |
| Instagram| 9:16         | 90s          | 6000k   | 128k  |
| YouTube  | 9:16         | 300s         | 8000k   | 192k  |
| Twitter  | 9:16         | 140s         | 4000k   | 128k  |

## Error Handling

### Error Categories

1. **File Errors**:
   - `FILE_NOT_FOUND`: Input file missing
   - `INVALID_FORMAT`: Unsupported video format
   - `PERMISSION_DENIED`: File access issues

2. **Processing Errors**:
   - `OUT_OF_MEMORY`: Insufficient memory
   - `PROCESSING_FAILED`: CLI processing error
   - `TIMEOUT`: Processing timeout

3. **System Errors**:
   - `CLI_NOT_FOUND`: CLI tool not available
   - `NETWORK_ERROR`: Download/upload issues

### Recovery Strategies

```typescript
// Automatic retry for transient errors
if (error.recoverable && attemptCount < maxRetries) {
  await delay(retryDelay)
  return retry(parameters)
}

// Fallback configurations
switch (fallbackAction) {
  case 'reduce_quality':
    parameters.quality = 'social'
    break
  case 'basic_processing':
    parameters.enhanceAudio = false
    parameters.colorCorrection = false
    break
}
```

## File Management

### Directory Structure

```
public/
├── processed/
│   └── {userId}/
│       └── {jobId}/
│           ├── clips/
│           │   ├── clip_1.mp4
│           │   └── clip_2.mp4
│           ├── thumbnails/
│           │   ├── clip_1_thumb.jpg
│           │   └── clip_2_thumb.jpg
│           └── metadata/
│               └── processing.json
uploads/
└── {jobId}/
    └── prepared_video.mp4
```

### Secure Downloads

Download URLs include time-limited tokens:
```
/processed/user123/job456/clip_1.mp4?token=abc123&expires=1640995200000
```

Token generation:
```typescript
const token = sha256(`${filename}:${userId}:${expiresAt}:${JWT_SECRET}`)
```

## Monitoring and Debugging

### Logging

```typescript
// Error logging
console.error('[CLI Error]', {
  jobId,
  error: error.code,
  message: error.message,
  technicalDetails: error.technicalDetails
})

// Progress logging
console.log('[CLI Progress]', {
  jobId,
  stage: progress.stage,
  progress: progress.progress,
  message: progress.message
})
```

### Metrics Collection

- Processing times by quality level
- Success/failure rates
- Error frequency by category
- Resource usage (CPU, memory)
- Concurrent job counts

### Health Checks

```bash
# Check CLI tool availability
python3 /path/to/version2/clipper.py --version

# Check FFmpeg
ffmpeg -version

# Check disk space
df -h /path/to/processed

# Check process count
ps aux | grep python | grep clipper | wc -l
```

## Performance Optimization

### Concurrency Management

```typescript
// Limit concurrent processes
const MAX_CONCURRENT = 3
if (activeProcesses.size >= MAX_CONCURRENT) {
  throw new Error('Queue full')
}

// Process prioritization
const priority = user.subscription === 'pro' ? 'high' : 'normal'
```

### Resource Management

```typescript
// Memory monitoring
const memoryUsage = process.memoryUsage()
if (memoryUsage.heapUsed > MEMORY_THRESHOLD) {
  // Trigger cleanup or reject new jobs
}

// Disk space monitoring
const diskSpace = await checkDiskSpace()
if (diskSpace.free < MIN_FREE_SPACE) {
  // Cleanup old files
}
```

### Caching Strategies

- Cache CLI process instances for reuse
- Cache file metadata to avoid re-analysis
- Cache configuration mappings
- Cache user preferences

## Security Considerations

### File Security

1. **Input Validation**:
   ```typescript
   // Validate file type
   const allowedTypes = ['.mp4', '.mov', '.avi', '.mkv']
   if (!allowedTypes.includes(fileExtension)) {
     throw new Error('Invalid file type')
   }
   
   // Validate file size
   if (fileSize > MAX_FILE_SIZE) {
     throw new Error('File too large')
   }
   ```

2. **Path Sanitization**:
   ```typescript
   // Prevent directory traversal
   const safePath = path.resolve(baseDir, userPath)
   if (!safePath.startsWith(baseDir)) {
     throw new Error('Invalid path')
   }
   ```

3. **Process Isolation**:
   ```typescript
   // Run CLI with limited privileges
   const process = spawn(pythonPath, args, {
     uid: 1000,  // Non-root user
     gid: 1000,  // Non-root group
     cwd: workingDir
   })
   ```

### Access Control

- User-based file access restrictions
- Time-limited download tokens
- Rate limiting by subscription tier
- Audit logging for all operations

## Troubleshooting

### Common Issues

1. **CLI Tool Not Found**:
   ```bash
   # Check path
   ls -la /path/to/version2/clipper.py
   
   # Check permissions
   chmod +x /path/to/version2/clipper.py
   
   # Check Python path
   which python3
   ```

2. **FFmpeg Issues**:
   ```bash
   # Check installation
   ffmpeg -version
   
   # Check codecs
   ffmpeg -codecs | grep h264
   ```

3. **Permission Errors**:
   ```bash
   # Check directory permissions
   ls -la /path/to/uploads
   ls -la /path/to/processed
   
   # Fix permissions
   chmod 755 /path/to/uploads
   chmod 755 /path/to/processed
   ```

4. **Memory Issues**:
   ```bash
   # Check memory usage
   free -h
   
   # Check swap
   swapon --show
   
   # Monitor processes
   top -p $(pgrep -f clipper)
   ```

### Debug Mode

Enable debug logging:
```bash
export DEBUG_CLI_INTEGRATION=true
export NODE_ENV=development
```

Debug output includes:
- CLI command arguments
- Process stdout/stderr
- File operations
- Error stack traces
- Performance metrics

## Deployment Checklist

### Pre-deployment

- [ ] CLI tool installed and tested
- [ ] FFmpeg installed and accessible
- [ ] Python dependencies installed
- [ ] Environment variables configured
- [ ] Directory permissions set
- [ ] Database migrations applied

### Post-deployment

- [ ] Health checks passing
- [ ] Test video processing end-to-end
- [ ] Monitor error rates
- [ ] Check file cleanup automation
- [ ] Verify download security
- [ ] Test concurrent processing

### Monitoring Setup

- [ ] Error rate alerts
- [ ] Processing time alerts
- [ ] Disk space monitoring
- [ ] Memory usage alerts
- [ ] Queue length monitoring

## Support and Maintenance

### Regular Maintenance

1. **File Cleanup**:
   ```bash
   # Clean files older than 7 days
   find /path/to/processed -type f -mtime +7 -delete
   ```

2. **Log Rotation**:
   ```bash
   # Rotate application logs
   logrotate /etc/logrotate.d/video-clipper
   ```

3. **Performance Review**:
   - Review processing times
   - Analyze error patterns
   - Check resource usage trends
   - Update quality presets if needed

### Scaling Considerations

- Horizontal scaling with multiple CLI workers
- Load balancing across processing nodes
- Shared file storage (NFS, S3)
- Database connection pooling
- CDN for file downloads

This integration provides a robust, scalable solution for connecting your advanced CLI tool to the web application while maintaining security, performance, and user experience.