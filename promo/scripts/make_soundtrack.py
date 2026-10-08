# Synthesizes the promo soundtrack from scratch: an original F-minor track at 128.6 BPM, where
# one beat is exactly 14 video frames at 30 fps, so every hit lands on a frame the visuals use.
# Every sound (drums, bass, hook, risers, impacts, shutters, pops) is generated here; no samples.
# Run from the project root: python scripts/make_soundtrack.py
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
FPS = 30
BEAT_FRAMES = 14
BEAT = BEAT_FRAMES / FPS
LENGTH = 30.0
N = int(SR * LENGTH)
rng = np.random.default_rng(2608)

buses = {name: np.zeros((N, 2)) for name in ('drums', 'music', 'sfx', 'verb')}


def fr(frame):
    return frame / FPS


def place(bus, t, sig, gain=1.0, pan=0.0, send=0.0):
    i0 = int(round(t * SR))
    if i0 >= N or len(sig) == 0:
        return
    sig = np.asarray(sig, dtype=float)
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1) * np.sqrt(2)
    end = min(N, i0 + len(sig))
    seg = sig[: end - i0] * gain
    buses[bus][i0:end] += seg
    if send:
        buses['verb'][i0:end] += seg * send


def times(n):
    return np.arange(n) / SR


def noise(n):
    return rng.standard_normal(n)


def _filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x, axis=0)


lp = lambda x, f, o=2: _filt(x, 'low', f, o)
hp = lambda x, f, o=2: _filt(x, 'high', f, o)
bp = lambda x, lo, hi, o=2: _filt(x, 'band', [lo, hi], o)
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)


# ── Drums ────────────────────────────────────────────────────────────
def kick(punch=1.0, length=0.42):
    n = int(length * SR); t = times(n)
    f = 44 + 125 * punch * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.2)
    click = lp(noise(n), 7000) * np.exp(-t * 260) * 0.4
    return np.tanh((body + click) * 1.7) * 0.95


def clap(tail=22):
    n = int(0.34 * SR); t = times(n)
    env = np.zeros(n)
    for k, o in enumerate((0, 0.008, 0.017, 0.026)):
        on = t >= o
        env[on] += np.exp(-(t[on] - o) * (150 if k < 3 else tail))
    return bp(noise(n), 900, 3400) * env * 0.9


def snare(pitch=1.0):
    n = int(0.25 * SR); t = times(n)
    tone = np.sin(2 * np.pi * 190 * pitch * t) * np.exp(-t * 30)
    rattle = bp(noise(n), 1200, 7500) * np.exp(-t * 24)
    return tone * 0.5 + rattle * 0.8


def hat(open_=False):
    n = int((0.3 if open_ else 0.07) * SR); t = times(n)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (3140, 4230, 5370, 6810))
    x = hp(noise(n) * 0.7 + metal * 0.15, 7200, 4)
    return x * np.exp(-t * (10 if open_ else 75)) * 0.55


def crash(length=2.6):
    n = int(length * SR); t = times(n)
    metal = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in (3520, 4710, 5930, 7420, 8810))
    x = hp(noise(n) + metal * 0.08, 3600, 2)
    return x * np.exp(-t * 1.6) * 0.5


# ── Synths ───────────────────────────────────────────────────────────
def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


def supersaw(notes, length, cutoff=5000, voices=7, spread=22, attack=0.004, decay=None, release=0.06):
    n = int(length * SR); t = times(n)
    left = np.zeros(n); right = np.zeros(n)
    for m in notes:
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
            wave = saw(midi(m) * 2 ** (cents / 1200), t, rng.uniform())
            if v % 2: left += wave
            else: right += wave
    env = np.minimum(1, t / attack)
    if decay: env *= np.exp(-t * decay)
    env *= np.clip((length - t) / release, 0, 1)
    out = np.stack([lp(left, cutoff), lp(right, cutoff)], axis=1)
    return out * env[:, None] / (voices * len(notes)) * 2.2


def pluck(m, length=0.32, bright=5200):
    n = int(length * SR); t = times(n)
    x = saw(midi(m), t) * 0.7 + np.sign(np.sin(2 * np.pi * midi(m) * t)) * 0.3
    dark = lp(x, 900)
    sweep = dark + (lp(x, bright) - dark) * np.exp(-t * 22)
    return sweep * np.exp(-t * 8.5) * np.minimum(1, t / 0.002)


def sub_bass(m, length):
    n = int(length * SR); t = times(n)
    body = np.sin(2 * np.pi * midi(m) * t) + 0.45 * lp(saw(midi(m + 12), t), 420)
    env = np.minimum(1, t / 0.006) * np.clip((length - t) / 0.03, 0, 1)
    return np.tanh(body * 1.3) * env


