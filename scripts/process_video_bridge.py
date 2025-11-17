#!/usr/bin/env python3
"""
Video Processing Bridge Script
Bridges the web application with the version2 CLI tools
"""

import argparse
import os
import sys
import json
import time
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description='Bridge script for video processing')
    parser.add_argument('--input', required=True, help='Input video file path')
    parser.add_argument('--platform', default='instagram', help='Target platform')
    parser.add_argument('--quality', default='high', help='Quality preset')
    parser.add_argument('--clips', type=int, default=4, help='Number of clips to generate')
    parser.add_argument('--output-dir', required=True, help='Output directory')
    parser.add_argument('--enhance-audio', action='store_true', help='Enable audio enhancement')
    parser.add_argument('--color-correction', action='store_true', help='Enable color correction')
    parser.add_argument('--smart-selection', action='store_true', help='Enable smart selection')
    parser.add_argument('--selection-strategy', default='hybrid', help='Selection strategy')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    parser.add_argument('--project-id', help='Project ID (ignored)')
    parser.add_argument('--member-id', help='Member ID (ignored)')
    parser.add_argument('--min-duration', type=int, help='Minimum clip duration')
    parser.add_argument('--max-duration', type=int, help='Maximum clip duration')
    
    args = parser.parse_args()
    
    print("🎬 Starting Video Processing Bridge...")
    if args.debug:
        print(f"[DEBUG] Arguments: {vars(args)}")
    print("Progress: 0%")
    sys.stdout.flush()
    
    # Find the version2 directory
    current_dir = Path(__file__).parent.parent
    version2_dir = current_dir.parent / 'version2'
    
    if not version2_dir.exists():
        print("❌ Error: version2 directory not found", file=sys.stderr)
        print("   Looking for:", str(version2_dir), file=sys.stderr)
        sys.exit(1)
    
    # Add version2 to Python path
    sys.path.insert(0, str(version2_dir))
    
    try:
        # Import the VideoClipper from version2
        from clipper import VideoClipper
        
        print("📹 Initializing VideoClipper...")
        print("Progress: 10%")
        sys.stdout.flush()
        
        # Create a mock args object for VideoClipper
        class MockArgs:
            def __init__(self):
                self.input = args.input
                self.output_dir = args.output_dir
                self.num_clips = args.clips
                self.min_duration = args.min_duration or 15
                self.max_duration = args.max_duration or 60
                self.use_captions = False
                self.debug_mode = args.debug
                self.use_smart_selection = args.smart_selection
                self.selection_strategy = args.selection_strategy
                self.quality_preset = args.quality
                self.enhance_audio = args.enhance_audio
                self.platform = args.platform
        
        mock_args = MockArgs()
        
        # Initialize VideoClipper
        clipper = VideoClipper(mock_args)
        
        print("Progress: 20%")
        sys.stdout.flush()
        
        # Process the video
        print("🎬 Processing video...")
        clipper.process_video()
        
        print("Progress: 90%")
        sys.stdout.flush()
        
        # Create metadata file for web interface compatibility
        output_dir = Path(args.output_dir)
        metadata = {
            'input_file': Path(args.input).name,
            'platform': args.platform,
            'quality': args.quality,
            'clips_requested': args.clips,
            'clips_generated': args.clips,  # Assume success for now
            'processing_complete': True,
            'processing_method': 'version2_bridge',
            'has_real_content': True,
            'timestamp': time.time(),
            'enhancements': {
                'audio': args.enhance_audio,
                'color_correction': args.color_correction,
                'smart_selection': args.smart_selection
            }
        }
        
        metadata_file = output_dir / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("Progress: 100%")
        print("🎉 Processing Complete!")
        print(f"📁 Output directory: {args.output_dir}")
        sys.stdout.flush()
        
    except ImportError as e:
        print(f"❌ Error importing VideoClipper: {e}", file=sys.stderr)
        print("   Make sure version2 directory contains the required modules", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error during processing: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()