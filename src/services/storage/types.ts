export interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType?: string): Promise<string>;
  delete(url: string): Promise<void>;
}