def reese(m, length):
    n = int(length * SR); t = times(n)
    x = saw(midi(m), t) + saw(midi(m) * 2 ** (14 / 1200), t, .37) + 0.6 * np.sin(2 * np.pi * midi(m - 12) * t)
    env = np.minimum(1, t / 0.008) * np.clip((length - t) / 0.04, 0, 1)
    return np.tanh(lp(x, 700) * 1.8) * env


def pop(m):
    n = int(0.16 * SR); t = times(n)
    f = midi(m) * (0.72 + 0.33 * (1 - np.exp(-t * 140)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 24) + hp(noise(n), 3000) * np.exp(-t * 600) * 0.3


# ── Effects ──────────────────────────────────────────────────────────
def riser(length, f0=180, f1=2400):
    n = int(length * SR); t = times(n); ramp = t / length
    sweep = np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** ramp) / SR)
    hiss = hp(noise(n), 1800) * ramp ** 2 + lp(noise(n), 1600) * ramp * (1 - ramp)
    return (sweep * 0.35 * ramp ** 1.5 + hiss * 0.5) * np.clip((length - t) / 0.01, 0, 1)


def whoosh(length=0.55, peak=0.45):
    n = int(length * SR); t = times(n); u = t / length
    bell = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    rise = np.minimum(1, u / peak)
    x = lp(noise(n), 900) * (1 - rise) + bp(noise(n), 1500, 7000) * rise
    return x * bell * 0.9


def impact(size=1.0):
    n = int(2.6 * SR); t = times(n)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 9)) / SR) * np.exp(-t * 1.5)
    thud = lp(noise(n), 500) * np.exp(-t * 9)
    return np.tanh((boom * 1.1 + thud * 0.6) * size * 1.4)


def shutter():
    n = int(0.12 * SR); t = times(n); x = np.zeros(n)
    for o, g in ((0, 1), (0.048, 0.7)):
        on = t >= o
        x[on] += hp(noise(on.sum()), 2200) * np.exp(-(t[on] - o) * 420) * g
    whir = bp(noise(n), 500, 1400) * np.exp(-t * 60) * 0.35
    return x + whir


def tick():
    n = int(0.03 * SR); t = times(n)
    return np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 420)


def ui_click():
    n = int(0.08 * SR); t = times(n)
    return np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 90) * 0.6 + hp(noise(n), 4000) * np.exp(-t * 900)


def confetti_pops(length=0.9, count=70):
    out = np.zeros(int(length * SR))
    burst = hp(noise(int(0.25 * SR)), 1400) * np.exp(-times(int(0.25 * SR)) * 14)
    out[: len(burst)] += burst * 0.8
    for _ in range(count):
        at = int((rng.uniform() ** 2) * (length - 0.02) * SR)
        c = hp(noise(int(0.012 * SR)), 2500) * np.exp(-times(int(0.012 * SR)) * 500) * rng.uniform(.2, .7)
        out[at:at + len(c)] += c
    return out


def glitch(notes):
    x = supersaw(notes, 0.26, cutoff=7000)
    held = np.repeat(x[::12], 12, axis=0)[: len(x)]
    gate = (np.arange(len(x)) // int(0.032 * SR)) % 2 == 0
    return np.round(held * 6) / 6 * gate[:, None] * 1.1


def reverse_crash(length):
    return crash(length)[::-1] * np.linspace(0, 1, int(length * SR)) ** 2


# ── Harmony ──────────────────────────────────────────────────────────
CHORDS = [[65, 68, 72], [65, 68, 73], [63, 68, 72], [63, 67, 70]]   # Fm, Db, Ab, Eb
ROOTS = [41, 37, 44, 39]
HOOK = [
    [(0, 84), (3, 80), (6, 77), (10, 80), (12, 84), (14, 85)],
    [(0, 84), (3, 80), (6, 77), (10, 75), (12, 77)],
    [(0, 87), (3, 84), (6, 80), (10, 84), (12, 87), (14, 89)],
    [(0, 87), (3, 82), (6, 79), (10, 82), (12, 79), (14, 75)],
]
bar_t = lambda b, beat=0.0: ((b - 1) * 4 + beat) * BEAT
chord_of = lambda b: (b - 1) % 4
kicks = []


def groove(bar, b_style):
    """One bar of the main beat. b_style: 'A' first drop, 'B' second drop (heavier)."""
    c = chord_of(bar)
    for beat in range(4):
        t = bar_t(bar, beat)
        kicks.append(t); place('drums', t, kick(), 0.95)
        if beat in (1, 3): place('drums', t, clap(), 0.5, 0.05, send=0.18)
        place('drums', bar_t(bar, beat + .5), hat(open_=b_style == 'B'), 0.22 if b_style == 'B' else 0.2, 0.25)
        for s in (.25, .75):
            place('drums', bar_t(bar, beat + s), hat(), 0.09, -0.3)
        for e in (0, .5):
            on = bar_t(bar, beat + e + .0)
            if b_style == 'A':
                if e: place('music', on, sub_bass(ROOTS[c], BEAT / 2 * 0.9), 0.42)
            else:
                place('music', on, reese(ROOTS[c] + 12, BEAT / 2 * 0.95), 0.2)
                place('music', on, sub_bass(ROOTS[c], BEAT / 2 * 0.95), 0.32)
    place('music', bar_t(bar), supersaw(CHORDS[c], BEAT * 1.6, cutoff=4200, decay=2.2), 0.42, send=0.3)


def arp(bar, gain=0.1):
    c = chord_of(bar); tones = CHORDS[c] + [x + 12 for x in CHORDS[c]]
    order = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 2, 4, 5, 3, 1]
    for i, k in enumerate(order):
        place('music', bar_t(bar, i / 4), pluck(tones[k], 0.22, 4200), gain, (-0.4, 0.4)[i % 2], send=0.25)


