# 🤝 Contributing to Video Clipper

First off, thank you for considering contributing to Video Clipper! 🎉

It's people like you that make Video Clipper such a great tool for content creators worldwide.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

**Our Pledge:**
- Be respectful and inclusive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards others

## 🚀 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**How to Submit a Good Bug Report:**

1. **Use a clear and descriptive title**
2. **Describe the exact steps to reproduce the problem**
3. **Provide specific examples**
4. **Describe the behavior you observed and what you expected**
5. **Include screenshots if possible**
6. **Provide system information:**
   - OS version
   - Python version
   - FFmpeg version
   - Video Clipper version

**Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**System Information:**
 - OS: [e.g. macOS 13.0]
 - Python Version: [e.g. 3.9.0]
 - FFmpeg Version: [e.g. 4.4.0]

**Additional context**
Add any other context about the problem.
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**How to Submit a Good Enhancement Suggestion:**

1. **Use a clear and descriptive title**
2. **Provide a detailed description of the suggested enhancement**
3. **Explain why this enhancement would be useful**
4. **List some examples of how it would be used**

**Template:**
```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots.
```

### 🔧 Pull Requests

**Process:**

1. Fork the repo
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests
5. Format your code
6. Commit your changes (`git commit -m '✨ Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 💻 Development Setup

### Prerequisites
- Python 3.7+
- FFmpeg
- Git

### Setup Steps

```bash
# 1. Fork and clone the repository
git clone git@github.com:your-username/Wohp_Ki_Maa_Clipper.git
cd Wohp_Ki_Maa_Clipper

# 2. Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Install development dependencies (optional)
pip install pytest black isort mypy

# 5. Run tests to verify setup
python -m pytest

# 6. Start the development server
python server.py
```

## 📏 Coding Standards

### Python Code Style

We follow **PEP 8** with some exceptions:

- **Line Length**: 100 characters max (not 79)
- **Indentation**: 4 spaces (no tabs)
- **Quotes**: Double quotes for strings
- **Imports**: Organized with isort

### Code Formatting

**Use Black for formatting:**
```bash
black .
```

**Use isort for import sorting:**
```bash
isort .
```

**Run type checking:**
```bash
mypy .
```

### Docstrings

Use Google-style docstrings:

```python
def process_video(video_path: str, num_clips: int = 5) -> List[str]:
    """Process video and generate clips.
    
    Args:
        video_path: Path to the input video file
        num_clips: Number of clips to generate (default: 5)
        
    Returns:
        List of paths to generated clip files
        
    Raises:
        FileNotFoundError: If video file doesn't exist
        ValueError: If num_clips is less than 1
    """
    pass
```

### Commit Messages

Use **Conventional Commits** format with emojis:

**Format:**
```
<emoji> <type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- ✨ `feat`: New feature
- 🐛 `fix`: Bug fix
- 📝 `docs`: Documentation changes
- 🎨 `style`: Code style changes (formatting, etc.)
- ♻️ `refactor`: Code refactoring
- ⚡ `perf`: Performance improvements
- ✅ `test`: Adding or updating tests
- 🔧 `chore`: Maintenance tasks
- 🚀 `deploy`: Deployment changes
- 🔒 `security`: Security fixes

**Examples:**
```bash
✨ feat(clipper): Add logo overlay feature
🐛 fix(cli): Fix crash when processing YouTube URLs
📝 docs(readme): Update installation instructions
🎨 style(server): Format code with black
♻️ refactor(clipper): Simplify video processing logic
⚡ perf(clipper): Optimize clip selection algorithm
✅ test(clipper): Add tests for audio enhancement
🔧 chore(deps): Update dependencies
```

### Testing

**Write tests for new features:**

```python
def test_process_video():
    """Test video processing with default settings."""
    clipper = VideoClipper(args)
    clips = clipper.process_video("test_video.mp4")
    assert len(clips) == 5
    assert all(os.path.exists(clip) for clip in clips)
```

**Run tests:**
```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=.

# Run specific test file
python -m pytest test_video_processing.py

# Run with verbose output
python -m pytest -v
```

## 📤 Submitting Changes

### Before Submitting

1. ✅ **Run all tests**: Ensure all tests pass
2. ✅ **Format code**: Use black and isort
3. ✅ **Update documentation**: If you changed functionality
4. ✅ **Add tests**: For new features
5. ✅ **Check for breaking changes**: Note in PR description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes
```

## 🎯 Areas for Contribution

Looking to contribute but not sure where to start? Here are some areas:

### 🔰 Good First Issues
- Improve error messages
- Add more unit tests
- Fix typos in documentation
- Improve CLI help text

### 🚀 Feature Requests
- Real-time preview of clips
- Cloud storage integration
- Mobile app development
- Advanced AI features

### 🐛 Bug Fixes
- Check the issues tab for bugs
- Look for `bug` label
- Try to reproduce and fix

### 📝 Documentation
- Improve README
- Add more examples
- Create video tutorials
- Translate documentation

## 💬 Getting Help

If you need help:

1. 📖 Check the [README](README.md)
2. 🔍 Search existing [issues](https://github.com/aksaayyy/Wohp_Ki_Maa_Clipper/issues)
3. 💬 Ask in [Discussions](https://github.com/aksaayyy/Wohp_Ki_Maa_Clipper/discussions)
4. 📧 Email the maintainers

## 🙏 Thank You!

Your contributions to open source make a difference. Thank you for contributing to Video Clipper! 🎉

---

<div align="center">
Made with ❤️ by the Video Clipper community
</div>
