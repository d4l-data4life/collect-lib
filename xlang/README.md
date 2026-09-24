# Cross-language v4 hybrid encryption check

The v4 slot format is implemented twice — here in TypeScript (`src/donation/hybridEncryption.ts`)
and in Go ([`d4l-data4life/go-crypto`](https://github.com/d4l-data4life/go-crypto)). Both
directions are verified from this repository, so the Go library carries no reference to
collect-lib:

```sh
yarn test:xlang          # needs a Go toolchain; builds dist first
```

What it does:

1. **Go → TS** — `main.go -mode=generate` encrypts a set of records with go-crypto (EC,
   AES-recovery, RSA, multi-recipient, UTF-8, large payloads) and prints them as JSON.
   The script decrypts each with the built `dist` bundle.
2. **TS → Go** — the script encrypts the same shapes with collect-lib, then
   `main.go -mode=verify` decrypts them with go-crypto, checking that each recipient opens
   the record with its own key and that other recipients are refused.
3. **Tamper** — a bit is flipped in each region of a go-crypto record; TS must reject all.

Nonces are random, so nothing here is byte-pinned. The byte-exact vectors live in
`src/donation/hybridEncryption.spec.ts` (pinned go-crypto output) and run in normal CI
without a Go toolchain; this harness proves the two implementations still agree end to end.
