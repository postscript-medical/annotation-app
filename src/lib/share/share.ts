// Client-side sharing (2.5, data-protection §2): the annotated image never leaves the device
// through our servers. It goes to the system share sheet where the browser can share files
// (iPad, phones), otherwise it downloads; printing uses the browser's own print dialog.

export const FILE_NAME = 'postscript-annotation.jpg';
const JPEG_QUALITY = 0.9;

/** The flattened canvas as a JPEG (legacy used a 0.9-quality JPEG data URL). */
export function toJpegBlob(canvas: HTMLCanvasElement, quality = JPEG_QUALITY): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('the canvas could not be encoded'))),
			'image/jpeg',
			quality
		);
	});
}

type ShareNavigator = Pick<Navigator, 'share' | 'canShare'>;

/** True when this browser can share an image file through the system share sheet. */
export function canShareFiles(nav: Partial<ShareNavigator> = navigator): boolean {
	if (typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
	try {
		const probe = new File([new Uint8Array(1)], FILE_NAME, { type: 'image/jpeg' });
		return nav.canShare({ files: [probe] });
	} catch {
		return false;
	}
}

type DownloadDeps = {
	document: Pick<Document, 'createElement' | 'body'>;
	url: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;
	/** When to revoke the object URL; the click starts the download synchronously. */
	later: (callback: () => void) => void;
};

const browserDownloadDeps = (): DownloadDeps => ({
	document,
	url: URL,
	later: (callback) => setTimeout(callback, 60_000)
});

/** Saves the blob as a file through a temporary `<a download>` with an object URL. */
export function downloadBlob(blob: Blob, fileName = FILE_NAME, deps = browserDownloadDeps()) {
	const href = deps.url.createObjectURL(blob);
	const link = deps.document.createElement('a');
	link.href = href;
	link.download = fileName;
	link.rel = 'noopener';
	link.style.display = 'none';
	deps.document.body.append(link);
	link.click();
	link.remove();
	deps.later(() => deps.url.revokeObjectURL(href));
}

export type ShareOutcome = 'shared' | 'cancelled' | 'downloaded';

/**
 * Shares the image where the browser can share files; otherwise, or if sharing fails for any
 * reason but the user cancelling, downloads it.
 */
export async function shareOrDownload(
	blob: Blob,
	{
		nav = navigator as Partial<ShareNavigator>,
		download = (file: Blob) => downloadBlob(file)
	}: { nav?: Partial<ShareNavigator>; download?: (file: Blob) => void } = {}
): Promise<ShareOutcome> {
	if (canShareFiles(nav)) {
		const file = new File([blob], FILE_NAME, { type: 'image/jpeg' });
		try {
			await nav.share!({ files: [file], title: 'Annotated illustration' });
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			// e.g. NotAllowedError (no user activation left) or a share target that failed.
		}
	}
	download(blob);
	return 'downloaded';
}
