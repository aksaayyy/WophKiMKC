# Android USB Debugging Setup

## Prerequisites

- Android device with USB cable
- Android Studio installed (or just Android SDK Platform Tools)
- USB debugging enabled on device

## Step 1: Enable Developer Options

1. Open **Settings** on your Android device
2. Go to **About phone**
3. Tap **Build number** 7 times
4. You'll see "You are now a developer!"

## Step 2: Enable USB Debugging

1. Go to **Settings > System > Developer options**
2. Turn on **USB debugging**
3. Connect your device via USB
4. Allow debugging when prompted on device

## Step 3: Install ADB

### macOS

```bash
# Using Homebrew
brew install android-platform-tools

# Or install Android Studio
# https://developer.android.com/studio
```

### Windows

Download Android SDK Platform Tools:
https://developer.android.com/studio/releases/platform-tools

Add to PATH or use from Android Studio terminal.

### Linux

```bash
sudo apt update
sudo apt install android-tools-adb android-tools-fastboot
```

## Step 4: Verify Connection

```bash
# Check if device is connected
adb devices

# You should see:
# List of devices attached
# xxxxxxxx    device
```

## Step 5: Build & Install

### Option A: Using the build script (Recommended)

```bash
# From project root
./start.sh android

# Or from mobile folder
cd mobile
./build-android.sh --full
```

### Option B: Manual steps

```bash
cd mobile

# 1. Install dependencies
npm install

# 2. Configure API URL for device
# Edit .env and use your computer's IP:
# API_BASE_URL=http://192.168.1.xxx:3001/api

# 3. Forward port (so device can access localhost:3001)
adb reverse tcp:3001 tcp:3001

# 4. Build and run on device
npx expo run:android
```

## Wireless Debugging (Optional)

After initial USB setup, you can debug wirelessly:

```bash
# 1. Enable wireless debugging on device
# Settings > Developer options > Wireless debugging

# 2. Pair device (one time)
adb pair IP_ADDRESS:PORT
# Enter pairing code from device

# 3. Connect
adb connect IP_ADDRESS:PORT

# 4. Disconnect USB and verify
adb devices
```

## Troubleshooting

### "No permissions" error

```bash
# Linux/macOS - restart ADB server
adb kill-server
adb start-server
adb devices
```

### "Device unauthorized"

1. Disconnect USB
2. Revoke USB debugging authorizations (Developer options)
3. Reconnect and allow debugging

### App can't connect to API

1. Ensure backend is running: `./start.sh status`
2. Check computer IP: `ifconfig` (macOS/Linux) or `ipconfig` (Windows)
3. Update `.env` with correct IP
4. Run `adb reverse tcp:3001 tcp:3001`
5. Or ensure phone and computer are on same WiFi

### Build fails

```bash
# Clear and rebuild
cd mobile
rm -rf android node_modules
npm install
npx expo prebuild --platform android
npx expo run:android
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `adb devices` | List connected devices |
| `adb install app.apk` | Install APK |
| `adb reverse tcp:3001 tcp:3001` | Forward port 3001 |
| `adb logcat` | View device logs |
| `adb shell` | Open device shell |
| `./build-android.sh --full` | Full build & install |
| `./build-android.sh --dev` | Start dev server |
