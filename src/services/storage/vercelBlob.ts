import { put, del } from '@vercel/blob';
import { StorageProvider } from './types.js';

export class VercelBlobStorage implements StorageProvider {
  async upload(file: Buffer, filename: string, mimeType?: string): Promise<string> {
    const blob = await put(`uploads/${Date.now()}-${filename}`, file, {
      access: 'public',
      contentType: mimeType || 'application/octet-stream'
    });
    return blob.url;
  }

  async delete(url: string): Promise<void> {
    if (url && url.startsWith('http')) {
      try {
        await del(url);
      } catch (err) {
        console.warn('Vercel Blob delete warning:', err);
      }
    }
  }
}
