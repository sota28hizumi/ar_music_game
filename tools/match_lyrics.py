# -*- coding: utf-8 -*-
"""
Whisperの書き起こし（tools/transcripts/）と歌詞ファイル（web/assets/）を
文字3-gramのJaccard類似度で総当たり照合し、曲→歌詞ファイルの最適対応を調べる。

使い方: python tools/match_lyrics.py
"""
import os
import re
import sys
import unicodedata

BASE = os.path.dirname(__file__)
ASSETS = os.path.join(BASE, "..", "web", "assets")
TRANS = os.path.join(BASE, "transcripts")

# 曲（書き起こし名）と、現在ゲームで割り当てている歌詞ファイル
CURRENT = [
    ("Processing",     "processinglyric.txt"),
    ("BAD_UI",         "BADUIlyric.txt"),
    ("Invisible_Data", "Invisiblelyric.txt"),
    ("modality",       "modality.txt"),
    ("VR",             "VR.txt"),
    ("prophecy",       "prophecy.txt"),
    ("brain",          "brain.txt"),
    ("code",           "opencv.txt"),
    ("AR",             "nya.txt"),
    ("HCI",            "HCI.txt"),
]
LYRIC_FILES = [c[1] for c in CURRENT]


def normalize(text):
    # タイムスタンプ除去
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = unicodedata.normalize("NFKC", text).lower()
    # 記号・空白を除去（文字だけ残す）
    text = re.sub(r"[^ぁ-んァ-ヶ一-龥a-z0-9ー]", "", text)
    # カタカナをひらがなに寄せる（表記ゆれ対策）
    text = "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text)
    return text


def ngrams(text, n=3):
    return set(text[i:i + n] for i in range(len(text) - n + 1))


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def main():
    trans = {}
    for name, _ in CURRENT:
        path = os.path.join(TRANS, name + ".txt")
        with open(path, encoding="utf-8") as f:
            trans[name] = ngrams(normalize(f.read()))

    lyrics = {}
    for lf in LYRIC_FILES:
        with open(os.path.join(ASSETS, lf), encoding="utf-8") as f:
            lyrics[lf] = ngrams(normalize(f.read()))

    print(f"{'曲(音源)':<16}", "  ".join(f"{lf[:8]:<10}" for lf in LYRIC_FILES))
    issues = []
    for name, current_lf in CURRENT:
        row = {lf: jaccard(trans[name], lyrics[lf]) for lf in LYRIC_FILES}
        best = max(row, key=row.get)
        cells = "  ".join(f"{row[lf]:.3f}     " for lf in LYRIC_FILES)
        mark = "OK" if best == current_lf else f"→ {best} が最良!"
        print(f"{name:<16}", cells, f" 現在:{current_lf[:12]} {mark}")
        if best != current_lf:
            issues.append((name, current_lf, best, row[best], row[current_lf]))

    print()
    if issues:
        print("不一致の疑い:")
        for name, cur, best, bs, cs in issues:
            print(f"  {name}: 現在={cur}(score {cs:.3f}) / 最良={best}(score {bs:.3f})")
    else:
        print("すべて現在の割り当てが最良でした。")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
