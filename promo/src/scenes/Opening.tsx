import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {COPPER, INK, LOOKS, PAPER, SANS, SERIF, img} from '../lib/looks';
import {clamp, easeIn, easeInOut, easeOut, enter, hash, mix, pop, pulse, useGlobalFrame} from '../lib/timing';
import {rgbSplit} from '../lib/fx';

// 0–112: the website's loader. A slit opens with the looks flickering inside, the four letters
// slam in on the beat, then the camera dives into the slit.
export const Intro: React.FC = () => {
	const f = useGlobalFrame();
	const slitW = 520 * easeOut(f / 22);
	const slitH = mix(2, 300, easeInOut((f - 22) / 30));
	const dive = f < 100 ? 1 : 1 + easeIn((f - 100) / 12) * 9;
	const look = LOOKS[f < 80 ? Math.floor(f / 7) % 8 : Math.floor(f / 3.5) % 8];
	const letters = [
		{ch: 'V', at: 56},
		{ch: 'Ā', at: 70},
		{ch: 'R', at: 84},
		{ch: 'A', at: 98},
	];
	const Letter = ({ch, at}: {ch: string; at: number}) => {
		const on = f >= at;
		const k = enter(f, at, 7);
		return (
			<span
				style={{
					display: 'inline-block', fontFamily: SERIF, fontSize: 250, color: '#fff', lineHeight: 1, opacity: on ? 1 : 0,
					transform: `scale(${on ? 1 + 0.9 * (1 - k) : 1}) translateY(${(1 - k) * -40}px)`,
					filter: `blur(${(1 - k) * 14}px)`, textShadow: rgbSplit(16 * pulse(f, [at], 9)),
				}}
			>
				{ch}
			</span>
		);
	};
	const count = String(Math.min(100, Math.floor((f / 100) * 100))).padStart(3, '0');
	return (
		<AbsoluteFill style={{background: INK, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 34, transform: `scale(${dive})`}}>
				<Letter {...letters[0]} />
				<Letter {...letters[1]} />
				<div style={{width: slitW, height: slitH, overflow: 'hidden', position: 'relative', background: '#fff'}}>
					<Img src={img(look.image)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: look.focus}} />
				</div>
				<Letter {...letters[2]} />
				<Letter {...letters[3]} />
			</div>
			<div style={{position: 'absolute', left: 56, right: 56, bottom: 120, display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 18, letterSpacing: '0.2em', color: '#fff', opacity: 1 - clamp((f - 100) / 6)}}>
				<span>NEW DROPS EVERY FRIDAY</span>
				<span style={{fontVariantNumeric: 'tabular-nums'}}>{count}</span>
			</div>
			<div style={{position: 'absolute', left: '50%', bottom: 100, width: 300, height: 1.5, marginLeft: -150, background: 'rgba(255,255,255,.25)'}}>
				<div style={{width: `${Math.min(100, f)}%`, height: '100%', background: COPPER}} />
			</div>
		</AbsoluteFill>
	);
};

// 112–224: "DRESSED / FOR / now." on the first three beats, then the eight looks strobe on 8ths.
export const Drop: React.FC = () => {
	const f = useGlobalFrame();
	if (f < 168) {
		const word = f < 126 ? 0 : f < 140 ? 1 : 2;
		const start = [112, 126, 140][word];
		const k = enter(f, start, 8);
		const split = rgbSplit(22 * pulse(f, [start], 10));
		if (word === 0)
			return (
				<AbsoluteFill style={{background: INK, alignItems: 'center', justifyContent: 'center'}}>
					<div style={{fontFamily: SERIF, fontSize: 330, letterSpacing: '-0.04em', color: '#fff', transform: `scale(${1.3 - 0.3 * k}) skewX(${(1 - k) * -12}deg)`, textShadow: split}}>DRESSED</div>
				</AbsoluteFill>
			);
		if (word === 1)
			return (
				<AbsoluteFill style={{background: LOOKS[0].colour, alignItems: 'center', justifyContent: 'center'}}>
					{[-1, 1].map((d) => (
						<div key={d} style={{position: 'absolute', fontFamily: SERIF, fontSize: 420, color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,.35)', transform: `translateX(${d * (380 + (f - 126) * 18)}px)`}}>FOR</div>
					))}
					<div style={{fontFamily: SERIF, fontSize: 420, color: 'transparent', WebkitTextStroke: '4px #fff', transform: `scale(${1.4 - 0.4 * k})`, textShadow: split}}>FOR</div>
				</AbsoluteFill>
			);
		return (
			<AbsoluteFill style={{background: PAPER, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
				{LOOKS.map((look, i) => {
					const a = (i / 8) * Math.PI * 2 + 0.4, r = 560 * easeOut((f - 140) / 18) + (f - 140) * 4;
					return (
						<Img
							key={look.image}
							src={img(look.image)}
							style={{
								position: 'absolute', width: 200, height: 300, objectFit: 'cover', objectPosition: look.focus,
								transform: `translate(${Math.cos(a) * r * 1.5}px, ${Math.sin(a) * r * 0.8}px) rotate(${(hash(i) - 0.5) * 30}deg) scale(${0.4 + 0.6 * easeOut((f - 140) / 10)})`,
								boxShadow: '0 20px 50px rgba(0,0,0,.25)',
							}}
						/>
					);
				})}
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 540, color: INK, transform: `scale(${(1.6 - 0.6 * k) * (1 + (f - 140) * 0.003)})`, textShadow: split}}>now.</div>
			</AbsoluteFill>
		);
	}
	const k = Math.min(7, Math.floor((f - 168) / 7));
	const look = LOOKS[k];
	const local = f - 168 - k * 7;
	const s = 1.18 - 0.18 * easeOut(local / 4);
	return (
		<AbsoluteFill style={{background: look.colour, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
			<div style={{position: 'absolute', fontFamily: SERIF, fontSize: 250, whiteSpace: 'nowrap', color: 'transparent', WebkitTextStroke: `2.5px ${look.ink}`, opacity: 0.7, transform: `translateX(${(local - 3) * 14}px)`}}>
				{look.name.toUpperCase()}
			</div>
			<Img
				src={img(look.image)}
				style={{width: 500, height: 750, objectFit: 'cover', objectPosition: look.focus, transform: `scale(${s}) rotate(${(hash(k + 3) - 0.5) * 9}deg)`, boxShadow: '0 40px 90px rgba(0,0,0,.35)'}}
			/>
			<div style={{position: 'absolute', left: 120, bottom: 150, fontFamily: SANS, fontSize: 20, letterSpacing: '0.18em', color: look.ink}}>
				0{k + 1} / 08
			</div>
			<div style={{position: 'absolute', right: 120, bottom: 150, textAlign: 'right', color: look.ink}}>
				<div style={{fontFamily: SERIF, fontSize: 64, lineHeight: 1}}>{look.name}</div>
				<div style={{fontFamily: SANS, fontSize: 18, letterSpacing: '0.18em', marginTop: 10}}>
					{look.line.toUpperCase()} — {look.price}
				</div>
			</div>
		</AbsoluteFill>
	);
};
