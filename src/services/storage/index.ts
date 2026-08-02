import { StorageProvider } from './types.js';
import { VercelBlobStorage } from './vercelBlob.js';
import { LocalStorageProvider } from './localStorage.js';

export function getStorageProvider(): StorageProvider {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobStorage();
  }
  return new LocalStorageProvider();
}

export * from './types.js';
