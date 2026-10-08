import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {COPPER, DENIM, LOOKS, PAPER, SANS, SERIF, img} from '../lib/looks';
import {clamp, easeInOut, easeOut, enter, KICKS, mix, pop, pulse, useGlobalFrame} from '../lib/timing';
import {Confetti, rgbSplit} from '../lib/fx';
import {DenimDrape} from '../lib/Drape';

const Word: React.FC<{at: number; f: number; children: React.ReactNode; italic?: boolean; size: number; color: string; from?: number}> = ({at, f, children, italic, size, color, from = 1}) => {
	const k = enter(f, at, 9);
	return (
		<div style={{overflow: 'hidden', lineHeight: 1.02}}>
			<div
				style={{
					fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, color, opacity: f >= at ? 1 : 0,
					transform: `translateY(${(1 - k) * 110 * from}%) skewY(${(1 - k) * 6}deg)`, textShadow: rgbSplit(14 * pulse(f, [at], 9)),
				}}
			>
				{children}
			</div>
		</div>
	);
};

// 336–448: the denim edit. The Indigo photo slides into a half-screen split, the headline lands
// word by word on the snare, and "No notes." stamps across the seam.
export const DenimEdit: React.FC = () => {
	const f = useGlobalFrame();
	const split = easeOut((f - 336) / 12);
	const stamp = pop(f, 392, 16);
	return (
		<AbsoluteFill style={{background: DENIM, overflow: 'hidden'}}>
			<AbsoluteFill style={{left: 960}}>
				<Img src={img('weave')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.42) saturate(1.1)', transform: `scale(${1.15 - 0.1 * easeOut((f - 336) / 112)})`}} />
				<AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(23,39,66,.85), rgba(23,39,66,.35))'}} />
			</AbsoluteFill>
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: mix(1920, 960, split), overflow: 'hidden'}}>
				<Img
					src={img('blue')}
					style={{width: 960 + (1 - split) * 960, height: '100%', objectFit: 'cover', objectPosition: LOOKS[1].focus, transform: `scale(${1.06 - 0.06 * easeOut((f - 336) / 112) + 0.02 * pulse(f, KICKS, 6)})`}}
				/>
			</div>
			<div style={{position: 'absolute', left: 1050, top: 160}}>
				<div style={{fontFamily: SANS, fontSize: 16, letterSpacing: '0.24em', color: COPPER, marginBottom: 26, opacity: enter(f, 340, 8)}}>01 — THE DENIM EDIT</div>
				<Word at={336} f={f} size={128} color="#fff">Some</Word>
				<Word at={350} f={f} size={128} color="#fff">fits</Word>
				<Word at={364} f={f} size={128} color="#fff">just</Word>
				<Word at={378} f={f} size={128} color="#fff">hit.</Word>
			</div>
			{f >= 392 && (
				<div
					style={{
						position: 'absolute', left: 590, top: 790, padding: '6px 34px 16px', border: `5px solid ${COPPER}`, borderRadius: 18,
						fontFamily: SERIF, fontStyle: 'italic', fontSize: 150, color: COPPER, lineHeight: 1,
						transform: `rotate(-8deg) scale(${2.6 - 1.6 * stamp})`, opacity: clamp(stamp * 3), background: 'rgba(23,39,66,.55)',
						textShadow: rgbSplit(18 * pulse(f, [392], 10)),
					}}
				>
					No notes.
				</div>
			)}
			<div style={{position: 'absolute', right: 90, bottom: 150, fontFamily: SANS, fontSize: 18, letterSpacing: '0.18em', color: '#fff', transform: `translateX(${(1 - enter(f, 402, 10)) * 120}%)`}}>
				CROPPED TRUCKER & MAXI SKIRT — ₹7,490
			</div>
		</AbsoluteFill>
	);
};

// 410–490: the website's denim drape. The waistband rises over the denim edit, holds through the
// drop, then the frayed hem lifts away to reveal the going-out campaign.
export const DrapeWipe: React.FC = () => {
	const f = useGlobalFrame();
	const top = mix(1260, -320, easeInOut((f - 412) / 32));
	const bottom = f < 452 ? 1700 : mix(1250, -260, easeInOut((f - 452) / 30));
	return <DenimDrape top={top} bottom={bottom} amp={48} swing={clamp((f - 452) / 10)} />;
};

// 448–560: AFTER / hours. Full-bleed campaign, confetti bursting up as the drape lifts.
export const AfterHours: React.FC = () => {
	const f = useGlobalFrame();
	const push = 1.2 - 0.14 * easeOut((f - 448) / 112) + 0.03 * pulse(f, KICKS, 6);
	const drift = (f - 470) * 0.8;
	const lines = ['For the plans.', 'For the plot twists.', 'For everything after.'];
	const blinds = Array.from({length: 8}, (_, i) => easeInOut((f - 546 - i * 1.2) / 9));
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<Img src={img('red')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: LOOKS[0].focus, transform: `scale(${push})`}} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.05) 40%, rgba(0,0,0,.55))'}} />
			<div style={{position: 'absolute', top: 110, left: mix(-1100, 70, enter(f, 470, 14)) - Math.max(0, drift), fontFamily: SERIF, fontSize: 300, color: '#fff', lineHeight: 1, textShadow: rgbSplit(16 * pulse(f, [470], 10))}}>AFTER</div>
			<div style={{position: 'absolute', bottom: 70, right: mix(-1100, 70, enter(f, 476, 14)) - Math.max(0, drift), fontFamily: SERIF, fontStyle: 'italic', fontSize: 330, color: '#fff', lineHeight: 1, textShadow: rgbSplit(16 * pulse(f, [476], 10))}}>hours.</div>
			<div style={{position: 'absolute', left: 90, bottom: 330, color: '#fff'}}>
				<div style={{fontFamily: SANS, fontSize: 16, letterSpacing: '0.26em', marginBottom: 22, opacity: enter(f, 486, 8)}}>THE GOING-OUT EDIT</div>
				{lines.map((l, i) => (
					<div key={l} style={{fontFamily: SERIF, fontSize: 56, lineHeight: 1.12, opacity: enter(f, 490 + i * 14, 8), transform: `translateY(${(1 - enter(f, 490 + i * 14, 8)) * 30}px)`}}>
						{l}
					</div>
				))}
			</div>
			<Confetti start={456} origin={[960, 1180]} count={170} power={1.15} seed={4} />
			<Confetti start={448} origin={[0, 0]} count={70} rain seed={9} />
			{blinds.map((p, i) => (
				<div key={i} style={{position: 'absolute', left: i * 240, width: 241, top: 0, height: `${p * 100}%`, background: PAPER}} />
			))}
		</AbsoluteFill>
	);
};
