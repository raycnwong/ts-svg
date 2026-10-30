import { readFile } from 'node:fs/promises';
import { tsSvg as tsSvgCore } from '@ts-svg/core';
import { optimize } from 'svgo';
import { compile } from 'svelte/compiler';

/**
 * @typedef Options
 * @type {object}
 * @property {string} path The svg folder path
 * @property {import('svgo').Config | undefined} svgoConfig
 */

/** @type {import('svgo').Config} */
const defaultSvgoConfig = {
	plugins: [
		'preset-default',
		'removeDimensions',
		'convertColors',
		'removeUselessStrokeAndFill',
		{
			name: 'addAttributesToSVGElement',
			params: {
				attribute: {
					role: 'img',
					'aria-hidden': 'true',
				},
			},
		},
	],
};

/**
 * Returns the Vite plugin.
 * @param {Options} options
 * @returns {import('vite').PluginOption & import('@ts-svg/core').Options}
 */
export function tsSvg(options) {
	return tsSvgCore({
		path: options.path,
		query: '?svelte',
		svgModuleDeclaration: `
declare module '*.svg?svelte' {
	import type { Component } from 'svelte';
	const component: Component;
	export default component;
}
`,
		async transform(_code, id, transformOptions) {
			if (!id.endsWith('.svg?svelte')) {
				return;
			}
			const svgPath = id.replace(/\.svg\?svelte$/, '.svg');
			const svgSource = await readFile(svgPath, 'utf-8');
			const { data: optimizedSvgSource } = optimize(
				svgSource,
				options.svgoConfig ?? defaultSvgoConfig,
			);
			const componentCode = optimizedSvgSource.replace(/<svg([^>]*)>/, '<svg$1 {...$$$$props}>');
			const component = compile(componentCode, {
				generate: transformOptions?.ssr ? 'server' : undefined,
			});
			return {
				code: component.js.code,
				map: { mappings: '' },
			};
		},
	});
}
