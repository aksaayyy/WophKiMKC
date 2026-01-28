from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="video-clipper",
    version="0.1.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A tool to create short video clips from longer videos with captions and effects",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/video-clipper",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "moviepy>=1.0.3",
        "numpy>=1.19.0",
        "opencv-python>=4.5.0",
        "Pillow>=8.0.0",
        "tqdm>=4.50.0",
    ],
    extras_require={
        "whisper": ["openai-whisper>=1.0.0"],
        "watch": ["watchdog>=2.0.0"],
        "dev": [
            "pytest>=6.0.0",
            "black>=21.0",
            "isort>=5.0.0",
            "mypy>=0.800",
        ],
    },
    entry_points={
        "console_scripts": [
            "video-clipper=clipper:main",
        ],
    },
)
