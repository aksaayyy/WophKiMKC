#!/usr/bin/env python3
"""
Transcribe audio/video files using faster-whisper.
Outputs JSON to stdout with segments, words, and metadata.
"""

import argparse
import json
import sys

from faster_whisper import WhisperModel


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio/video using faster-whisper")
    parser.add_argument("audio_path", help="Path to the audio or video file")
    parser.add_argument("--model", default="small", help="Whisper model size (tiny, base, small, medium, large-v2, large-v3)")
    parser.add_argument("--language", default=None, help="Language code (e.g., en). Auto-detect if not specified.")
    parser.add_argument("--word-timestamps", action="store_true", default=False, help="Enable word-level timestamps")
    parser.add_argument("--device", default="cpu", help="Device to use: cpu or cuda")
    args = parser.parse_args()

    compute_type = "int8" if args.device == "cpu" else "float16"

    try:
        model = WhisperModel(
            args.model,
            device=args.device,
            compute_type=compute_type,
        )
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}), file=sys.stdout)
        sys.exit(1)

    try:
        segments_generator, info = model.transcribe(
            args.audio_path,
            language=args.language,
            word_timestamps=args.word_timestamps,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        segments = []
        for segment in segments_generator:
            seg_data = {
                "id": segment.id,
                "start": round(segment.start, 3),
                "end": round(segment.end, 3),
                "text": segment.text.strip(),
                "avg_logprob": round(segment.avg_logprob, 4),
                "no_speech_prob": round(segment.no_speech_prob, 4),
            }

            if args.word_timestamps and segment.words:
                seg_data["words"] = [
                    {
                        "word": w.word.strip(),
                        "start": round(w.start, 3),
                        "end": round(w.end, 3),
                        "probability": round(w.probability, 4),
                    }
                    for w in segment.words
                ]

            segments.append(seg_data)

        result = {
            "language": info.language,
            "language_probability": round(info.language_probability, 4),
            "duration": round(info.duration, 3),
            "segments": segments,
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"Transcription failed: {str(e)}"}), file=sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()
