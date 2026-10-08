import {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';

// The beat grid shared with scripts/make_soundtrack.py: one beat is exactly 14 frames at 30 fps
// (128.6 BPM), one bar is 56 frames, and the 30-second video is 16 bars plus a short tail.
export const FPS = 30;
export const BEAT = 14;
export const BAR = 56;
export const TOTAL = 900;

/** Frame of a bar (1-based) and beat (0-based, fractional allowed). */
export const at = (bar: number, beat = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT);

export const SCENES = {
	intro: [0, 112],
	drop: [112, 224],
	ribbon: [224, 336],
	denim: [336, 448],
	afterHours: [448, 560],
	menu: [560, 672],
	mainCharacter: [672, 784],
	build: [784, 840],
	end: [840, 900],
} as const;

// Every kick in the track, for camera shake and scale punches.
export const KICKS: number[] = [
	...[0, 1, 2, 3].map((b) => at(2, b)),
	...Array.from({length: 12 * 4}, (_, i) => at(3, i)),
	...[0, 1, 2].map((b) => at(15, b)),
	840,
];
// Drops and the final hit, which get a white flash and a bigger shake.
export const IMPACTS = [112, 448, 840];

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeInOut = (t: number) => {
	const x = clamp(t);
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** 0→1 over [start, start+length] with an ease-out. */
export const enter = (frame: number, start: number, length = 10) => easeOut((frame - start) / length);

/** Decaying 1→0 envelope after the most recent hit at or before `frame`. */
export const pulse = (frame: number, hits: readonly number[], length = 8) => {
	let best = 0;
	for (const h of hits) {
		const d = frame - h;
		if (d >= 0 && d < length) best = Math.max(best, Math.pow(1 - d / length, 2));
	}
	return best;
};

/** Spring-like overshoot from 0 to 1, settling over `length` frames. */
export const pop = (frame: number, start: number, length = 14) => {
	const t = (frame - start) / length;
	if (t <= 0) return 0;
	if (t >= 1) return 1;
	return 1 - Math.exp(-6 * t) * Math.cos(t * Math.PI * 2.4);
};

/** Deterministic pseudo-random in [0, 1) for a seed. */
export const hash = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

/** Start frame of the enclosing scene, so scenes and effects can work in whole-video frames. */
export const SceneStart = createContext(0);
export const useGlobalFrame = () => useCurrentFrame() + useContext(SceneStart);
