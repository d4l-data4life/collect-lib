/**
 * Cross-language check for the v4 hybrid encryption format: collect-lib (TypeScript) against
 * the public go-crypto (Go), in both directions, driven from this repository so the Go
 * library needs no reference to collect-lib. See xlang/README.md.
 *
 * Usage: yarn test:xlang   (requires a Go toolchain; run `yarn build` first)
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const xlangDir = join(root, 'xlang');

const {
  HybridEncrypter,
  WebConverter,
  v4AesSlot,
  v4EcSlot,
  v4RsaSlot,
  v4AesKey,
  v4EcKey,
  v4RsaKey,
  V4_DECRYPTER_MOBILE_APP,
  V4_DECRYPTER_DATA_RECEIVER,
} = require(join(root, 'dist/index.js'));

const converter = new WebConverter();
const encrypter = new HybridEncrypter(converter);
const runGo = (args, input) =>
  execFileSync('go', ['run', '.', ...args], {
    cwd: xlangDir,
    input,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'inherit'],
  });

let failures = 0;
const report = (ok, direction, name, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${direction}  ${name.padEnd(18)} ${detail}`);
};

// ── 1. go-crypto encrypts, collect-lib decrypts ────────────────────────────────
const fromGo = JSON.parse(runGo(['-mode=generate']));

// One key per recipient role, so every slot type is opened from this side too — including
// the RSA receiver slot, which the phone-facing decryptV4 deliberately cannot open.
const keychain = [
  v4EcKey(V4_DECRYPTER_MOBILE_APP, fromGo.phoneScalarB64),
  v4AesKey(V4_DECRYPTER_MOBILE_APP, fromGo.recoveryB64),
  v4RsaKey(V4_DECRYPTER_DATA_RECEIVER, fromGo.rsaPrivPEM),
];

for (const v of fromGo.vectors) {
  try {
    const got = encrypter.decryptV4WithKeys(v.ciphertext, keychain);
    report(got === v.plaintext, 'go->ts', v.name, `${v.plaintext.length} B via keychain`);
  } catch (error) {
    report(false, 'go->ts', v.name, `threw: ${error.message}`);
  }

  // The phone path (decryptV4) must open exactly the records addressed to the mobile app.
  const phoneCanOpen = v.recipients.includes('ec') || v.recipients.includes('aes');
  let opened;
  try {
    opened = encrypter.decryptV4(v.phonePrivB64 ?? '', v.ciphertext, v.recoveryB64);
  } catch {
    opened = undefined;
  }
  report(
    phoneCanOpen ? opened === v.plaintext : opened === undefined,
    'go->ts',
    v.name,
    phoneCanOpen ? 'phone path opened it' : 'phone path refused it, as it should'
  );
}

// ── 2. collect-lib encrypts, go-crypto decrypts ────────────────────────────────
// Same slot shapes, so every algorithm is exercised in this direction too.
const large = JSON.stringify({
  dailies: Array.from({ length: 20000 }, (_, i) => ({ t: i, hr: 60 + (i % 40) })),
});
const ecSlot = v4EcSlot(V4_DECRYPTER_MOBILE_APP, fromGo.phonePubB64);
const aesSlot = v4AesSlot(V4_DECRYPTER_MOBILE_APP, fromGo.recoveryB64);
const rsaSlot = v4RsaSlot(V4_DECRYPTER_DATA_RECEIVER, fromGo.rsaPubPEM);

const tsCases = [
  { name: 'ec-only', plaintext: '{"ts":"ec-only","steps":5}', slots: [ecSlot], recipients: ['ec'] },
  {
    name: 'aes-recovery-only',
    plaintext: '{"ts":"recovery"}',
    slots: [aesSlot],
    recipients: ['aes'],
  },
  { name: 'rsa-only', plaintext: '{"ts":"receiver"}', slots: [rsaSlot], recipients: ['rsa'] },
  {
    name: 'multi-slot',
    plaintext: '{"ts":"all-three"}',
    slots: [ecSlot, aesSlot, rsaSlot],
    recipients: ['ec', 'aes', 'rsa'],
  },
  { name: 'utf8', plaintext: '{"note":"Grüße 🌍 TS→Go"}', slots: [ecSlot], recipients: ['ec'] },
  { name: 'empty-payload', plaintext: '', slots: [ecSlot], recipients: ['ec'] },
  { name: 'large', plaintext: large, slots: [ecSlot], recipients: ['ec'] },
];

const toGo = {
  vectors: tsCases.map(({ name, plaintext, slots, recipients }) => ({
    name,
    plaintext,
    ciphertext: encrypter.encryptV4(plaintext, slots),
    recipients,
  })),
  phoneScalarB64: fromGo.phoneScalarB64,
  recoveryB64: fromGo.recoveryB64,
  rsaPrivPEM: fromGo.rsaPrivPEM,
  rsaPubPEM: fromGo.rsaPubPEM,
};
const verifyOutput = (() => {
  try {
    return runGo(['-mode=verify'], JSON.stringify(toGo));
  } catch (error) {
    failures++;
    return error.stdout ?? '';
  }
})();
process.stdout.write(verifyOutput);

// ── 3. Tampering with a go-crypto record must be rejected, in every region ──────
const target = fromGo.vectors.find((v) => v.name === 'ec-only');
const raw = new Uint8Array(converter.base64ToArrayBuffer(target.ciphertext));
for (const [region, index] of [
  ['header', 1],
  ['slot body', 20],
  ['payload tail', raw.length - 5],
]) {
  const mutated = Uint8Array.from(raw);
  mutated[index] ^= 0x01;
  let rejected = false;
  try {
    encrypter.decryptV4(target.phonePrivB64, converter.uint8ArrayToBase64(mutated));
  } catch {
    rejected = true;
  }
  report(rejected, 'tamper', region, rejected ? 'rejected' : 'ACCEPTED a tampered record');
}

console.log(`\ncross-language: ${failures === 0 ? 'all checks passed' : `${failures} failure(s)`}`);
process.exit(failures === 0 ? 0 : 1);
