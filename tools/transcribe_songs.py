# -*- coding: utf-8 -*-
"""
各曲の冒頭を faster-whisper で書き起こし、tools/transcripts/ に保存する。
歌詞ファイルと実際の音源の照合用。

使い方: python tools/transcribe_songs.py [秒数]
"""
import os
import sys

import numpy as np
import librosa
from faster_whisper import WhisperModel

ASSETS = os.path.join(os.path.dirname(__file__), "..", "web", "assets")
OUT = os.path.join(os.path.dirname(__file__), "transcripts")

SONGS = [
    ("Processing",     "Processing.mp3"),
    ("BAD_UI",         "BADUI.MP3"),
    ("Invisible_Data", "Invisible.MP3"),
    ("modality",       "modality.mp3"),
    ("VR",             "VR.MP3"),
    ("prophecy",       "prophecy.MP3"),
    ("brain",          "brain.mp3"),
    ("code",           "code.MP3"),
    ("AR",             "AR.MP3"),
    ("HCI",            "HCI.mp3"),
]


def main():
    seconds = float(sys.argv[1]) if len(sys.argv) > 1 else 90.0
    os.makedirs(OUT, exist_ok=True)
    model = WhisperModel("small", device="cpu", compute_type="int8")

    for name, music in SONGS:
        out_path = os.path.join(OUT, name + ".txt")
        if os.path.exists(out_path):
            print(f"skip {name} (exists)", flush=True)
            continue
        print(f"transcribing {name} ({music}) ...", flush=True)
        y, sr = librosa.load(os.path.join(ASSETS, music), sr=16000, mono=True,
                             duration=seconds)
        segments, info = model.transcribe(y, language="ja", beam_size=5,
                                          condition_on_previous_text=False)
        lines = []
        for seg in segments:
            lines.append(f"[{seg.start:6.1f}-{seg.end:6.1f}] {seg.text.strip()}")
            print("   ", lines[-1], flush=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
    print("done")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
