# HookClip Mobile Web App

A mobile-optimized web app that works on any phone browser - no installation required!

## Quick Start (USB Connected Device)

Your Android device is already connected via USB. Here's how to access the app:

### Option 1: Using Port Forwarding (Recommended)

```bash
# From project root
./start.sh mobile-web
```

Then on your phone:
1. Open Chrome/Samsung Internet
2. Go to: `http://localhost:4001/mobile.html`

The port forwarding makes your phone's localhost point to your computer.

### Option 2: Using IP Address (Same WiFi)

1. Make sure your phone and computer are on the **same WiFi network**
2. Find your computer's IP: `192.168.1.7`
3. On your phone browser, go to: `http://192.168.1.7:4001/mobile.html`

## Features

✅ Same functionality as desktop web app
✅ Optimized touch interface
✅ Real-time progress tracking
✅ Video player with native controls
✅ Download clips directly to phone
✅ Works offline after loading (PWA)

## Add to Home Screen (Optional)

### Android (Chrome)
1. Open the app in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Tap "Add"

### iOS (Safari)
1. Open the app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

## Troubleshooting

### "Cannot connect" or "Site not found"

**Check backend is running:**
```bash
./start.sh status
```

**Check port forwarding:**
```bash
adb reverse tcp:3001 tcp:3001
adb reverse tcp:4001 tcp:4001
```

**Check using IP method:**
- Make sure phone and computer are on same WiFi
- Use the IP address shown when running `./start.sh mobile-web`

### Videos not playing

- Make sure you have a video player app installed
- Try downloading the clip instead of streaming

## Alternative: Native App

If you prefer a native Android app:

```bash
# Install Android Studio first, then:
./start.sh build-and
```

See [mobile/ANDROID_SETUP.md](mobile/ANDROID_SETUP.md) for details.
