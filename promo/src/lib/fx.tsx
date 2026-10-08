import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {IMPACTS, KICKS, clamp, hash, mix, pulse, SCENES, useGlobalFrame} from './timing';
import {SANS} from './looks';

// The website's own typefaces: Editorial (Latin Modern) and Interface (Nimbus Sans).
loadFont({family: 'Editorial', url: staticFile('fonts/editorial.otf'), style: 'normal'});
loadFont({family: 'Editorial', url: staticFile('fonts/editorial-italic.otf'), style: 'italic'});
loadFont({family: 'Interface', url: staticFile('fonts/sans.otf')});

/** Red/cyan channel split for text, scaled by `amount` in pixels. */
export const rgbSplit = (amount: number, alpha = 0.85) =>
	amount < 0.2 ? 'none' : `${amount}px 0 rgba(255,32,86,${alpha}), ${-amount}px 0 rgba(0,224,255,${alpha})`;

/** Camera shake on every kick, harder on the drops and building through the final bar. */
export const Shake: React.FC<{children: React.ReactNode}> = ({children}) => {
	const f = useCurrentFrame();
	const build = f >= SCENES.build[0] && f < 836 ? (f - SCENES.build[0]) / 52 : 0;
	const amp = 7 * pulse(f, KICKS, 6) + 26 * pulse(f, IMPACTS, 12) + 14 * build;
	const x = (hash(f) - 0.5) * 2 * amp;
	const y = (hash(f + 91) - 0.5) * 2 * amp;
	const r = (hash(f + 37) - 0.5) * amp * 0.06;
	const zoom = 1 + 0.012 * pulse(f, KICKS, 5) + 0.05 * pulse(f, IMPACTS, 10);
	return (
		<AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${zoom})`}}>{children}</AbsoluteFill>
	);
};

/** White flash frames on hits. */
export const Flash: React.FC = () => {
	const f = useCurrentFrame();
	const strong = pulse(f, IMPACTS, 7);
	const soft = 0.35 * pulse(f, [56, 70, 84, 98, 168, 392, 616, 728, 742, 756, 770], 3);
	const o = Math.max(strong, soft);
	return o > 0.01 ? <AbsoluteFill style={{background: '#fff', opacity: o, mixBlendMode: 'screen'}} /> : null;
};

export const Grain: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${staticFile('noise.png')})`,
				backgroundPosition: `${Math.floor(hash(f) * 512)}px ${Math.floor(hash(f + 5) * 512)}px`,
				opacity: 0.09,
				mixBlendMode: 'overlay',
			}}
		/>
	);
};

export const Vignette: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.35) 100%)'}} />
);

const LABELS: [number, string][] = [
	[0, '00 — LOADING THE DROP'],
	[112, '01 — DRESSED FOR NOW'],
	[224, '02 — EIGHT LOOKS'],
	[336, '03 — THE DENIM EDIT'],
	[448, '04 — AFTER HOURS'],
	[560, '05 — FIND YOUR COLOUR'],
	[672, '06 — MAIN CHARACTER'],
	[784, '07 — NEW DROPS'],
	[840, 'VĀRA STUDIO — AW26'],
];

