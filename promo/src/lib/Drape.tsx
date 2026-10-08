import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';
import {weaveDenim, DENIM, RES} from './denim-art.js';
import {clamp, hash} from './timing';

// The website's denim drape (dist/ornaments.js), redrawn per frame on a canvas: a waving waistband
// edge on top, a frayed raw hem below, pleat shading and a cool light wash. Frame-driven, no state.
const W = 1920, H = 1080;
type Tile = {canvas: HTMLCanvasElement; period: number; height: number};
type Art = {body: {size: number; canvas: HTMLCanvasElement}; waistband: Tile; hem: Tile; fray: HTMLCanvasElement[]};

const wave = (x: number, t: number, seed: number) =>
	0.62 * Math.sin(x * 0.0062 + t * 1.15 + seed) + 0.38 * Math.sin(x * 0.0147 - t * 0.83 + seed * 1.7) + 0.16 * Math.sin(x * 0.031 + t * 2.1 + seed * 0.6);

function strip(ctx: CanvasRenderingContext2D, piece: Tile, edge: (x: number) => number, lift: number, size: number) {
	const P = piece.period * size, h = piece.height * size, step = 8, scale = RES / size;
	for (let x = -step; x < W + step; x += step) {
		const y0 = edge(x), y1 = edge(x + step), src = ((x % P) + P) % P;
		ctx.setTransform(1, (y1 - y0) / step, 0, 1, x, y0 - lift * h);
		ctx.drawImage(piece.canvas, src * scale, 0, step * scale, piece.height * RES, 0, 0, step + 0.6, h);
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function pleats(ctx: CanvasRenderingContext2D, t: number, seed: number, amp: number) {
	const g = ctx.createLinearGradient(0, 0, W, 0), N = 36;
	for (let i = 0; i <= N; i++) {
		const x = (i / N) * W, s = clamp((((wave(x + 2, t, seed) - wave(x - 2, t, seed)) / 4) * amp) * 2.6, -1, 1);
		g.addColorStop(i / N, s < 0 ? `rgba(4,10,26,${(-s * 0.32).toFixed(3)})` : `rgba(190,212,250,${(s * 0.12).toFixed(3)})`);
	}
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
}

function light(ctx: CanvasRenderingContext2D, t: number) {
	ctx.save();
	ctx.globalCompositeOperation = 'soft-light';
	const p = ((t * 0.12) % 1 + 1) % 1, shot = ctx.createLinearGradient(0, H * (p * 0.5 - 0.3), W, H * (1.3 - p * 0.5));
	shot.addColorStop(0, 'rgba(150,190,255,.42)'); shot.addColorStop(0.48, 'rgba(20,40,90,0)'); shot.addColorStop(1, 'rgba(70,40,150,.4)');
	ctx.fillStyle = shot; ctx.fillRect(0, 0, W, H);
	ctx.globalCompositeOperation = 'screen';
	const diag = Math.hypot(W, H), c = ((t * 420) % (diag * 1.4)) - diag * 0.7;
	ctx.translate(W / 2, H / 2); ctx.rotate(-0.62);
	const g = ctx.createLinearGradient(c - diag * 0.14, 0, c + diag * 0.14, 0);
	g.addColorStop(0, 'rgba(170,200,250,0)'); g.addColorStop(0.5, 'rgba(185,210,250,.12)'); g.addColorStop(1, 'rgba(170,200,250,0)');
	ctx.fillStyle = g; ctx.fillRect(c - diag * 0.14, -diag, diag * 0.28, diag * 2);
	ctx.restore();
}

function fray(ctx: CanvasRenderingContext2D, art: Art, edge: (x: number) => number, t: number, size: number, swing: number) {
	const gap = 7 * size;
	for (let i = 0, x = -gap; x < W + gap; i++, x = i * gap - gap + hash(i) * gap * 0.6) {
		const y = edge(x), slope = (edge(x + 3) - edge(x - 3)) / 6;
		const angle = slope * 0.9 + Math.sin(t * 2.4 + x * 0.045) * 0.1 + Math.sin(t * 9 + i) * 0.08 * swing;
		const k = (0.7 + hash(i + 50) * 0.5) * size * 1.35;
		const c = Math.cos(angle) * k, s = Math.sin(angle) * k;
		ctx.setTransform(c, s, -s, c, x, y - 1);
		ctx.drawImage(art.fray[Math.floor(hash(i + 9) * 4)], -8, 0, 16, 48);
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Denim between a waving top edge (`top`, px) and bottom edge (`bottom`, px). */
export const DenimDrape: React.FC<{top: number; bottom: number; size?: number; amp?: number; swing?: number}> = ({top, bottom, size = 1.6, amp = 40, swing = 0}) => {
	const frame = useCurrentFrame();
	const ref = useRef<HTMLCanvasElement>(null);
	const [art, setArt] = useState<Art | null>(null);
	const [handle] = useState(() => delayRender('Weaving the denim'));
	useEffect(() => {
		document.fonts.ready.then(() => {
			setArt(weaveDenim());
			continueRender(handle);
		});
	}, [handle]);
	useLayoutEffect(() => {
		const ctx = ref.current?.getContext('2d');
		if (!ctx || !art) return;
		const t = frame / 30;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, W, H);
		const padTop = art.waistband.height * size + amp * 1.3, padBottom = art.hem.height * size + amp * 1.3;
		const upper = top > -padTop, lower = bottom < H + padBottom;
		const topEdge = (x: number) => top + wave(x, t, 0) * amp, bottomEdge = (x: number) => bottom + wave(x, t, 2.4) * amp;
		const region = new Path2D();
		if (upper) for (let x = -16; x <= W + 16; x += 8) x === -16 ? region.moveTo(x, topEdge(x)) : region.lineTo(x, topEdge(x));
		else { region.moveTo(-40, -40); region.lineTo(W + 40, -40); }
		if (lower) for (let x = W + 16; x >= -16; x -= 8) region.lineTo(x, bottomEdge(x));
		else { region.lineTo(W + 40, H + 40); region.lineTo(-40, H + 40); }
		region.closePath();
		ctx.save();
		ctx.shadowColor = 'rgba(8,18,40,.45)'; ctx.shadowBlur = 50;
		ctx.fillStyle = DENIM; ctx.fill(region);
		ctx.restore();
		ctx.save();
		ctx.clip(region);
		const twill = ctx.createPattern(art.body.canvas, 'repeat')!;
		twill.setTransform(new DOMMatrix().scale(size / RES));
		ctx.fillStyle = twill; ctx.fillRect(0, 0, W, H);
		pleats(ctx, t, upper ? 0 : 2.4, amp);
		if (upper) strip(ctx, art.waistband, topEdge, 0, size);
		if (lower) strip(ctx, art.hem, bottomEdge, 1, size);
		light(ctx, t);
		ctx.restore();
		if (lower) fray(ctx, art, bottomEdge, t, size, swing);
	}, [art, frame, top, bottom, size, amp, swing]);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />;
};
