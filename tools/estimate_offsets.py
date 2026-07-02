# -*- coding: utf-8 -*-
"""
譜面（keyLog_*.txt）と音楽のタイミングのズレを推定するスクリプト。

各曲についてオンセット強度（音の立ち上がり）を計算し、
譜面のノーツ時刻列を -3.0〜+3.0 秒の範囲でずらしながら
オンセット強度との一致度（平均値）を計算する。
一致度が最大になるオフセットが「譜面に加えるべき補正量」。

  補正後のノーツ時刻 = 譜面の時刻 + offset

使い方:
  python tools/estimate_offsets.py
"""
import json
import os
import sys

import numpy as np
import librosa

ASSETS = os.path.join(os.path.dirname(__file__), "..", "web", "assets")

SONGS = [
    ("Processing",     "Processing.mp3", "keyLog_processing.txt"),
    ("BAD UI",         "BADUI.MP3",      "keyLog_BADUI.txt"),
    ("Invisible Data", "Invisible.MP3",  "keyLog_invisible.txt"),
    ("婉曲モダリティ",   "modality.mp3",   "keyLog_modality.txt"),
    ("仮想領域現実感",   "VR.MP3",         "keyLog_AR.txt"),
    ("RW Interaction", "prophecy.MP3",   "keyLog_prophecy.txt"),
    ("テン、二大原則",   "brain.mp3",      "keyLog_hourensou.txt"),
    ("Open CoVenant",  "code.MP3",       "keyLog_opencv.txt"),
    ("AdveNyAr!",      "AR.MP3",         "keyLog_nya.txt"),
    ("HCI",            "HCI.mp3",        "keyLog_HCI.txt"),
]


def load_chart_times(path):
    times = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(" ---- ")
            times.append(float(parts[0].split(" ")[1]))
    return np.array(times)


def estimate_offset(music_path, chart_times, search=(-6.0, 6.0), step=0.005):
    y, sr = librosa.load(music_path, sr=22050, mono=True)
    duration = len(y) / sr
    hop = 512
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    if env.max() > 0:
        env = env / env.max()
    fps = sr / hop  # 約43フレーム/秒

    offsets = np.arange(search[0], search[1] + step, step)
    scores = np.zeros(len(offsets))
    for i, o in enumerate(offsets):
        t = chart_times + o
        idx = t * fps
        valid = (idx >= 0) & (idx < len(env) - 1)
        if valid.sum() < len(chart_times) * 0.5:
            scores[i] = -1
            continue
        idx = idx[valid]
        lo = np.floor(idx).astype(int)
        frac = idx - lo
        vals = env[lo] * (1 - frac) + env[lo + 1] * frac
        scores[i] = vals.mean()

    best_i = int(np.argmax(scores))
    best = offsets[best_i]

    # 放物線補間でピークを細かく推定
    if 0 < best_i < len(offsets) - 1:
        s0, s1, s2 = scores[best_i - 1], scores[best_i], scores[best_i + 2 - 1]
        denom = s0 - 2 * s1 + s2
        if abs(denom) > 1e-9:
            best += step * 0.5 * (s0 - s2) / denom

    # 信頼度: ピークの高さが全体の中央値からどれだけ突出しているか
    med = float(np.median(scores[scores >= 0]))
    peak = float(scores[best_i])
    confidence = peak / med if med > 0 else 0.0

    # 物理制約: 補正後の最初のノーツ >= 0秒、最後のノーツ <= 曲の長さ(+0.3秒の猶予)
    feas_lo = -float(chart_times.min())
    feas_hi = duration - float(chart_times.max()) + 0.3

    # 制約を満たす範囲内で、0.3秒以上離れた上位ピークを列挙
    top_peaks = []
    used = np.zeros(len(scores), dtype=bool)
    order = np.argsort(scores)[::-1]
    for i in order:
        if used[i] or scores[i] < 0:
            continue
        if offsets[i] < feas_lo or offsets[i] > feas_hi:
            continue
        top_peaks.append({"offset": round(float(offsets[i]), 3), "score": round(float(scores[i]), 4)})
        lo = max(0, i - int(0.3 / step))
        hi = min(len(scores), i + int(0.3 / step))
        used[lo:hi] = True
        if len(top_peaks) >= 4:
            break

    return {
        "best_feasible": top_peaks[0]["offset"] if top_peaks else None,
        "feasible_range": [round(feas_lo, 2), round(feas_hi, 2)],
        "top_peaks": top_peaks,
        "global_best": round(float(best), 3),
        "median_score": round(med, 4),
        "duration": round(duration, 1),
        "notes": int(len(chart_times)),
        "chart_span": [round(float(chart_times.min()), 2), round(float(chart_times.max()), 2)],
    }


def main():
    results = {}
    for title, music, chart in SONGS:
        music_path = os.path.join(ASSETS, music)
        chart_path = os.path.join(ASSETS, chart)
        chart_times = load_chart_times(chart_path)
        print(f"analyzing {title} ({music}) ...", flush=True)
        try:
            r = estimate_offset(music_path, chart_times)
        except Exception as e:
            r = {"error": str(e)}
        results[title] = r
        print("  ", json.dumps(r, ensure_ascii=False), flush=True)

    out = os.path.join(os.path.dirname(__file__), "offsets_result.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("saved:", out)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