/** Website-style chrome: corner labels, scene index, timecode and a scroll progress bar. */
export const Hud: React.FC = () => {
	const f = useCurrentFrame();
	const label = [...LABELS].reverse().find(([s]) => f >= s)![1];
	const sec = Math.floor(f / 30);
	const tc = `00:${String(sec).padStart(2, '0')}:${String(f % 30).padStart(2, '0')}`;
	const show = clamp((f - 4) / 10);
	const text: React.CSSProperties = {position: 'absolute', fontFamily: SANS, fontSize: 15, letterSpacing: '0.14em', color: '#fff'};
	const corner = (style: React.CSSProperties) => (
		<div style={{position: 'absolute', width: 22, height: 22, borderColor: '#fff', borderStyle: 'solid', borderWidth: 0, ...style}} />
	);
	return (
		<AbsoluteFill style={{mixBlendMode: 'difference', opacity: show}}>
			<div style={{...text, left: 56, top: 44, fontFamily: 'Editorial', fontSize: 30, letterSpacing: '0.06em'}}>
				VĀRA<span style={{fontFamily: SANS, fontSize: 11, letterSpacing: '0.3em', marginLeft: 12}}>STUDIO</span>
			</div>
			<div style={{...text, right: 56, top: 54}}>DROP 08 · AW26</div>
			<div style={{...text, left: 56, bottom: 50}}>{label}</div>
			<div style={{...text, right: 56, bottom: 50, fontVariantNumeric: 'tabular-nums'}}>{tc}</div>
			{corner({left: 36, top: 100, borderLeftWidth: 1.5, borderTopWidth: 1.5})}
			{corner({right: 36, top: 100, borderRightWidth: 1.5, borderTopWidth: 1.5})}
			{corner({left: 36, bottom: 92, borderLeftWidth: 1.5, borderBottomWidth: 1.5})}
			{corner({right: 36, bottom: 92, borderRightWidth: 1.5, borderBottomWidth: 1.5})}
			<div style={{position: 'absolute', left: 0, bottom: 0, height: 4, width: `${(f / 899) * 100}%`, background: '#fff'}} />
		</AbsoluteFill>
	);
};

export type CursorKey = {f: number; x: number; y: number; label?: string};

/** The website cursor (ring, dot and label), moving through keyframes and clicking on `clicks`. */
export const Cursor: React.FC<{keys: CursorKey[]; clicks?: number[]; color?: string}> = ({keys, clicks = [], color = '#fff'}) => {
	const f = useGlobalFrame();
	if (f < keys[0].f || f > keys[keys.length - 1].f + 6) return null;
	let i = 0;
	while (i < keys.length - 1 && f > keys[i + 1].f) i++;
	const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
	const t = b.f === a.f ? 1 : clamp((f - a.f) / (b.f - a.f));
	const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
	const x = mix(a.x, b.x, e), y = mix(a.y, b.y, e);
	const vx = b.x - a.x, vy = b.y - a.y, moving = t > 0 && t < 1 ? 1 : 0;
	const stretch = 1 + moving * Math.min(0.5, Math.hypot(vx, vy) / Math.max(1, b.f - a.f) / 90);
	const angle = Math.atan2(vy, vx);
	const press = pulse(f, clicks, 8);
	const label = (t < 1 ? a.label : b.label) ?? '';
	const ripple = clicks.map((c) => f - c).find((d) => d >= 0 && d < 14);
	return (
		<div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 50}}>
			<div
				style={{
					position: 'absolute', left: -44, top: -44, width: 88, height: 88, borderRadius: '50%', border: `2px solid ${color}`,
					transform: `rotate(${angle}rad) scale(${stretch * (1 - press * 0.35)}, ${(1 / stretch) * (1 - press * 0.35)})`,
					background: label ? 'rgba(12,12,13,.86)' : 'transparent',
				}}
			/>
			{label ? (
				<div style={{position: 'absolute', left: -44, top: -10, width: 88, textAlign: 'center', fontFamily: SANS, fontSize: 15, letterSpacing: '0.16em', color: '#fff'}}>{label}</div>
			) : (
				<div style={{position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: '50%', background: color}} />
			)}
			{ripple !== undefined && (
				<div
					style={{
						position: 'absolute', left: -44, top: -44, width: 88, height: 88, borderRadius: '50%', border: `2px solid ${color}`,
						transform: `scale(${1 + ripple / 5})`, opacity: 1 - ripple / 14,
					}}
				/>
			)}
		</div>
	);
};

type Piece = {x: number; y: number; vx: number; vy: number; spin: number; size: number; kind: number; hue: number};
const SHAPES = ['heart', 'sequin', 'star', 'strip'] as const;

