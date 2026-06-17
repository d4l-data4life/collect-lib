import { secp256k1 } from '@noble/curves/secp256k1';
import * as secpUtils from '@noble/curves/abstract/utils';
import * as forge from 'node-forge';
import { buildSelfSignedAuthToken } from './sdk';
import { CryptoModule, KeyHandler, WebConverter } from '..';

// sign/verify don't touch CryptoModule, so a stub suffices.
class StubCrypto implements CryptoModule {
  generateKey = (size: number): Uint8Array => new Uint8Array(size);
  deriveEncryptionKey = async (seed: Uint8Array, _salt = 'phoenix'): Promise<Uint8Array> => seed;
}

describe('CollectorClient self-signed auth token', () => {
  const converter = new WebConverter();
  const keyHandler = new KeyHandler(converter, new StubCrypto());

  // A matching donor keypair (priv = base64 of the hex scalar; pub = SPKI), as produced by deriveProgramKeys.
  const priv = '1m2vGqozd9liGPxg4D8Cr9sjV4K2gpwayw90RfMhglc=';
  const pub =
    'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEars2EMxOJvgpavwGLc/6Xu4xgtOe5QjOcOHJWCLkEQylJDdOZume1tWmHfiNbZNGtqkLdZSjqc1J+EFpdOXSew==';

  it('builds a verifiable token signed over (message + secret) with the donor key', async () => {
    const token = 'collector-issued-jwt';
    const secret = 'shared-self-sign-secret';

    const authToken = await buildSelfSignedAuthToken(keyHandler, converter, pub, priv, token, secret);

    const decoded = JSON.parse(Buffer.from(authToken, 'base64').toString('utf8'));
    expect(JSON.parse(decoded.messageJSON)).toEqual({ token, donorID: pub });

    // Verify the signature exactly as keyHandler.sign produced it: secp256k1 over sha256(message + secret).
    const scalarHex = converter.base64ToHex(priv);
    const publicKeyRaw = secp256k1.getPublicKey(secpUtils.hexToBytes(scalarHex), false);
    const digestHex = forge.md.sha256
      .create()
      .update(decoded.messageJSON + secret)
      .digest()
      .toHex();
    const valid = secp256k1.verify(
      converter.base64ToUint8Array(decoded.signature),
      digestHex,
      publicKeyRaw
    );
    expect(valid).toBe(true);
  });

  it('is deterministic and secret-sensitive', async () => {
    const a = await buildSelfSignedAuthToken(keyHandler, converter, pub, priv, 't', 'secret-a');
    const a2 = await buildSelfSignedAuthToken(keyHandler, converter, pub, priv, 't', 'secret-a');
    const b = await buildSelfSignedAuthToken(keyHandler, converter, pub, priv, 't', 'secret-b');
    expect(a).toBe(a2); // RFC6979 deterministic signing
    expect(a).not.toBe(b);
  });
});
