#!/usr/bin/env python3
"""
Face detection script using MediaPipe.
Samples frames from a video at a specified interval and outputs face detections as JSON.
"""

import argparse
import json
import sys

import cv2
import mediapipe as mp


def detect_faces_legacy(cap, width, height, fps, interval_frames, max_faces):
    """Use legacy MediaPipe API (0.8.x - 0.9.x)"""
    mp_face_detection = mp.solutions.face_detection
    detections = []

    with mp_face_detection.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.5
    ) as face_detection:
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % interval_frames == 0:
                current_time = frame_idx / fps

                # Convert BGR to RGB for MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = face_detection.process(rgb_frame)

                faces = []
                if results.detections:
                    for i, detection in enumerate(results.detections):
                        if i >= max_faces:
                            break
                        bbox = detection.location_data.relative_bounding_box
                        faces.append({
                            "x": round(float(bbox.xmin), 4),
                            "y": round(float(bbox.ymin), 4),
                            "w": round(float(bbox.width), 4),
                            "h": round(float(bbox.height), 4),
                            "confidence": round(float(detection.score[0]), 4)
                        })

                detections.append({
                    "time": round(current_time, 3),
                    "faces": faces
                })

            frame_idx += 1
    
    return detections


def detect_faces_new(cap, width, height, fps, interval_frames, max_faces):
    """Use new MediaPipe API (0.10.x+)"""
    from mediapipe.tasks.python.vision import FaceDetector, FaceDetectorOptions
    from mediapipe.tasks.python.core import BaseOptions
    import mediapipe.tasks.python.vision as mp_vision
    
    detections = []
    
    # Use default model (no asset path needed for built-in model)
    options = FaceDetectorOptions(
        min_detection_confidence=0.5
    )
    
    with FaceDetector.create_from_options(options) as detector:
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % interval_frames == 0:
                current_time = frame_idx / fps

                # Convert BGR to RGB for MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                results = detector.detect(mp_image)

                faces = []
                if results.detections:
                    for i, detection in enumerate(results.detections):
                        if i >= max_faces:
                            break
                        bbox = detection.bounding_box
                        faces.append({
                            "x": round(float(bbox.origin_x) / width, 4),
                            "y": round(float(bbox.origin_y) / height, 4),
                            "w": round(float(bbox.width) / width, 4),
                            "h": round(float(bbox.height) / height, 4),
                            "confidence": round(float(detection.categories[0].score), 4)
                        })

                detections.append({
                    "time": round(current_time, 3),
                    "faces": faces
                })

            frame_idx += 1
    
    return detections


def main():
    parser = argparse.ArgumentParser(description="Detect faces in a video using MediaPipe.")
    parser.add_argument("video_path", help="Path to the input video file")
    parser.add_argument("--interval", type=float, default=0.5, help="Sampling interval in seconds (default: 0.5)")
    parser.add_argument("--max-faces", type=int, default=4, help="Maximum number of faces to detect per frame (default: 4)")
    args = parser.parse_args()

    cap = cv2.VideoCapture(args.video_path)
    if not cap.isOpened():
        print(json.dumps({"error": f"Could not open video: {args.video_path}"}), file=sys.stderr)
        sys.exit(1)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    interval_frames = int(fps * args.interval)
    if interval_frames < 1:
        interval_frames = 1

    # Detect which API to use
    try:
        mp.solutions.face_detection
        use_legacy = True
    except AttributeError:
        use_legacy = False

    if use_legacy:
        detections = detect_faces_legacy(cap, width, height, fps, interval_frames, args.max_faces)
    else:
        detections = detect_faces_new(cap, width, height, fps, interval_frames, args.max_faces)

    cap.release()

    output = {
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "detections": detections
    }

    print(json.dumps(output))


if __name__ == "__main__":
    main()