def hook(bar, gain=0.2):
    for step, m in HOOK[chord_of(bar)]:
        place('music', bar_t(bar, step / 4), pluck(m, 0.36, 6500), gain, 0.1, send=0.35)
        place('music', bar_t(bar, step / 4) + 0.003, pluck(m - 12, 0.3, 3000), gain * 0.35, -0.2)


# Bar 1 — slit opens: pad swell, counter ticks, reverse crash into the letters.
place('music', 0, supersaw([53, 60, 65, 68], bar_t(2) + 0.2, cutoff=900, attack=1.2, release=0.3), 0.38, send=0.4)
place('music', 0, sub_bass(29, bar_t(2)), 0.18)
for i in range(16):
    place('sfx', bar_t(1, i / 4), tick(), 0.12 + 0.012 * i, (-.5, .5)[i % 2])
place('sfx', bar_t(2) - 0.9, reverse_crash(0.9), 0.5)
# Bar 2 — the four letters slam: kick + glitch stab each, riser and snare roll into the drop.
for beat in range(4):
    t = bar_t(2, beat); kicks.append(t)
    place('drums', t, kick(1.2), 1.0)
    place('music', t, glitch(CHORDS[beat % 4]), 0.32, (-.3, .3)[beat % 2], send=0.2)
    place('drums', bar_t(2, beat + .5), hat(), 0.12)
place('sfx', bar_t(2), riser(bar_t(3) - bar_t(2)), 0.42)
for i in range(8):
    place('drums', bar_t(2, 3 + i / 8), snare(1 + i * 0.06), 0.18 + i * 0.05)

# Bars 3–8 — first drop.
place('sfx', bar_t(3), impact(1.2), 0.85, send=0.25); place('drums', bar_t(3), crash(), 0.55, send=0.2)
for bar in range(3, 9):
    groove(bar, 'A')
for beat in range(3):   # "DRESSED" / "FOR" / "NOW."
    place('music', bar_t(3, beat), supersaw([m + 12 for m in CHORDS[0]], 0.3, cutoff=7000, decay=7), 0.32, send=0.3)
    place('drums', bar_t(3, beat), clap(), 0.35, send=0.3)
