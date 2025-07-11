import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const R2_ENDPOINT = process.env.R2_S3_API!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = R2_ENDPOINT.split('/').pop()!;
const R2_ENDPOINT_URL = R2_ENDPOINT.replace(/\/[^/]+$/, '');

export const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function uploadProfilePic(upi: string, buffer: Buffer, contentType: string = 'image/png') {
  const key = `profile-pics/${upi}.png`;
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

export async function getProfilePic(upi: string): Promise<{ Body: Buffer, LastModified?: Date, ContentLength?: number } | null> {
  const key = `profile-pics/${upi}.png`;
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return {
      Body: Buffer.concat(chunks),
      LastModified: res.LastModified,
      ContentLength: res.ContentLength,
    };
  } catch (err: any) {
    if (err.$metadata && err.$metadata.httpStatusCode === 404) return null;
    return null;
  }
}

export async function deleteProfilePics(upi: string) {
  // Delete all possible extensions for this UPI
  const exts = ['png', 'jpg', 'jpeg', 'webp'];
  for (const ext of exts) {
    const key = `profile-pics/${upi}.${ext}`;
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    } catch {}
  }
} 