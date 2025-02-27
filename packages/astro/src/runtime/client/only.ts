import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';
import { listen, notify } from './events';

/**
 * Hydrate this component only on the client
 */
export default async function onOnly(
	astroId: string,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	let innerHTML: string | null = null;
	let hydrate: Awaited<ReturnType<GetHydrateCallback>>;

	async function only() {
		listen(only);
		const roots = document.querySelectorAll(`astro-root[ssr][uid="${astroId}"]`);
		if (roots.length === 0) return;
		if (typeof innerHTML !== 'string') {
			let fragment = roots[0].querySelector(`astro-fragment`);
			if (fragment == null && roots[0].hasAttribute('tmpl')) {
				// If there is no child fragment, check to see if there is a template.
				// This happens if children were passed but the client component did not render any.
				let template = roots[0].querySelector(`template[data-astro-template]`);
				if (template) {
					innerHTML = template.innerHTML;
					template.remove();
				}
			} else if (fragment) {
				innerHTML = fragment.innerHTML;
			}
		}
		if (!hydrate) {
			hydrate = await getHydrateCallback();
		}
		for (const root of roots) {
			if (root.parentElement?.closest('astro-root[ssr]')) continue;
			await hydrate(root, innerHTML);
			root.removeAttribute('ssr');
		}
		notify();
	}
	only();
}
