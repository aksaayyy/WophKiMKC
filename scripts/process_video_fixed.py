#!/usr/bin/env python3
"""
Fixed Video Processing Script for Video Clipper Pro
Properly processes videos into clips with real content
"""

import argparse
import os
import sys
import time
import json
import shutil
import subprocess
from pathlib import Path

def get_video_info(input_file):
    """Get video information using ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', '-show_streams', input_file
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            raise Exception(f"ffprobe failed: {result.stderr}")
        
        info = json.loads(result.stdout)
        video_stream = next((s for s in info['streams'] if s['codec_type'] == 'video'), None)
        
        if not video_stream:
            raise Exception("No video stream found")
        
        return {
            'duration': float(info['format']['duration']),
            'width': video_stream['width'],
            'height': video_stream['height'],
            'fps': eval(video_stream.get('r_frame_rate', '30/1'))
        }
    except Exception as e:
        print(f"Error getting video info: {e}", file=sys.stderr)
        return None

def create_instagram_clip(input_file, start_time, duration, output_file, clip_number):
    """Create a single Instagram-format clip"""
    try:
        # Instagram format: 1080x1920 (9:16 aspect ratio)
        cmd = [
            'ffmpeg', '-i', input_file,
            '-ss', str(start_time),
            '-t', str(duration),
            '-filter_complex', 
            '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1:1[v]',
            '-map', '[v]',
            '-map', '0:a?',  # Include audio if available
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            '-y', output_file
        ]
        
        print(f"Creating clip {clip_number}: {start_time}s-{start_time + duration}s")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed for clip {clip_number}: {result.stderr}")
        
        # Verify the output file was created and has reasonable size
        if not os.path.exists(output_file):
            raise Exception(f"Output file {output_file} was not created")
        
        file_size = os.path.getsize(output_file)
        if file_size < 100000:  # Less than 100KB is suspicious
            raise Exception(f"Output file {output_file} is too small ({file_size} bytes)")
        
        print(f"✅ Clip {clip_number} created: {file_size / 1024 / 1024:.2f} MB")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create clip {clip_number}: {e}", file=sys.stderr)
        return False

def create_tiktok_clip(input_file, start_time, duration, output_file, clip_number):
    """Create a single TikTok-format clip"""
    try:
        # TikTok format: 1080x1920 (9:16 aspect ratio) - same as Instagram
        return create_instagram_clip(input_file, start_time, duration, output_file, clip_number)
    except Exception as e:
        print(f"❌ Failed to create TikTok clip {clip_number}: {e}", file=sys.stderr)
        return False

def create_youtube_clip(input_file, start_time, duration, output_file, clip_number):
    """Create a single YouTube Shorts clip"""
    try:
        # YouTube Shorts: 1080x1920 (9:16 aspect ratio)
        return create_instagram_clip(input_file, start_time, duration, output_file, clip_number)
    except Exception as e:
        print(f"❌ Failed to create YouTube clip {clip_number}: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description='Process video and generate clips with real content')
    parser.add_argument('--input', required=True, help='Input video file path')
    parser.add_argument('--platform', default='instagram', help='Target platform (tiktok, instagram, youtube, twitter)')
    parser.add_argument('--quality', default='high', help='Quality preset (standard, high, premium)')
    parser.add_argument('--clips', type=int, default=4, help='Number of clips to generate')
    parser.add_argument('--output-dir', required=True, help='Output directory for processed clips')
    parser.add_argument('--enhance-audio', action='store_true', help='Enable audio enhancement')
    parser.add_argument('--color-correction', action='store_true', help='Enable color correction')
    parser.add_argument('--smart-crop', action='store_true', help='Enable smart cropping')
    parser.add_argument('--min-duration', type=int, help='Minimum clip duration in seconds')
    parser.add_argument('--max-duration', type=int, help='Maximum clip duration in seconds')
    
    args = parser.parse_args()
    
    print("🎬 Starting Video Processing with Real Content...")
    print("Progress: 0%")
    sys.stdout.flush()
    
    # Validate input file exists
    if not os.path.exists(args.input):
        print(f"❌ Error: Input file {args.input} does not exist", file=sys.stderr)
        sys.exit(1)
    
    # Check if ffmpeg is available
    if not shutil.which('ffmpeg'):
        print("❌ Error: ffmpeg not found. Please install ffmpeg.", file=sys.stderr)
        sys.exit(1)
    
    if not shutil.which('ffprobe'):
        print("❌ Error: ffprobe not found. Please install ffmpeg.", file=sys.stderr)
        sys.exit(1)
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    print("Progress: 10%")
    sys.stdout.flush()
    
    # Get video information
    print("📹 Analyzing input video...")
    video_info = get_video_info(args.input)
    if not video_info:
        print("❌ Error: Could not analyze input video", file=sys.stderr)
        sys.exit(1)
    
    duration = video_info['duration']
    width = video_info['width']
    height = video_info['height']
    fps = video_info['fps']
    
    print(f"   Duration: {duration:.1f}s")
    print(f"   Resolution: {width}x{height}")
    print(f"   Frame Rate: {fps:.1f} fps")
    
    print("Progress: 20%")
    sys.stdout.flush()
    
    # Calculate clip timings with min/max duration constraints
    clip_duration = 15  # Default clip duration
    
    # Apply min/max duration constraints if specified
    if args.min_duration:
        clip_duration = max(clip_duration, args.min_duration)
    if args.max_duration:
        clip_duration = min(clip_duration, args.max_duration)
    
    # Ensure clip duration doesn't exceed video duration
    if duration < clip_duration:
        print(f"⚠️  Warning: Video is shorter than {clip_duration}s, using full duration")
        clip_duration = duration
    
    # Distribute clips evenly across the video
    if duration <= clip_duration * args.clips:
        # Short video: create overlapping clips
        clip_starts = [i * (duration / args.clips) for i in range(args.clips)]
    else:
        # Long video: create clips from different sections
        section_size = (duration - clip_duration) / (args.clips - 1) if args.clips > 1 else 0
        clip_starts = [i * section_size for i in range(args.clips)]
    
    print(f"📋 Creating {args.clips} clips of {clip_duration}s each...")
    
    # Process each clip
    successful_clips = []
    for i in range(args.clips):
        clip_number = i + 1
        start_time = clip_starts[i]
        
        # Ensure we don't go beyond video duration
        if start_time + clip_duration > duration:
            start_time = max(0, duration - clip_duration)
        
        output_filename = f"clip_{clip_number}_{args.platform}.mp4"
        output_path = os.path.join(args.output_dir, output_filename)
        
        print(f"\\n🎬 Processing clip {clip_number}/{args.clips}...")
        
        # Create clip based on platform
        success = False
        if args.platform.lower() in ['instagram', 'insta']:
            success = create_instagram_clip(args.input, start_time, clip_duration, output_path, clip_number)
        elif args.platform.lower() in ['tiktok', 'tt']:
            success = create_tiktok_clip(args.input, start_time, clip_duration, output_path, clip_number)
        elif args.platform.lower() in ['youtube', 'yt', 'shorts']:
            success = create_youtube_clip(args.input, start_time, clip_duration, output_path, clip_number)
        else:
            # Default to Instagram format
            success = create_instagram_clip(args.input, start_time, clip_duration, output_path, clip_number)
        
        if success:
            successful_clips.append({
                'filename': output_filename,
                'start_time': start_time,
                'duration': clip_duration,
                'size': os.path.getsize(output_path)
            })
        
        progress = 20 + (70 * clip_number // args.clips)
        print(f"Progress: {progress}%")
        sys.stdout.flush()
    
    print("\\n📊 Finalizing processing...")
    print("Progress: 90%")
    sys.stdout.flush()
    
    # Create metadata
    total_size = sum(clip['size'] for clip in successful_clips)
    
    metadata = {
        'input_file': os.path.basename(args.input),
        'input_duration': duration,
        'input_resolution': f"{width}x{height}",
        'platform': args.platform,
        'quality': args.quality,
        'clips_requested': args.clips,
        'clips_generated': len(successful_clips),
        'total_size': total_size,
        'clip_duration': clip_duration,
        'clips': successful_clips,
        'enhancements': {
            'audio': args.enhance_audio,
            'color_correction': args.color_correction,
            'smart_crop': args.smart_crop
        },
        'processing_complete': True,
        'processing_method': 'ffmpeg_direct',
        'has_real_content': True,
        'timestamp': time.time()
    }
    
    metadata_file = os.path.join(args.output_dir, 'metadata.json')
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("Progress: 100%")
    sys.stdout.flush()
    
    print(f"\\n🎉 Processing Complete!")
    print(f"✅ Successfully generated {len(successful_clips)}/{args.clips} clips")
    print(f"📁 Output directory: {args.output_dir}")
    print(f"📊 Total size: {total_size / 1024 / 1024:.2f} MB")
    
    if len(successful_clips) < args.clips:
        print(f"⚠️  Warning: Only {len(successful_clips)} out of {args.clips} clips were created successfully")
    
    for clip in successful_clips:
        print(f"   📹 {clip['filename']}: {clip['size'] / 1024 / 1024:.2f} MB")

if __name__ == '__main__':
    main()