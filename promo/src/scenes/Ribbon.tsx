import React from 'react';
import {AbsoluteFill, Img, interpolate, Easing} from 'remotion';
import {INK, LOOKS, PAPER, SANS, SERIF, img} from '../lib/looks';
import {clamp, easeInOut, enter, KICKS, mix, pulse, useGlobalFrame} from '../lib/timing';
import {Cursor} from '../lib/fx';

// 224–336: the website's hero ribbon as a concave 3D arc of cards. A cursor grabs and drags it,
// lands on Indigo, clicks, and the card blooms to full screen for the denim edit.
const ORDER = [5, 2, 1, 4, 7, 3, 0, 6, 5, 2, 7, 1, 4, 3, 0, 6];
const TARGET = 11; // ORDER[11] is Indigo
const CARD_W = 270, CARD_H = 405, R = 820, STEP = 21;

export const Ribbon: React.FC = () => {
	const f = useGlobalFrame();
	const theta = interpolate(f, [224, 266, 296, 306], [3.2, 5.0, 10.6, TARGET], {
		extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
	}) + 0.12 * pulse(f, KICKS, 7);
	const zoom = easeInOut((f - 309) / 25);
	const fade = 1 - clamp((f - 309) / 12);
	return (
		<AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
			<div style={{position: 'absolute', inset: 0, perspective: 1000, perspectiveOrigin: '50% 50%', opacity: fade}}>
				{ORDER.map((li, i) => {
					const d = i - theta, a = (d * STEP * Math.PI) / 180;
					if (Math.abs(d * STEP) > 82) return null;
					const x = R * Math.sin(a), z = R * (1 - Math.cos(a)) * 0.55;
					const look = LOOKS[li];
					const centre = Math.abs(d) < 0.5;
					return (
						<div
							key={i}
							style={{
								position: 'absolute', left: 960 - CARD_W / 2, top: 500 - CARD_H / 2, width: CARD_W, height: CARD_H,
								transform: `translate3d(${x}px, 0, ${z}px) rotateY(${-d * STEP * 0.95}deg)`, zIndex: Math.round(z),
								boxShadow: centre ? '0 30px 70px rgba(0,0,0,.28)' : '0 14px 30px rgba(0,0,0,.14)',
							}}
						>
							<Img src={img(look.image)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: look.focus}} />
							<div style={{position: 'absolute', left: 0, bottom: -30, fontFamily: SANS, fontSize: 12, letterSpacing: '0.16em', color: INK, opacity: clamp(1.6 - Math.abs(d))}}>
								{look.name.toUpperCase()} / {look.line.toUpperCase()}
							</div>
						</div>
					);
				})}
			</div>
			{f >= 308 && (
				<div
					style={{
						position: 'absolute', left: mix(960 - CARD_W / 2, 0, zoom), top: mix(500 - CARD_H / 2, 0, zoom),
						width: mix(CARD_W, 1920, zoom), height: mix(CARD_H, 1080, zoom), overflow: 'hidden', zIndex: 20,
						boxShadow: '0 40px 100px rgba(0,0,0,.3)',
					}}
				>
					<Img src={img('blue')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: LOOKS[1].focus}} />
				</div>
			)}
			<div style={{position: 'absolute', left: 90, bottom: 150, overflow: 'hidden', opacity: fade}}>
				<div style={{fontFamily: SERIF, fontSize: 120, color: INK, lineHeight: 1, transform: `translateY(${(1 - enter(f, 226, 10)) * 120}%)`}}>Eight looks.</div>
			</div>
			<div style={{position: 'absolute', right: 90, bottom: 150, overflow: 'hidden', opacity: fade}}>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, color: INK, lineHeight: 1, transform: `translateY(${(1 - enter(f, 240, 10)) * 120}%)`}}>Zero rules.</div>
			</div>
			<div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: SANS, fontSize: 15, letterSpacing: '0.24em', color: INK, opacity: fade * enter(f, 250, 10)}}>
				←&nbsp;&nbsp;DRAG · SELECT A LOOK&nbsp;&nbsp;→
			</div>
			<Cursor
				keys={[
					{f: 258, x: 1780, y: 820},
					{f: 266, x: 1480, y: 520, label: 'DRAG'},
					{f: 296, x: 600, y: 520, label: 'DRAG'},
					{f: 303, x: 960, y: 500, label: 'VIEW'},
					{f: 312, x: 960, y: 500, label: 'VIEW'},
				]}
				clicks={[308]}
				color={INK}
			/>
		</AbsoluteFill>
	);
};
