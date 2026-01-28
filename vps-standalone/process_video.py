#!/usr/bin/env python3
"""
Video Processing Script for Video Clipper Pro
Uses FFmpeg directly for reliable video processing
"""

import argparse
import os
import sys
import time
import json
import subprocess
from pathlib import Path

def get_video_info(video_path):
    """Get video information using ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', '-show_streams', video_path
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

def create_clip(input_path, start_time, duration, output_path, platform='instagram'):
    """Create a single clip using FFmpeg"""
    try:
        # Platform-specific settings
        if platform.lower() in ['instagram', 'tiktok', 'youtube']:
            # Vertical format (9:16 aspect ratio)
            filter_complex = '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1:1[v]'
            video_map = '[v]'
        else:
            # Keep original aspect ratio
            filter_complex = '[0:v]scale=1080:-2[v]'
            video_map = '[v]'
        
        cmd = [
            'ffmpeg', '-i', input_path,
            '-ss', str(start_time),
            '-t', str(duration),
            '-filter_complex', filter_complex,
            '-map', video_map,
            '-map', '0:a?',  # Include audio if available
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            '-y', output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed: {result.stderr}")
        
        # Verify output file
        if not os.path.exists(output_path) or os.path.getsize(output_path) < 10000:  # 10KB minimum
            raise Exception(f"Output file too small or not created")
        
        return True
        
    except Exception as e:
        print(f"Failed to create clip: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description='Process video and generate clips using FFmpeg')
    parser.add_argument('--input', required=True, help='Input video file path')
    parser.add_argument('--platform', default='instagram', help='Target platform (tiktok, instagram, youtube, twitter)')
    parser.add_argument('--quality', default='high', help='Quality preset (standard, high, premium)')
    parser.add_argument('--clips', type=int, default=4, help='Number of clips to generate')
    parser.add_argument('--output-dir', required=True, help='Output directory for processed clips')
    parser.add_argument('--enhance-audio', action='store_true', help='Enable audio enhancement')
    parser.add_argument('--color-correction', action='store_true', help='Enable color correction')
    parser.add_argument('--smart-crop', action='store_true', help='Enable smart cropping')
    parser.add_argument('--smart-selection', action='store_true', help='Enable smart selection (alias for smart-crop)')
    parser.add_argument('--selection-strategy', default='hybrid', help='Selection strategy for smart selection')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    parser.add_argument('--project-id', help='Project ID for collaboration (ignored)')
    parser.add_argument('--member-id', help='Member ID for collaboration (ignored)')
    parser.add_argument('--min-duration', type=int, help='Minimum clip duration in seconds')
    parser.add_argument('--max-duration', type=int, help='Maximum clip duration in seconds')
    
    args = parser.parse_args()
    
    print("🎬 Starting Video Processing with FFmpeg...")
    if args.debug:
        print(f"[DEBUG] Arguments: {vars(args)}")
    print("Progress: 0%")
    sys.stdout.flush()
    
    # Validate input file exists
    if not os.path.exists(args.input):
        print(f"❌ Error: Input file {args.input} does not exist", file=sys.stderr)
        sys.exit(1)
    
    # Check FFmpeg availability
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        subprocess.run(['ffprobe', '-version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: FFmpeg not found. Please install FFmpeg.", file=sys.stderr)
        sys.exit(1)
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    print("Progress: 10%")
    sys.stdout.flush()
    
    # Get video information
    print("📹 Analyzing input video...")
    video_info = get_video_info(args.input)
    if not video_info:
        print("❌ Could not analyze input video", file=sys.stderr)
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
    # Use user-specified duration or intelligent defaults
    if args.min_duration and args.max_duration:
        # Use the average of min and max as the target duration
        clip_duration = (args.min_duration + args.max_duration) // 2
    elif args.min_duration:
        # Use minimum duration as the target
        clip_duration = args.min_duration
    elif args.max_duration:
        # Use maximum duration as the target
        clip_duration = args.max_duration
    else:
        # Platform-specific defaults
        platform_defaults = {
            'tiktok': 30,
            'instagram': 30,
            'youtube': 60,
            'twitter': 45
        }
        clip_duration = platform_defaults.get(args.platform.lower(), 30)
    
    # Ensure clip duration is within bounds if both are specified
    if args.min_duration and clip_duration < args.min_duration:
        clip_duration = args.min_duration
    if args.max_duration and clip_duration > args.max_duration:
        clip_duration = args.max_duration
    
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
        
        print(f"\n🎬 Processing clip {clip_number}/{args.clips}...")
        print(f"   Time: {start_time:.1f}s - {start_time + clip_duration:.1f}s")
        
        if create_clip(args.input, start_time, clip_duration, output_path, args.platform):
            file_size = os.path.getsize(output_path)
            successful_clips.append({
                'filename': output_filename,
                'start_time': start_time,
                'duration': clip_duration,
                'size': file_size
            })
            # Fix file size calculation (bytes to MB)
            print(f"   ✅ Created {output_filename} ({file_size / (1024 * 1024):.2f} MB)")
        else:
            print(f"   ❌ Failed to create {output_filename}")
        
        progress = 20 + (70 * clip_number // args.clips)
        print(f"Progress: {progress}%")
        sys.stdout.flush()
    
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
    
    print(f"\n🎉 Processing Complete!")
    print(f"✅ Successfully generated {len(successful_clips)}/{args.clips} clips")
    print(f"📁 Output directory: {args.output_dir}")
    print(f"📊 Total size: {total_size / (1024 * 1024):.2f} MB")
    
    if len(successful_clips) < args.clips:
        print(f"⚠️  Warning: Only {len(successful_clips)} out of {args.clips} clips were created successfully")
    
    for clip in successful_clips:
        print(f"   📹 {clip['filename']}: {clip['size'] / (1024 * 1024):.2f} MB")

if __name__ == '__main__':
    main()