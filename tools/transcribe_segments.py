# -*- coding: utf-8 -*-
"""疑わしい区間だけ medium モデルで高精度に再認識する。"""
import os
import sys

import librosa
from faster_whisper import WhisperModel

ASSETS = os.path.join(os.path.dirname(__file__), "..", "web", "assets")

SEGMENTS = [
    ("Processing.mp3", 58, 112),   # ブリッジ（ヒューマンコンピュータ？）と間奏
    ("HCI.mp3",        50, 80),    # 2番〜3番（共感的に？直感的に？）
    ("VR.MP3",         128, 152),  # 歌詞ファイルに無い節
    ("AR.MP3",         100, 118),  # ブリッジの追加2行
    ("AR.MP3",         40, 50),    # コーラス末尾の動詞
]


def main():
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    for music, start, end in SEGMENTS:
        print(f"=== {music} {start}-{end}s ===", flush=True)
        y, sr = librosa.load(os.path.join(ASSETS, music), sr=16000, mono=True,
                             offset=start, duration=end - start)
        segments, _ = model.transcribe(y, language="ja", beam_size=5,
                                       condition_on_previous_text=False)
        for seg in segments:
            print(f"  [{start + seg.start:6.1f}-{start + seg.end:6.1f}] {seg.text.strip()}", flush=True)
    print("done")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
