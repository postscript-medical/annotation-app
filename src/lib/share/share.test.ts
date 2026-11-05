import { describe, expect, it, vi } from 'vitest';
import { canShareFiles, downloadBlob, FILE_NAME, shareOrDownload, toJpegBlob } from './share';

const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' });

function sharer({ canShare = true, share = vi.fn(async () => {}) } = {}) {
	return { canShare: vi.fn(() => canShare), share };
}

describe('canShareFiles', () => {
	it('is false without the Web Share API', () => {
		expect(canShareFiles({})).toBe(false);
		expect(canShareFiles({ share: vi.fn() })).toBe(false);
	});

	it('asks canShare about an image file', () => {
		const nav = sharer();

		expect(canShareFiles(nav)).toBe(true);
		const [{ files }] = nav.canShare.mock.calls[0] as unknown as [{ files: File[] }];
		expect(files[0]).toBeInstanceOf(File);
		expect(files[0].type).toBe('image/jpeg');
	});

	it('is false when the browser can share but not files', () => {
		expect(canShareFiles(sharer({ canShare: false }))).toBe(false);
	});

	it('is false when canShare throws', () => {
		expect(
			canShareFiles({
				share: vi.fn(),
				canShare: () => {
					throw new TypeError('bad data');
				}
			})
		).toBe(false);
	});
});

describe('shareOrDownload', () => {
	it('shares the JPEG as a file where it can', async () => {
		const nav = sharer();
		const download = vi.fn();

		expect(await shareOrDownload(jpeg, { nav, download })).toBe('shared');
		expect(download).not.toHaveBeenCalled();
		const [data] = nav.share.mock.calls[0] as unknown as [{ files: File[] }];
		expect(data.files).toHaveLength(1);
		expect(data.files[0].name).toBe(FILE_NAME);
		expect(data.files[0].type).toBe('image/jpeg');
		expect(data.files[0].size).toBe(jpeg.size);
	});

	it('downloads where files cannot be shared', async () => {
		const nav = sharer({ canShare: false });
		const download = vi.fn();

		expect(await shareOrDownload(jpeg, { nav, download })).toBe('downloaded');
		expect(download).toHaveBeenCalledWith(jpeg);
		expect(nav.share).not.toHaveBeenCalled();
	});

	it('downloads without the Web Share API at all', async () => {
		const download = vi.fn();

		expect(await shareOrDownload(jpeg, { nav: {}, download })).toBe('downloaded');
		expect(download).toHaveBeenCalledOnce();
	});

	it('does nothing more when the user cancels the share sheet', async () => {
		const nav = sharer({
			share: vi.fn(async () => {
				throw new DOMException('cancelled', 'AbortError');
			})
		});
		const download = vi.fn();

		expect(await shareOrDownload(jpeg, { nav, download })).toBe('cancelled');
		expect(download).not.toHaveBeenCalled();
	});

	it.each(['NotAllowedError', 'DataError'])('falls back to download on %s', async (name) => {
		const nav = sharer({
			share: vi.fn(async () => {
				throw new DOMException('no', name);
			})
		});
		const download = vi.fn();

		expect(await shareOrDownload(jpeg, { nav, download })).toBe('downloaded');
		expect(download).toHaveBeenCalledWith(jpeg);
	});
});

describe('downloadBlob', () => {
	function fakeDom() {
		const link = {
			href: '',
			download: '',
			rel: '',
			style: { display: '' },
			click: vi.fn(),
			remove: vi.fn()
		};
		const append = vi.fn();
		const later: (() => void)[] = [];
		const deps = {
			document: {
				createElement: vi.fn(() => link),
				body: { append }
			} as unknown as Pick<Document, 'createElement' | 'body'>,
			url: { createObjectURL: vi.fn(() => 'blob:local/1'), revokeObjectURL: vi.fn() },
			later: (callback: () => void) => later.push(callback)
		};
		return { link, append, later, deps };
	}

	it('clicks a hidden download link to an object URL, then cleans up', () => {
		const { link, append, later, deps } = fakeDom();

		downloadBlob(jpeg, 'x.jpg', deps);

		expect(deps.url.createObjectURL).toHaveBeenCalledWith(jpeg);
		expect(link).toMatchObject({
			href: 'blob:local/1',
			download: 'x.jpg',
			style: { display: 'none' }
		});
		expect(append).toHaveBeenCalledWith(link);
		expect(link.click).toHaveBeenCalledOnce();
		expect(link.remove).toHaveBeenCalledOnce();
		// The URL lives until the download has started, then goes.
		expect(deps.url.revokeObjectURL).not.toHaveBeenCalled();
		later.forEach((callback) => callback());
		expect(deps.url.revokeObjectURL).toHaveBeenCalledWith('blob:local/1');
	});

	it('uses the default file name', () => {
		const { link, deps } = fakeDom();

		downloadBlob(jpeg, undefined, deps);

		expect(link.download).toBe(FILE_NAME);
	});
});

describe('toJpegBlob', () => {
	it('encodes the canvas as a 0.9-quality JPEG', async () => {
		const toBlob = vi.fn((callback: BlobCallback) => callback(jpeg));

		await expect(toJpegBlob({ toBlob } as unknown as HTMLCanvasElement)).resolves.toBe(jpeg);
		expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.9);
	});

	it('rejects when the canvas cannot be encoded', async () => {
		const toBlob = (callback: BlobCallback) => callback(null);

		await expect(toJpegBlob({ toBlob } as unknown as HTMLCanvasElement)).rejects.toThrow(
			/could not be encoded/
		);
	});
});