for i in range(8):      # photo strobe: a camera shutter on every 8th
    place('sfx', fr(168 + 7 * i), shutter(), 0.42, (-.6, .6)[i % 2])
    place('music', fr(168 + 7 * i), pluck(CHORDS[1][i % 3] + 12 * (i // 3), 0.25), 0.14, send=0.3)
place('sfx', fr(224) - 0.25, whoosh(0.55), 0.5)
for bar in (5, 6, 7, 8):
    arp(bar, 0.08)
place('sfx', fr(268), whoosh(1.3, 0.8), 0.3)                                  # cursor drags the ribbon
place('sfx', fr(308), ui_click(), 0.6); place('sfx', fr(308), whoosh(0.95, 0.85), 0.55)   # click → zoom
for i, f in enumerate((336, 350, 364, 378)):                                    # SOME / FITS / JUST / HIT.
    place('drums', fr(f), snare(1.1), 0.35, (-.2, .2)[i % 2], send=0.2)
place('sfx', fr(392), impact(0.7), 0.55, send=0.3); place('drums', fr(392), clap(8), 0.6, send=0.5)   # NO NOTES stamp
place('sfx', fr(406), riser(fr(448) - fr(406), 220, 3200), 0.45)
place('sfx', fr(418), whoosh(1.0, 0.75), 0.6)                                   # denim drape rises

# Bars 9–14 — second drop: AFTER hours, the colour menu, main character.
place('sfx', fr(448), impact(1.3), 0.9, send=0.3); place('drums', fr(448), crash(3), 0.6, send=0.25)
place('sfx', fr(448), confetti_pops(), 0.5, send=0.2)
for bar in range(9, 15):
    groove(bar, 'B')
    hook(bar, 0.2 if bar < 11 or bar > 12 else 0.12)
SCALE = [77, 80, 82, 84, 87, 89, 92, 94]
for i in range(8):                                                              # tiles pop in
    place('sfx', fr(560 + 7 * i), pop(SCALE[i]), 0.32, (-.5, .5)[i % 2], send=0.25)
for i in range(8):                                                              # cursor hovers each card
    f = 616 + 7 * i
    place('sfx', fr(f), ui_click(), 0.28, (-.4, .4)[i % 2]); place('music', fr(f), pluck(CHORDS[3][i % 3] + 12 * (1 + i // 3), 0.3), 0.15, send=0.3)
place('sfx', fr(672) - 0.3, whoosh(0.6), 0.45); place('drums', fr(672), crash(), 0.35)
for f in (728, 742, 756, 770):                                                  # stickers slap on
    place('drums', fr(f), clap(30), 0.45, send=0.2); place('drums', fr(f), kick(0.6, 0.15), 0.3)

# Bar 15 — build: accelerating snare roll, riser, everything drops out before the final hit.
for beat in range(3):
    t = bar_t(15, beat); kicks.append(t); place('drums', t, kick(), 0.9)
roll = [bar_t(15) + k * BEAT / 2 for k in range(4)] + [bar_t(15, 2) + k * BEAT / 4 for k in range(4)] + [bar_t(15, 3) + k * BEAT / 8 for k in range(6)]
for i, t in enumerate(roll):
    place('drums', t, snare(1 + i * 0.05), 0.15 + i * 0.03, send=0.15)
place('sfx', bar_t(15), riser(fr(836) - bar_t(15), 200, 4200), 0.55)
place('music', bar_t(15), supersaw([53, 60, 65], fr(836) - bar_t(15), cutoff=2500, attack=1.4, release=0.02), 0.25)

# Final hit at frame 840: impact, crash and a wide F minor 9 chord ringing out.
place('sfx', fr(840), impact(1.5), 1.0, send=0.35); place('drums', fr(840), crash(2.0), 0.6, send=0.3)
kicks.append(fr(840)); place('drums', fr(840), kick(1.3), 1.0)
place('music', fr(840), supersaw([41, 53, 60, 65, 67, 68, 72], 2.0, cutoff=5200, decay=1.3, release=0.4), 0.55, send=0.6)
place('sfx', fr(840), confetti_pops(1.2, 50), 0.35, send=0.2)

# ── Mix ──────────────────────────────────────────────────────────────
duck = np.ones(N)
for k in kicks:
    i0 = int(k * SR); m = min(N - i0, int(0.3 * SR))
    if m > 0:
        duck[i0:i0 + m] = np.minimum(duck[i0:i0 + m], 1 - 0.65 * np.exp(-times(m) * 11))
buses['music'] *= duck[:, None]
gap = slice(int(fr(836) * SR), int(fr(840) * SR))
for name in ('drums', 'music', 'sfx'):
    buses[name][gap] *= 0.0

irn = int(2.2 * SR); ir = noise(irn * 2).reshape(-1, 2) * np.exp(-times(irn) * 3.0)[:, None]
ir = lp(ir, 5500); ir *= 0.35 / np.sqrt((ir ** 2).sum(axis=0))
verb = np.stack([fftconvolve(buses['verb'][:, ch], ir[:, ch])[:N] for ch in (0, 1)], axis=1)

mix = buses['drums'] + buses['music'] + buses['sfx'] * 0.9 + verb * 0.5
mix = hp(mix, 28)
# Gentle saturation after setting a sane level, then leave 1 dB of headroom for AAC encoding.
mix /= np.percentile(np.abs(mix), 99.8)
mix = np.tanh(mix * 0.85) / np.tanh(0.85)
fade = np.clip((LENGTH - times(N)) / 0.6, 0, 1)
mix *= fade[:, None]
mix = mix / np.abs(mix).max() * 0.8

out = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio', 'soundtrack.wav')
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
rms = 20 * np.log10(np.sqrt((mix ** 2).mean()))
print(f'wrote {os.path.normpath(out)}: {LENGTH:.1f}s, RMS {rms:.1f} dBFS')
