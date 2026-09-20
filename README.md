# ts-svg

Type-safe SVG bundling for Vite. `ts-svg` scans a directory (including subdirectories), generates **typed virtual modules**, and lets you import SVGs as framework components with great DX (autocomplete + type checking) and proper bundling/tree-shaking.

https://github.com/user-attachments/assets/d2e4c4a4-4afb-47ec-be09-76954b756a80

## Packages

| Package                                                                         | Version                                                                                                 | Try it out                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@ts-svg/svelte](https://github.com/raycnwong/ts-svg/tree/main/packages/svelte) | [![npm](https://img.shields.io/npm/v/@ts-svg/svelte.svg)](https://www.npmjs.com/package/@ts-svg/svelte) | [![Open in SvelteLab](https://docs.sveltelab.dev/button/dark_short.svg)](https://sveltelab.dev/github.com/raycnwong/ts-svg/tree/main/examples/svelte) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/raycnwong/ts-svg/tree/main/examples/svelte) |

(Other framework adapters will be available soon)

## Why ts-svg?

- **Type-safe imports**: virtual modules are generated with types, so importing from `virtual:ts-svg/...` is typed.
- **Great DX**: namespace import + `<Icon.` gives instant autocomplete for every icon in that folder.
- **Optimized output**: SVGs are optimized (SVGO) and transformed into **Svelte components**.
- **Tree-shakable**: only the SVGs you actually use end up bundled.

---

## SvelteKit Setup (`@ts-svg/svelte`)

### 1) Install

```bash
npm i -D @ts-svg/svelte
```

### 2) Add the Vite plugin

Add `tsSvg()` to `vite.config.ts`. The `path` option is required.

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { tsSvg } from '@ts-svg/svelte';

export default defineConfig({
	plugins: [
		sveltekit(),
		// Step 1: Add the vite plugin
		tsSvg({
			path: './src/lib/svgs',
			// svgoConfig: {...} // optional: override default SVGO config
		}),
	],
});
```

`path` is the folder to scan. All `.svg` files inside it (and subfolders) become typed virtual modules.

### 3) Reference the generated ambient types

In `src/app.d.ts`, add a reference to the generated `ambient.d.ts`:

```ts
// Step 2: Import the generated types
/// <reference types="../.ts-svg/ambient.d.ts" />
```

### 4) Ignore the generated directory

Add `.ts-svg` to both `.gitignore` and `.prettierignore`:

```gitignore
.ts-svg
```

### 5) Generate types in CI (recommended)

In CI (or any non-dev environment), you may not want to rely on the dev server to trigger generation.
Prepend the CLI `ts-svg` in `package.json` scripts that run in CI:

```json
{
	"scripts": {
		"prepare": "ts-svg && svelte-kit sync || echo ''",
		"check": "ts-svg && svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "ts-svg && svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
	}
}
```

---

## Usage

Put SVGs under the directory you configured (e.g. `./src/lib/svgs`).

Then import from `virtual:ts-svg`:

- Root folder: `virtual:ts-svg`
- Subfolder: `virtual:ts-svg/<subfolder>`

### Recommended: namespace import for icon folders

If you have `./src/lib/svgs/icons/*.svg`:

```svelte
<script lang="ts">
	import * as Icon from 'virtual:ts-svg/icons'; // recommended
	// or import one-by-one:
	import { Home } from 'virtual:ts-svg/icons';
</script>

<Icon.Book class="size-200" />
<Home />

<style>
	:global(.size-200) {
		width: 200px;
		height: 200px;
	}

	:global(svg) {
		width: 150px;
		height: 150px;
	}
</style>
```

Typing `<Icon.` will show all icons in autocomplete.

### Props

Imported SVGs are Svelte components and accept normal props (e.g. `class`, `style`, etc.).

For a complete SvelteKit example (config, generated types, and usage), see the sample setup here: [examples/svelte](https://github.com/raycnwong/ts-svg/tree/main/examples/svelte).

---

## Tip: Create a local re-export for nicer imports

If it’s hard to remember import paths like `virtual:ts-svg/icons`, you can create a local module and re-export your namespace.

Create `src/lib/Icon.ts`:

```ts
export * as Icon from 'virtual:ts-svg/icons';
```

Then import from your app code:

```svelte
<script lang="ts">
    import { Icon } from '$lib/Icon';
</script>
```

You can do the same pattern for other subdirectories (e.g. `brand`, `images`, etc.):

---

## Configuration

### `path` (required)

The directory to scan for `.svg` files.

### `svgoConfig` (optional)

Override the default SVGO configuration used during optimization.

```ts
tsSvg({
	path: './src/lib/svgs',
	svgoConfig: {
		// your custom svgo config
	},
});
```

---

## Generated output

`ts-svg` generates this file:

- `.ts-svg/ambient.d.ts` (referenced from `src/app.d.ts`)

---

## FAQ

### Do I need to commit `.ts-svg`?

No. It’s generated output. Add it to `.gitignore` and regenerate it in CI using `ts-svg` in your scripts.

### How do subfolders map to imports?

A subfolder becomes an import path segment.

Example:

- `src/lib/svgs/icons/Home.svg` → `import { Home } from 'virtual:ts-svg/icons'`

### How do I stay safe with tree shaking?

Tree-shaking works best when the bundler can see **exactly which exports you use**.

If you use a namespace import:

```ts
import * as Icon from 'virtual:ts-svg/icons';
```

✅ **Do** access **specific exports**:

```svelte
<Icon.Home />
<Icon.Book />
```

⚠️ **Don’t** pass around or “touch” the whole namespace object (e.g. iterating keys, spreading, or indexing dynamically). If the bundler detects the namespace object itself is used as a value, it may conservatively treat **all exports as used**, which can cause **all icons to be bundled**, even if you only use a few.

Examples to avoid:

```ts
Object.keys(Icon); // iterating namespace
const Comp = Icon[name]; // dynamic access
const list = { ...Icon }; // spreading namespace
```

---

## License

MIT
