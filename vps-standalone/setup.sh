#!/bin/bash
# Video Clipper VPS Setup Script
# Run this on your VPS to set up the video processing server

set -e

echo "🎬 Video Clipper VPS Setup"
echo "=========================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root. Creating non-root user is recommended for production."
fi

# Detect OS
if [ -f /etc/debian_version ]; then
    PKG_MANAGER="apt-get"
    echo "📦 Detected Debian/Ubuntu"
elif [ -f /etc/redhat-release ]; then
    PKG_MANAGER="yum"
    echo "📦 Detected RHEL/CentOS"
else
    echo "⚠️  Unknown OS. Please install dependencies manually."
    PKG_MANAGER=""
fi

# Install system dependencies
echo ""
echo "📦 Installing system dependencies..."
if [ "$PKG_MANAGER" = "apt-get" ]; then
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv ffmpeg
elif [ "$PKG_MANAGER" = "yum" ]; then
    sudo yum install -y python3 python3-pip ffmpeg
fi

# Check FFmpeg
echo ""
echo "🔍 Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    ffmpeg -version | head -1
    echo "✅ FFmpeg installed"
else
    echo "❌ FFmpeg not found. Please install it manually."
    exit 1
fi

# Create virtual environment
echo ""
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install yt-dlp for YouTube support
echo ""
echo "📺 Installing yt-dlp for YouTube support..."
pip install yt-dlp

# Create directories
echo ""
echo "📁 Creating directories..."
mkdir -p uploads output logs

# Set permissions
chmod +x server.py process_video.py

# Create systemd service file
echo ""
echo "⚙️  Creating systemd service..."
cat > videoclipper.service << 'EOF'
[Unit]
Description=Video Clipper VPS Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment="PATH=$(pwd)/venv/bin"
ExecStart=$(pwd)/venv/bin/python server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the server:"
echo "      source venv/bin/activate"
echo "      python server.py"
echo ""
echo "   2. For production, install the systemd service:"
echo "      sudo cp videoclipper.service /etc/systemd/system/"
echo "      sudo systemctl daemon-reload"
echo "      sudo systemctl enable videoclipper"
echo "      sudo systemctl start videoclipper"
echo ""
echo "   3. (Optional) Set up nginx reverse proxy for HTTPS"
echo ""
echo "🌐 Server will run on http://0.0.0.0:5000"
