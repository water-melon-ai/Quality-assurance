/** File uploads (screenshots, PDFs) via Uploadthing. Returns null when not configured. */
import { UTApi } from 'uploadthing/server';

let utapi: UTApi | null = null;

export function storageEnabled() {
  return Boolean(process.env['UPLOADTHING_SECRET']);
}

export async function uploadBuffer(buffer: Buffer, fileName: string, type: string): Promise<string | null> {
  if (!storageEnabled()) return null;
  try {
    utapi ??= new UTApi();
    const res = await utapi.uploadFiles(new File([new Uint8Array(buffer)], fileName, { type }));
    if (res.data?.url) return res.data.url;
    console.error('[storage] upload failed:', res.error);
  } catch (err) {
    console.error('[storage] upload exception:', err);
  }
  return null;
}