/** Party confetti: a burst from `origin` at `start`, falling under gravity. Fully frame-driven. */
export const Confetti: React.FC<{start: number; origin: [number, number]; count?: number; power?: number; seed?: number; rain?: boolean}> = ({
	start, origin, count = 120, power = 1, seed = 1, rain = false,
}) => {
	const f = useGlobalFrame();
	const t = (f - start) / 30;
	if (t < 0) return null;
	const pieces: Piece[] = Array.from({length: count}, (_, i) => {
		const r = (k: number) => hash(seed * 1000 + i * 13 + k);
		const angle = rain ? Math.PI / 2 : -Math.PI / 2 + (r(1) - 0.5) * Math.PI * 1.25;
		const speed = rain ? 80 + r(2) * 120 : (700 + r(2) * 1300) * power;
		return {
			x: rain ? r(3) * 1920 : origin[0], y: rain ? -40 - r(4) * 1200 : origin[1],
			vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
			spin: (r(5) - 0.5) * 14, size: 14 + r(6) * 20, kind: Math.floor(r(7) * 4), hue: r(8),
		};
	});
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{pieces.map((p, i) => {
				const drag = rain ? 1 : Math.exp(-t * 1.4);
				const x = p.x + (p.vx * (1 - drag)) / 1.4 + Math.sin(t * 3 + i) * 30 * Math.min(1, t);
				const y = p.y + (rain ? p.vy * t : (p.vy * (1 - drag)) / 1.4) + 520 * t * t * (rain ? 0.2 : 1);
				if (y > 1200 || x < -80 || x > 2000) return null;
				const flip = Math.cos(t * (4 + p.spin) + i);
				const shape = SHAPES[p.kind];
				const holo = `linear-gradient(${Math.round(p.hue * 360)}deg,#ffd1ec,#b9f3ff,#d9c8ff,#fff3c9,#f5b8ff)`;
				const style: React.CSSProperties = {
					position: 'absolute', left: x, top: y, width: p.size, height: shape === 'strip' ? p.size * 0.32 : p.size,
					transform: `translate(-50%,-50%) rotate(${p.spin * t * 40}deg) scaleY(${flip})`,
				};
				if (shape === 'heart')
					return (
						<svg key={i} viewBox="-10 -10 20 20" style={style}>
							<path d="M0 8C-11 0-6-9 0-4C6-9 11 0 0 8Z" fill={i % 3 ? '#e8173f' : '#ff6b8a'} />
						</svg>
					);
				if (shape === 'star')
					return (
						<svg key={i} viewBox="-10 -10 20 20" style={style}>
							<path d="M0-10L2.6-2.6 10 0 2.6 2.6 0 10-2.6 2.6-10 0-2.6-2.6Z" fill="#eef2f8" stroke="#8e9ab3" strokeWidth=".6" />
						</svg>
					);
				return <div key={i} style={{...style, background: holo, borderRadius: shape === 'sequin' ? '50%' : 2}} />;
			})}
		</AbsoluteFill>
	);
};

/** A looping text band (the website's marquee), moving by frame. */
export const Tape: React.FC<{text: string; speed: number; rotate: number; top: number; bg: string; ink: string; size?: number; start: number; from: 'left' | 'right'}> = ({
	text, speed, rotate, top, bg, ink, size = 54, start, from,
}) => {
	const f = useGlobalFrame();
	const slide = 1 - Math.pow(1 - clamp((f - start) / 12), 3);
	const offset = ((f * speed) % 1400) - 1400;
	return (
		<div
			style={{
				position: 'absolute', left: -300, right: -300, top, height: size * 1.7, background: bg, transform: `translateX(${(1 - slide) * (from === 'left' ? -2600 : 2600)}px) rotate(${rotate}deg)`,
				overflow: 'hidden', display: 'flex', alignItems: 'center', boxShadow: '0 18px 40px rgba(0,0,0,.25)',
			}}
		>
			<div style={{whiteSpace: 'nowrap', transform: `translateX(${offset}px)`, fontFamily: SANS, fontSize: size * 0.62, letterSpacing: '0.18em', color: ink}}>
				{Array.from({length: 6}, () => text).join('')}
			</div>
		</div>
	);
};
