# Video Clipper Pro - Workflow Integration Guide

This document explains how the 3D frontend connects to the backend CLI processing system to provide a seamless video processing experience.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   3D Frontend   │───▶│  Next.js Backend │───▶│  Python CLI Tool   │
│  (Next.js/React)│    │     (API)        │    │   (test-cli-simple)│
└─────────────────┘    └──────────────────┘    └────────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌─────────────┐         ┌─────────────────┐
                       │  Database   │         │  Video Output   │
                       │ (Supabase)  │         │   (processed/)  │
                       └─────────────┘         └─────────────────┘
```

## Workflow Steps

1. **User Interaction**: User uploads a video through the 3D frontend interface
2. **API Request**: Frontend sends a POST request to `/api/v1/process` with video and processing options
3. **Job Creation**: Backend creates a job record in the database and returns a job ID
4. **CLI Execution**: Backend spawns the Python CLI tool with the specified parameters
5. **Progress Tracking**: Frontend polls `/api/v1/progress/{jobId}` to get real-time updates
6. **Result Delivery**: When processing completes, output files are stored and made available for download

## Key Components

### 1. Frontend (3D Interface)
- Located in `src/app/` directory
- Features 3D animated components using Framer Motion
- Real-time progress updates using polling
- Responsive design for all devices

### 2. Backend API
- Located in `src/app/api/v1/` directory
- RESTful endpoints for processing, status, and progress
- Authentication using Supabase JWT tokens
- Database integration for job tracking

### 3. CLI Processing Bridge
- Located in `lib/cli/` directory
- `ProcessingBridge.ts`: Manages CLI process execution
- `ConfigurationMapper.ts`: Maps web config to CLI arguments
- `ProgressMonitor.ts`: Tracks and reports processing progress

### 4. Python CLI Tool
- `test-cli-simple.py`: Lightweight processing tool for demonstration
- Accepts video file and processing parameters
- Simulates processing with progress updates
- Outputs JSON result for integration

## How to Run the System

### Prerequisites
1. Node.js 16+ installed
2. Python 3.8+ installed
3. Supabase account (for database)

### Setup Steps

1. **Install Dependencies**:
   ```bash
   cd video-clipper-pro
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   Open your browser to `http://localhost:3000`

## Testing the Integration

Run the full workflow test:
```bash
cd video-clipper-pro
node test-full-workflow.js
```

This will:
1. Create a test video file
2. Execute the CLI tool with test parameters
3. Parse the JSON output
4. Verify that output files were created

## Customization

### Modifying Processing Options
Update the `ConfigurationMapper.ts` to add new processing options that map to CLI arguments.

### Changing CLI Tool
Update `cli-integration.config.js` to point to your actual CLI tool instead of the test version.

### Adding New Platforms
Modify the `platforms` section in `cli-integration.config.js` to add new social media platforms.

## Troubleshooting

### Common Issues

1. **Python not found**: Update the `pythonPath` in `cli-integration.config.js` to your Python executable path.

2. **CLI tool not found**: Ensure the `toolPath` in `cli-integration.config.js` points to the correct location.

3. **Permission errors**: Make sure the CLI tool has execute permissions:
   ```bash
   chmod +x test-cli-simple.py
   ```

4. **Database connection**: Verify your Supabase credentials in the environment variables.

### Logs and Debugging

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check the terminal output for detailed logs from both the Next.js server and the CLI tool.

## Future Enhancements

1. **Real-time Progress**: Implement Server-Sent Events (SSE) for real-time progress updates
2. **Advanced CLI**: Replace `test-cli-simple.py` with the full-featured `cli.py` when dependencies are resolved
3. **Webhook Integration**: Add webhook support for processing completion notifications
4. **Batch Processing**: Implement queue management for multiple concurrent jobs
5. **Enhanced UI**: Add more 3D visualizations for processing stages

## Conclusion

The Video Clipper Pro system provides a modern, visually appealing interface for video processing while maintaining robust backend functionality through CLI integration. The modular architecture allows for easy customization and extension of both frontend and backend components.