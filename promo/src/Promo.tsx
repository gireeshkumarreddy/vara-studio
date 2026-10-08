import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {INK} from './lib/looks';
import {SCENES, SceneStart} from './lib/timing';
import {Flash, Grain, Hud, Shake, Vignette} from './lib/fx';
import {Drop, Intro} from './scenes/Opening';
import {Ribbon} from './scenes/Ribbon';
import {AfterHours, DenimEdit, DrapeWipe} from './scenes/Edits';
import {Build, ColourMenu, EndCard, MainCharacter} from './scenes/Finale';

const scenes: [readonly [number, number], React.FC][] = [
	[SCENES.intro, Intro],
	[SCENES.drop, Drop],
	[SCENES.ribbon, Ribbon],
	[SCENES.denim, DenimEdit],
	[SCENES.afterHours, AfterHours],
	[SCENES.menu, ColourMenu],
	[SCENES.mainCharacter, MainCharacter],
	[SCENES.build, Build],
	[SCENES.end, EndCard],
];

export const Promo: React.FC = () => (
	<AbsoluteFill style={{background: INK}}>
		<Shake>
			{scenes.map(([[from, to], Scene]) => (
				<Sequence key={from} from={from} durationInFrames={to - from} premountFor={30}>
					<SceneStart.Provider value={from}>
						<Scene />
					</SceneStart.Provider>
				</Sequence>
			))}
			<Sequence from={410} durationInFrames={80} premountFor={30}>
				<SceneStart.Provider value={410}>
					<DrapeWipe />
				</SceneStart.Provider>
			</Sequence>
		</Shake>
		<Vignette />
		<Flash />
		<Grain />
		<Hud />
		<Audio src={staticFile('audio/soundtrack.wav')} />
	</AbsoluteFill>
);
