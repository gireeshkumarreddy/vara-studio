import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {INK, LOOKS, PAPER, SANS, SERIF, img} from '../lib/looks';
import {clamp, easeOut, enter, hash, KICKS, mix, pop, pulse, useGlobalFrame} from '../lib/timing';
import {Confetti, Cursor, Tape, rgbSplit} from '../lib/fx';
import {DenimDrape} from '../lib/Drape';

// 560–672: "Find your colour." The eight looks deal out in a fan on 8ths, then the cursor
// hovers each one and its colour floods the screen from the card.
const FAN = LOOKS.map((_, i) => {
	const d = i - 3.5;
	return {x: 960 + d * 214, y: 640 + d * d * 10, r: d * 3.6};
});
export const ColourMenu: React.FC = () => {
	const f = useGlobalFrame();
	const k = f < 616 ? -1 : Math.min(7, Math.floor((f - 616) / 7));
	const hoverStart = 616 + k * 7;
	const base = k <= 0 ? PAPER : LOOKS[k - 1].colour;
	const flood = k >= 0 ? LOOKS[k] : null;
	const ink = flood ? flood.ink : INK;
	const radius = 2400 * easeOut((f - hoverStart) / 8);
	return (
		<AbsoluteFill style={{background: base, overflow: 'hidden'}}>
			{flood && <AbsoluteFill style={{background: flood.colour, clipPath: `circle(${radius}px at ${FAN[k].x}px ${FAN[k].y - 60}px)`}} />}
			<div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', color: ink, lineHeight: 0.95}}>
				<div style={{fontFamily: SERIF, fontSize: 120, transform: `translateY(${(1 - enter(f, 560, 10)) * 60}px)`, opacity: enter(f, 560, 6)}}>
					Find your <span style={{fontStyle: 'italic', fontSize: 150, textShadow: rgbSplit(10 * pulse(f, [560, ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => 616 + i * 7)], 7))}}>colour.</span>
				</div>
			</div>
			{LOOKS.map((look, i) => {
				const p = pop(f, 560 + i * 7, 16), hovered = i === k;
				const lift = hovered ? easeOut((f - hoverStart) / 5) : 0;
				const {x, y, r} = FAN[i];
				return (
					<div
						key={look.image}
						style={{
							position: 'absolute', left: x - 95, top: y - 142, width: 190, zIndex: hovered ? 10 : i,
							transform: `translateY(${(1 - p) * 360 - lift * 60}px) rotate(${r * (1 - lift) + (1 - p) * 24}deg) scale(${(0.4 + 0.6 * p) * (1 + lift * 0.18)})`,
							opacity: clamp(p * 4),
						}}
					>
						<Img src={img(look.image)} style={{width: 190, height: 285, objectFit: 'cover', objectPosition: look.focus, boxShadow: hovered ? '0 40px 70px rgba(0,0,0,.4)' : '0 16px 30px rgba(0,0,0,.18)', outline: hovered ? '4px solid #fff' : 'none'}} />
						<div style={{marginTop: 14, color: ink, textAlign: 'center'}}>
							<div style={{fontFamily: SERIF, fontSize: 25}}>{look.name}</div>
							<div style={{fontFamily: SANS, fontSize: 13, letterSpacing: '0.16em', marginTop: 4}}>{look.price}</div>
						</div>
					</div>
				);
			})}
			<Cursor
				keys={[
					{f: 606, x: 1800, y: 1000},
					...FAN.map((p, i) => ({f: 614 + i * 7, x: p.x + 20, y: p.y - 60, label: 'VIEW'})),
					{f: 672, x: FAN[7].x + 20, y: FAN[7].y - 60, label: 'VIEW'},
				]}
				clicks={LOOKS.map((_, i) => 616 + i * 7)}
			/>
		</AbsoluteFill>
	);
};

// 672–784: "Be the MAIN character." Yuzu centre stage, caution-tape marquees, stickers slapping on.
const STICKERS = [
	{at: 728, look: 0, x: 250, y: 220, r: -12},
	{at: 742, look: 4, x: 1450, y: 190, r: 10},
	{at: 756, look: 7, x: 230, y: 560, r: 8},
	{at: 770, look: 1, x: 1480, y: 540, r: -9},
];
export const MainCharacter: React.FC = () => {
	const f = useGlobalFrame();
	const p = pop(f, 672, 18);
	const bump = 1 + 0.035 * pulse(f, KICKS, 6);
	const yuzu = LOOKS[5];
	return (
		<AbsoluteFill style={{background: yuzu.colour, overflow: 'hidden'}}>
			<div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: SANS, fontSize: 28, letterSpacing: '0.5em', color: INK, opacity: enter(f, 676, 8)}}>BE THE</div>
			<div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: SERIF, fontSize: 470, lineHeight: 1, color: INK, letterSpacing: '-0.03em', transform: `scale(${1.25 - 0.25 * enter(f, 672, 10)})`}}>MAIN</div>
			<Img
				src={img('gold')}
				style={{
					position: 'absolute', left: 960 - 250, top: 190, width: 500, height: 750, objectFit: 'cover', objectPosition: yuzu.focus,
					transform: `rotate(${(1 - p) * -12}deg) scale(${(0.55 + 0.45 * p) * bump})`, boxShadow: '0 50px 100px rgba(0,0,0,.35)',
				}}
			/>
			<div style={{position: 'absolute', top: 600, width: '100%', textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 240, color: INK, lineHeight: 1, transform: `translateX(${(1 - enter(f, 686, 12)) * 1400}px)`, textShadow: rgbSplit(14 * pulse(f, [686], 9))}}>
				character.
			</div>
			{STICKERS.map(({at, look, x, y, r}) => {
				const s = pop(f, at, 12);
				if (f < at) return null;
				const L = LOOKS[look];
				return (
					<div key={at} style={{position: 'absolute', left: x, top: y, padding: 10, background: '#fff', boxShadow: '0 24px 50px rgba(0,0,0,.3)', transform: `rotate(${r + (1 - s) * 18}deg) scale(${1.9 - 0.9 * s})`}}>
						<Img src={img(L.image)} style={{display: 'block', width: 190, height: 260, objectFit: 'cover', objectPosition: L.focus}} />
						<div style={{fontFamily: SANS, fontSize: 13, letterSpacing: '0.14em', color: INK, marginTop: 8}}>{L.name.toUpperCase()} · {L.price}</div>
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute', left: 1240, top: 250, width: 170, height: 170, borderRadius: '50%', background: INK, color: yuzu.colour,
					display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, letterSpacing: '0.12em',
					transform: `rotate(${(f - 700) * 2.5}deg) scale(${pop(f, 700, 12)})`,
				}}
			>
				<div style={{fontSize: 14}}>NEW IN</div>
				<div style={{fontFamily: SERIF, fontSize: 40, letterSpacing: 0}}>{yuzu.price}</div>
			</div>
			<Tape text="DENIM ✦ TAILORING ✦ STREETWEAR ✦ GOING OUT ✦ ESSENTIALS ✦ " speed={9} rotate={-4} top={918} bg={INK} ink={yuzu.colour} start={676} from="left" />
			<Tape text="NEW DROPS EVERY FRIDAY ✦ DROP 08 ✦ AW26 ✦ " speed={-7} rotate={3} top={985} bg="#fff" ink={INK} start={686} from="right" />
		</AbsoluteFill>
	);
};

