#!/usr/bin/env python3
"""
Video Clipper - Standalone VPS Server
No external database required - uses local JSON storage
"""

import os
import sys
import json
import uuid
import time
import threading
import subprocess
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
JOBS_FILE = 'jobs.json'
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'webm'}

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Thread-safe job storage
jobs_lock = threading.Lock()

def load_jobs():
    """Load jobs from JSON file."""
    try:
        if os.path.exists(JOBS_FILE):
            with open(JOBS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading jobs: {e}")
    return {}

def save_jobs(jobs):
    """Save jobs to JSON file."""
    try:
        with open(JOBS_FILE, 'w') as f:
            json.dump(jobs, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving jobs: {e}")

def update_job(job_id, updates):
    """Update a job's status."""
    with jobs_lock:
        jobs = load_jobs()
        if job_id in jobs:
            jobs[job_id].update(updates)
            jobs[job_id]['updated_at'] = datetime.now().isoformat()
            save_jobs(jobs)
            return jobs[job_id]
    return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_video_task(job_id, input_path, output_dir, options):
    """Background task to process video."""
    try:
        update_job(job_id, {'status': 'processing', 'progress': 10, 'message': 'Starting...'})
        
        # Build FFmpeg-based processing command
        # First try local process_video.py in same directory
        python_script = Path(__file__).parent / 'process_video.py'
        
        # Fallback to scripts directory
        if not python_script.exists():
            python_script = Path(__file__).parent.parent / 'scripts' / 'process_video.py'
        
        # Fallback to video-clipper-pro scripts
        if not python_script.exists():
            python_script = Path(__file__).parent.parent / 'video-clipper-pro' / 'scripts' / 'process_video.py'
        
        # Final fallback to version2
        if not python_script.exists():
            python_script = Path(__file__).parent.parent / 'version2' / 'scripts' / 'process_video.py'
        
        if not python_script.exists():
            raise Exception(f"Processing script not found. Tried: {Path(__file__).parent / 'process_video.py'}")
        
        cmd = [
            sys.executable, str(python_script),
            '--input', input_path,
            '--output-dir', output_dir,
            '--clips', str(options.get('clips', 3)),
            '--platform', options.get('platform', 'instagram'),
            '--quality', options.get('quality', 'high')
        ]
        
        if options.get('min_duration'):
            cmd.extend(['--min-duration', str(options['min_duration'])])
        if options.get('max_duration'):
            cmd.extend(['--max-duration', str(options['max_duration'])])
        if options.get('enhance_audio'):
            cmd.append('--enhance-audio')
        if options.get('smart_selection'):
            cmd.append('--smart-selection')
        
        update_job(job_id, {'progress': 20, 'message': 'Processing video...'})
        
        # Run the processing
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Monitor progress from output
        for line in process.stdout:
            line = line.strip()
            if 'Progress:' in line:
                try:
                    progress = int(line.split('Progress:')[1].strip().replace('%', ''))
                    update_job(job_id, {'progress': progress})
                except:
                    pass
            elif line:
                update_job(job_id, {'message': line[:100]})
        
        process.wait()
        
        if process.returncode == 0:
            # Get output files
            output_files = []
            for f in os.listdir(output_dir):
                if f.endswith('.mp4'):
                    file_path = os.path.join(output_dir, f)
                    output_files.append({
                        'filename': f,
                        'url': f'/api/download/{job_id}/{f}',
                        'size': os.path.getsize(file_path)
                    })
            
            update_job(job_id, {
                'status': 'completed',
                'progress': 100,
                'message': 'Processing complete!',
                'output_files': output_files,
                'completed_at': datetime.now().isoformat()
            })
        else:
            update_job(job_id, {
                'status': 'failed',
                'progress': 0,
                'message': 'Processing failed'
            })
            
    except Exception as e:
        update_job(job_id, {
            'status': 'failed',
            'progress': 0,
            'message': f'Error: {str(e)}'
        })

# ============ API Routes ============

@app.route('/')
def index():
    """Health check and info."""
    return jsonify({
        'service': 'Video Clipper VPS',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'upload': 'POST /api/upload',
            'process': 'POST /api/process',
            'status': 'GET /api/status/<job_id>',
            'download': 'GET /api/download/<job_id>/<filename>',
            'jobs': 'GET /api/jobs'
        }
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a video file."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'Invalid file type. Allowed: {ALLOWED_EXTENSIONS}'}), 400
    
    # Generate unique filename
    file_id = str(uuid.uuid4())[:8]
    filename = secure_filename(file.filename)
    safe_filename = f"{file_id}_{filename}"
    filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
    
    file.save(filepath)
    
    return jsonify({
        'success': True,
        'file_id': file_id,
        'filename': safe_filename,
        'filepath': filepath,
        'size': os.path.getsize(filepath)
    })

@app.route('/api/process', methods=['POST'])
def process_video():
    """Start video processing job."""
    data = request.get_json() or {}
    
    # Get input file path
    filepath = data.get('filepath')
    if not filepath or not os.path.exists(filepath):
        return jsonify({'error': 'Invalid or missing filepath'}), 400
    
    # Create job
    job_id = str(uuid.uuid4())
    output_dir = os.path.join(OUTPUT_FOLDER, job_id)
    os.makedirs(output_dir, exist_ok=True)
    
    job = {
        'id': job_id,
        'status': 'queued',
        'progress': 0,
        'message': 'Job queued',
        'input_file': filepath,
        'output_dir': output_dir,
        'options': {
            'clips': data.get('clips', 3),
            'platform': data.get('platform', 'instagram'),
            'quality': data.get('quality', 'high'),
            'min_duration': data.get('min_duration'),
            'max_duration': data.get('max_duration'),
            'enhance_audio': data.get('enhance_audio', False),
            'smart_selection': data.get('smart_selection', False)
        },
        'created_at': datetime.now().isoformat(),
        'output_files': []
    }
    
    # Save job
    with jobs_lock:
        jobs = load_jobs()
        jobs[job_id] = job
        save_jobs(jobs)
    
    # Start processing in background
    thread = threading.Thread(
        target=process_video_task,
        args=(job_id, filepath, output_dir, job['options'])
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'success': True,
        'job_id': job_id,
        'status_url': f'/api/status/{job_id}'
    })

@app.route('/api/status/<job_id>')
def get_status(job_id):
    """Get job status."""
    with jobs_lock:
        jobs = load_jobs()
        job = jobs.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify(job)

@app.route('/api/jobs')
def list_jobs():
    """List all jobs."""
    with jobs_lock:
        jobs = load_jobs()
    
    # Sort by created_at descending
    sorted_jobs = sorted(
        jobs.values(),
        key=lambda x: x.get('created_at', ''),
        reverse=True
    )
    
    return jsonify({
        'jobs': sorted_jobs[:50],  # Last 50 jobs
        'total': len(jobs)
    })

@app.route('/api/download/<job_id>/<filename>')
def download_file(job_id, filename):
    """Download processed file."""
    output_dir = os.path.join(OUTPUT_FOLDER, job_id)
    filepath = os.path.join(output_dir, secure_filename(filename))
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath, as_attachment=True)

@app.route('/api/youtube', methods=['POST'])
def process_youtube():
    """Process YouTube video."""
    data = request.get_json() or {}
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'YouTube URL required'}), 400
    
    # Create job
    job_id = str(uuid.uuid4())
    output_dir = os.path.join(OUTPUT_FOLDER, job_id)
    download_dir = os.path.join(UPLOAD_FOLDER, job_id)
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(download_dir, exist_ok=True)
    
    job = {
        'id': job_id,
        'status': 'downloading',
        'progress': 0,
        'message': 'Downloading YouTube video...',
        'youtube_url': url,
        'output_dir': output_dir,
        'options': {
            'clips': data.get('clips', 3),
            'platform': data.get('platform', 'instagram'),
            'quality': data.get('quality', 'high')
        },
        'created_at': datetime.now().isoformat(),
        'output_files': []
    }
    
    with jobs_lock:
        jobs = load_jobs()
        jobs[job_id] = job
        save_jobs(jobs)
    
    # Start download and processing in background
    def youtube_task():
        try:
            # Download with yt-dlp
            update_job(job_id, {'progress': 5, 'message': 'Downloading video...'})
            
            download_path = os.path.join(download_dir, 'video.mp4')
            cmd = [
                'yt-dlp',
                '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                '-o', download_path,
                '--no-playlist',
                url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            
            if result.returncode != 0:
                update_job(job_id, {'status': 'failed', 'message': 'Download failed'})
                return
            
            # Find downloaded file
            if not os.path.exists(download_path):
                # yt-dlp might have added extension
                for f in os.listdir(download_dir):
                    if f.endswith(('.mp4', '.mkv', '.webm')):
                        download_path = os.path.join(download_dir, f)
                        break
            
            update_job(job_id, {
                'status': 'processing',
                'progress': 30,
                'message': 'Processing video...',
                'input_file': download_path
            })
            
            # Process the downloaded video
            process_video_task(job_id, download_path, output_dir, job['options'])
            
        except Exception as e:
            update_job(job_id, {'status': 'failed', 'message': str(e)})
    
    thread = threading.Thread(target=youtube_task)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'success': True,
        'job_id': job_id,
        'status_url': f'/api/status/{job_id}'
    })

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5001, help='Port to run on')
    args = parser.parse_args()
    
    print("🎬 Video Clipper VPS Server")
    print(f"📁 Uploads: {UPLOAD_FOLDER}/")
    print(f"📁 Output: {OUTPUT_FOLDER}/")
    print(f"🌐 Running on http://0.0.0.0:{args.port}")
    app.run(host='0.0.0.0', port=args.port, debug=False, threaded=True)
