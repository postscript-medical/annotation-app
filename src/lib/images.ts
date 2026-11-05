// First-party image URLs (G7, 2.4). Everything is served by /images/[...path], which proxies an
// allow-listed set of paths from Cloudinary, so the page never loads another host.

const ILLUSTRATIONS = '/images/annotation-app/illustrations/';

/** The full-size illustration for the canvas. `src` is the catalogue's Cloudinary public ID. */
export function illustrationUrl(src: string): string {
	return ILLUSTRATIONS + encodeURIComponent(src);
}

/** The 180×220 catalogue thumbnail (legacy `ImagesGrid` transformation). */
export function thumbnailUrl(src: string): string {
	return '/images/c_thumb,h_220,w_180/annotation-app/illustrations/' + encodeURIComponent(src);
}

/** The PostScript mark printed on and exported with annotated images. */
export const WATERMARK_URL = '/images/annotation-app/postscript-logo-raster.png';
