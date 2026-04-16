// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	integrations: [
		starlight({
			title: 'LX',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/simbafs/lx' }],
			sidebar: [
				{
					label: 'Getting Started',
					link: '/getting-started/',
				},
				{
					label: 'Canonical Syntax',
					autogenerate: { directory: 'canonical' },
				},
				{
					label: 'Sugar Syntax',
					autogenerate: { directory: 'sugar' },
				},
				{
					label: 'Examples',
					autogenerate: { directory: 'examples' },
				},
			],
		}),
	],
});
