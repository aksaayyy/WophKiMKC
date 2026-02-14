# HookClip Mobile (iOS/Android)

React Native mobile app for HookClip built with Expo.

## Features

- 📱 Native iOS/Android app
- 🎬 Create clip generation jobs
- ⚙️ Configure platform, clip count, duration, detection mode
- 📊 Real-time progress tracking
- 🎥 Video player with native controls
- 💾 Download and share clips
- 🌙 Dark theme UI

## Prerequisites

- Node.js 18+
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- Expo CLI: `npm install -g @expo/cli`

## Setup

```bash
cd mobile
npm install
```

## Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```
# For local development (iOS Simulator)
API_BASE_URL=http://localhost:3001/api

# For physical device (use your computer's IP)
API_BASE_URL=http://192.168.1.xxx:3001/api

# For production
API_BASE_URL=https://your-api-domain.com/api
```

## Running the App

### iOS Simulator

```bash
npm run ios
```

### iOS Physical Device

1. Connect your iPhone via USB
2. Open `ios/HookClipMobile.xcworkspace` in Xcode
3. Select your device and run

### Android (USB Device)

See [ANDROID_SETUP.md](ANDROID_SETUP.md) for detailed instructions.

```bash
# Quick start
./build-android.sh --full

# Or manual steps:
cd mobile

# 1. Update API URL with your computer's IP
cp .env.android .env
# Edit .env: API_BASE_URL=http://YOUR_IP:3001/api

# 2. Forward port so device can access localhost
adb reverse tcp:3001 tcp:3001

# 3. Build and run
npx expo run:android
```

### Android (Emulator)

```bash
npm run android
```

## Building for Production

### iOS (.ipa)

```bash
# Build with Expo EAS
expo build:ios

# Or build locally
npm run build:local
```

### Android (.apk/.aab)

```bash
expo build:android
```

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry
├── src/
│   ├── api/
│   │   └── client.ts       # API client
│   ├── components/
│   │   ├── UrlInput.tsx    # URL input form
│   │   ├── OptionsPanel.tsx # Settings panel
│   │   └── ProgressCard.tsx # Job progress card
│   ├── screens/
│   │   ├── HomeScreen.tsx  # Main screen
│   │   └── ClipsScreen.tsx # Clips list
│   ├── store/
│   │   └── jobStore.ts     # Zustand state
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   └── utils/
├── assets/                 # Images, icons
└── ios/                    # iOS native files (after prebuild)
```

## API Integration

The app connects to your HookClip backend API:

- `POST /api/jobs` - Create clip job
- `GET /api/jobs/:id` - Get job status
- `GET /api/clips/:jobId/:filename` - Download clip

## Troubleshooting

### "Network Error"
- Check that the API_BASE_URL is correct
- For physical devices, use your computer's IP, not localhost
- Ensure backend is running: `./start.sh status`

### iOS Build Errors
```bash
cd ios && pod install --repo-update
```

### Clear Cache
```bash
npx expo start --clear
```

## License

MIT
