import {staticFile} from 'remotion';

// The eight VĀRA Studio looks, matching dist/catalog.js on the website.
export type Look = {name: string; line: string; price: string; colour: string; ink: string; image: string; focus: string};

export const LOOKS: Look[] = [
	{name: 'Cherry Cola', line: 'Biker', price: '₹8,990', colour: '#c8102e', ink: '#fff', image: 'red', focus: '50% 22%'},
	{name: 'Indigo', line: 'Denim set', price: '₹7,490', colour: '#2b4a7a', ink: '#fff', image: 'blue', focus: '50% 30%'},
	{name: 'Matcha', line: 'Wrap mini', price: '₹3,490', colour: '#a3b77e', ink: '#111', image: 'green', focus: '50% 30%'},
	{name: 'Oat Milk', line: 'Blazer', price: '₹9,990', colour: '#d9c9ad', ink: '#111', image: 'ivory', focus: '50% 25%'},
	{name: 'Bubblegum', line: 'Tracksuit', price: '₹5,990', colour: '#ff8cc6', ink: '#111', image: 'pink', focus: '50% 40%'},
	{name: 'Yuzu', line: 'Half-zip', price: '₹6,490', colour: '#f2b705', ink: '#111', image: 'gold', focus: '50% 25%'},
	{name: 'Black Coffee', line: 'Cargo suit', price: '₹11,490', colour: '#141414', ink: '#fff', image: 'black', focus: '50% 35%'},
	{name: 'Ube', line: 'Maxi dress', price: '₹6,990', colour: '#7b4bb3', ink: '#fff', image: 'lilac', focus: '50% 30%'},
];

export const img = (name: string) => staticFile(`img/${name}.webp`);

export const PAPER = '#f5f3ef';
export const INK = '#0c0c0d';
export const DENIM = '#22385e';
export const COPPER = '#f0b25e';
export const SERIF = 'Editorial, "Times New Roman", serif';
export const SANS = 'Interface, Arial, sans-serif';
