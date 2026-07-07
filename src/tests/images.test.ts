import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImages } from '$lib/server/images';

// Intercept disk writes — we only care about paths and returned URLs.
vi.mock('fs', async (importOriginal) => {
	const actual = await importOriginal<typeof import('fs')>();
	return { ...actual, writeFileSync: vi.fn() };
});
import { writeFileSync } from 'fs';

function imageFile(name = 'photo.jpg', type = 'image/jpeg') {
	return new File([new Uint8Array([1, 2, 3])], name, { type });
}

beforeEach(() => {
	vi.mocked(writeFileSync).mockClear();
});

describe('uploadImages (dev/local path)', () => {
	it('writes each file to static/uploads and returns /uploads/ URLs', async () => {
		const urls = await uploadImages([imageFile('a.jpg'), imageFile('b.png', 'image/png')]);

		expect(urls).toHaveLength(2);
		expect(urls[0]).toMatch(/^\/uploads\/[0-9a-f-]{36}\.jpg$/);
		expect(urls[1]).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
		expect(writeFileSync).toHaveBeenCalledTimes(2);

		const writtenPath = vi.mocked(writeFileSync).mock.calls[0][0] as string;
		expect(writtenPath).toContain('static/uploads/');
	});

	it('generates unique filenames for identically-named uploads', async () => {
		const urls = await uploadImages([imageFile('same.jpg'), imageFile('same.jpg')]);
		expect(urls[0]).not.toBe(urls[1]);
	});

	it('rejects non-image files', async () => {
		const evil = new File(['#!/bin/sh'], 'script.sh', { type: 'text/x-shellscript' });
		await expect(uploadImages([evil])).rejects.toThrow(/not an image/);
		expect(writeFileSync).not.toHaveBeenCalled();
	});
});
