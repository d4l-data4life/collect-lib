import { Buffer } from 'buffer/';

export interface CryptoModule {
  deriveEncryptionKey(recoveryKey: Uint8Array, salt: string): Promise<Buffer>;
  generateKey(size: number): Buffer;
}