// 784–840: the build. Duotone cuts accelerate from 8ths to 16ths to 32nds under NEW DROPS EVERY
// FRIDAY, then a breath of black before the final hit.
const CUTS = [784, 791, 798, 805, 812, 816, 819, 823, 826, 828, 830, 832, 834];
const WORDS: [number, string][] = [[784, 'NEW'], [798, 'DROPS'], [812, 'EVERY'], [826, 'FRIDAY']];
export const Build: React.FC = () => {
	const f = useGlobalFrame();
	if (f >= 836) return <AbsoluteFill style={{background: '#000'}} />;
	let c = 0;
	while (c < CUTS.length - 1 && f >= CUTS[c + 1]) c++;
	const look = LOOKS[(c * 3) % 8];
	const grow = (f - 784) / 52;
	const word = [...WORDS].reverse().find(([s]) => f >= s)!;
	return (
		<AbsoluteFill style={{background: look.colour, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}}>
			<Img src={img(look.image)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: look.focus, filter: 'grayscale(1) contrast(1.5) brightness(1.05)', mixBlendMode: 'multiply', transform: `scale(${1.1 + grow * 0.4 + (c % 2) * 0.05})`}} />
			<div style={{position: 'relative', fontFamily: SANS, fontSize: 290, letterSpacing: '-0.02em', color: '#fff', transform: `scale(${1 + grow * 0.35 + 0.08 * pulse(f, [word[0]], 6)})`, textShadow: rgbSplit(6 + grow * 26, 0.95)}}>
				{word[1]}
			</div>
		</AbsoluteFill>
	);
};

// 840–900: the end card. Denim drops in with its waistband across the top, the wordmark slams
// letter by letter, and the cursor clicks SHOP THE DROP as confetti falls.
export const EndCard: React.FC = () => {
	const f = useGlobalFrame();
	const top = mix(1250, 40, easeOut((f - 840) / 9));
	const press = pulse(f, [884], 8);
	return (
		<AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
			<DenimDrape top={top} bottom={1800} amp={26} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + (f - 840) * 0.0012})`}}>
				<div style={{display: 'flex', gap: 10, marginTop: -40}}>
					{['V', 'Ā', 'R', 'A'].map((ch, i) => {
						const s = pop(f, 842 + i * 3, 12);
						return (
							<span key={ch + i} style={{fontFamily: SERIF, fontSize: 290, lineHeight: 1, color: '#fff', opacity: f >= 842 + i * 3 ? 1 : 0, transform: `translateY(${(1 - s) * -160}px) scale(${1.6 - 0.6 * s})`, textShadow: `${rgbSplit(14 * pulse(f, [842 + i * 3], 9))}`}}>
								{ch}
							</span>
						);
					})}
				</div>
				<div style={{fontFamily: SANS, fontSize: 26, letterSpacing: '0.8em', color: '#fff', marginTop: 6, marginRight: -20, opacity: enter(f, 856, 8)}}>STUDIO</div>
				<div style={{fontFamily: SANS, fontSize: 17, letterSpacing: '0.26em', color: '#cfd9e8', marginTop: 34, opacity: enter(f, 862, 8)}}>DROP 08 · AW26 · NEW DROPS EVERY FRIDAY</div>
				<div
					style={{
						marginTop: 46, padding: '20px 44px', borderRadius: 999, background: '#fff', color: INK, fontFamily: SANS, fontSize: 20, letterSpacing: '0.22em',
						transform: `scale(${pop(f, 868, 12) * (1 - press * 0.08)})`, boxShadow: '0 20px 50px rgba(0,0,0,.35)',
					}}
				>
					SHOP THE DROP ↗
				</div>
			</AbsoluteFill>
			<Confetti start={840} origin={[960, 1150]} count={150} power={1.2} seed={12} />
			<Cursor keys={[{f: 872, x: 1560, y: 1000}, {f: 881, x: 1000, y: 716}, {f: 900, x: 1000, y: 716}]} clicks={[884]} />
		</AbsoluteFill>
	);
};
