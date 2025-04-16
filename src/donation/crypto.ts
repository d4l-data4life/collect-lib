export interface CryptoModule {
  deriveEncryptionKey(recoveryKey: Uint8Array, salt: string): Promise<Uint8Array>;
  generateKey(size: number): Uint8Array;
}
