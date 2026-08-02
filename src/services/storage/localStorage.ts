import { StorageProvider } from './types.js';

export class LocalStorageProvider implements StorageProvider {
  async upload(file: Buffer, filename: string, mimeType?: string): Promise<string> {
    const type = mimeType || 'application/octet-stream';
    const base64 = file.toString('base64');
    return `data:${type};name=${encodeURIComponent(filename)};base64,${base64}`;
  }

  async delete(_url: string): Promise<void> {
    // Memory/Data URI does not require local filesystem deletion
    return Promise.resolve();
  }
}
