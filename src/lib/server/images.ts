import { writeFileSync } from 'fs';
import { join } from 'path';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/**
 * Upload image files and return their public URLs.
 * In dev: saves to static/uploads/ and returns /uploads/{filename}.
 * In prod: uploads to S3 and returns the CDN URL.
 *
 * To enable S3 in prod, install:
 *   npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
 */
export async function uploadImages(files: File[]): Promise<string[]> {
	if (dev) {
		return saveLocally(files);
	}
	return uploadToS3(files);
}

async function saveLocally(files: File[]): Promise<string[]> {
	const urls: string[] = [];

	for (const file of files) {
		if (!file.type.startsWith('image/')) {
			throw new Error(`${file.name} is not an image`);
		}

		const ext = file.name.split('.').pop() ?? 'jpg';
		const filename = `${crypto.randomUUID()}.${ext}`;
		const buffer = Buffer.from(await file.arrayBuffer());

		writeFileSync(join('static', 'uploads', filename), buffer);
		urls.push(`/uploads/${filename}`);
	}

	return urls;
}

async function uploadToS3(files: File[]): Promise<string[]> {
	// Lazy-import so the AWS SDK is only needed in production.
	// Install with: npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { S3Client } = await import('@aws-sdk/client-s3' as any);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { Upload } = await import('@aws-sdk/lib-storage' as any);

	const client = new S3Client({
		region: env.AWS_REGION,
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
		}
	});

	const urls: string[] = [];

	for (const file of files) {
		if (!file.type.startsWith('image/')) {
			throw new Error(`${file.name} is not an image`);
		}

		const ext = file.name.split('.').pop() ?? 'jpg';
		const key = `${crypto.randomUUID()}.${ext}`;
		const buffer = Buffer.from(await file.arrayBuffer());

		const upload = new Upload({
			client,
			params: {
				Bucket: env.AWS_S3_BUCKET,
				Key: key,
				Body: buffer,
				ContentType: file.type
			}
		});

		await upload.done();
		urls.push(`https://${env.CDN_URL}/${key}`);
	}

	return urls;
}
