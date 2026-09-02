# Research: storing the wallet secret inside the passkey (largeBlob)

Status: research / decision doc — no code changes yet.
Scope: replacing the current "encrypted mnemonic in localStorage" model with
secret material stored in (or derived from) the passkey itself.

---

## 1. Where we are today (audit of the current implementation)

`client/src/lib/commbankdoteth-account.ts` (and the older
`client/src/lib/passkey.ts`) do the following:

1. Create a discoverable platform passkey (`residentKey: "required"`,
   `userVerification: "required"`).
2. On every unlock, call `navigator.credentials.get()` and take
   `response.authenticatorData` from the assertion.
3. Run that through PBKDF2 (fixed salt `commbank.eth-fixed-salt`, 100k
   iterations) to get an AES-GCM key.
4. Encrypt/decrypt the BIP-39 mnemonic with that key; ciphertext lives in
   `localStorage` under `encryptedMnemonic`.

### 1.1 Important finding: we are not actually using PRF

The code never requests the `prf` extension. The key is derived from
**`authenticatorData`, which is not a secret**. For a platform authenticator
an assertion's `authenticatorData` is:

```
SHA-256(rpId)  (32 bytes, public — it's just the hash of "commbank.eth.limo")
|| flags       (1 byte, predictable: UP|UV|BE|BS bits)
|| signCount   (4 bytes, almost always 0 on passkey platform authenticators)
[no attested credential data, no extensions on a plain assertion]
```

Every field is public or predictable, and the PBKDF2 salt is a hardcoded
string. Consequences:

- **The localStorage ciphertext is decryptable without the passkey.** Anyone
  who can read localStorage (XSS, malware, someone with the unlocked device,
  a browser-profile backup) can reconstruct the 37-byte `authenticatorData`
  preimage from public information and decrypt the mnemonic offline.
- The Face ID / Touch ID prompt is **UI gating, not cryptographic gating** —
  the assertion result isn't actually needed to produce the key.
- The fallback in `commbankdoteth-account.ts` depends on `flags`/`signCount`
  being identical between devices/assertions; any authenticator that
  increments `signCount` or sets different flags silently breaks decryption.

This is the strongest argument for the migration: whatever we pick next
(largeBlob, PRF, or both), the current derivation should be retired.

---

## 2. Option A — `largeBlob`: store the secret inside the passkey

The WebAuthn **Large Blob storage extension** (`largeBlob`, WebAuthn L2,
§10.1.5 of the spec) lets an RP store opaque bytes *with* a discoverable
credential, managed by the authenticator/credential-provider rather than by
our origin's storage.

### 2.1 API mechanics

**Creation** — declare intent (requires a discoverable credential, which we
already mandate):

```ts
const cred = await navigator.credentials.create({
  publicKey: {
    ...,
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    extensions: { largeBlob: { support: "preferred" } }, // or "required"
  },
});
// cred.getClientExtensionResults().largeBlob.supported → boolean
```

- `support: "required"` makes creation fail on non-supporting stacks — with
  today's support matrix we would lock out most Android/Windows users, so
  `"preferred"` + feature detection is the practical choice.

**Write** — done during an *assertion*, not during creation, and
`allowCredentials` must contain **exactly one** credential (so we must keep
storing the credential ID, as we do now):

```ts
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge,
    allowCredentials: [{ type: "public-key", id: credentialIdBytes }],
    extensions: { largeBlob: { write: secretBytes } }, // ArrayBuffer/TypedArray
  },
});
// assertion.getClientExtensionResults().largeBlob.written → boolean (must check!)
```

**Read** — also during an assertion; `read` and `write` are mutually
exclusive in one call:

```ts
const assertion = await navigator.credentials.get({
  publicKey: { challenge, extensions: { largeBlob: { read: true } } },
});
// assertion.getClientExtensionResults().largeBlob.blob → ArrayBuffer | undefined
```

UX consequence: initial setup costs **two user-verification gestures**
(create, then write); unlock stays one gesture (read happens inside the
normal assertion).

### 2.2 Size limits

- On CTAP 2.1 security keys the entire serialized large-blob *array* (shared
  across **all** credentials on the key) is only guaranteed to be ≥ 1024
  bytes; after CBOR overhead that's ~960 bytes of DEFLATE-compressed data
  (see Yubico's largeBlobs docs). Plan for "a few hundred bytes per
  credential", not kilobytes.
- Platform providers (iCloud Keychain) are more generous, but treat ~1 KB as
  the portable budget.
- For us this is fine: store the **16/32 bytes of BIP-39 entropy** (or a
  ciphertext of it, §4), not the English mnemonic string.

### 2.3 Support matrix (as of mid-2026)

| Stack | largeBlob | Notes |
|---|---|---|
| Safari 17+ / iOS 17+ / iPadOS 17+ (iCloud Keychain) | ✅ | Announced in Safari 17 / WWDC23; platform-authenticator passkeys. Blob is stored with the credential, so it participates in iCloud Keychain sync (verify empirically, §6). |
| Chrome desktop (Mac, Linux, ChromeOS, Win 11) + **CTAP 2.1 security keys** | ✅ | Chrome ships largeBlob for authenticators it talks to via low-level APIs. |
| Chrome on Windows 10 (19H1+) | ❌ | Windows brokers WebAuthn through its own API; older versions lack largeBlob. Windows 11's API added it for security keys. |
| Google Password Manager passkeys (Android / Chrome sync) | ❌ | GPM implements PRF, not largeBlob. |
| Windows Hello platform passkeys | ❌ | No largeBlob for platform credentials. |
| Firefox | ❌ | No signal. |
| 1Password / Bitwarden / Dashlane | ❌/partial | These have prioritized PRF; largeBlob support is not generally available. |
| Cross-device (hybrid/CDA, QR-code flow) | ⚠️ unclear | Extension pass-through over hybrid is inconsistent; assume unavailable. |

**Bottom line:** largeBlob today ≈ *Apple ecosystem + hardware security
keys*. An Android or Windows Hello user cannot use a largeBlob-only wallet.

### 2.4 Security properties of largeBlob

- At rest (CTAP), each blob is encrypted with a per-credential 256-bit
  AES-GCM `largeBlobKey`; blobs are only readable through an assertion for
  that credential. Platform providers store it inside the (end-to-end
  encrypted) keychain sync fabric.
- **The blob is returned to JavaScript in plaintext** after a successful
  assertion. One XSS on our origin + one user gesture = seed exfiltration.
  This is still far better than today (where no gesture is needed at all),
  but it argues for storing a *ciphertext* in the blob and keeping the KEK
  elsewhere (PRF — see §4).
- The W3C security/privacy self-review notes blobs are readable by anyone
  who can complete an assertion — i.e. the extension provides *storage*, not
  additional *authorization* semantics beyond UV.

---

## 3. Option B — `prf`: derive the secret from the passkey

The **PRF extension** (backed by CTAP `hmac-secret`) returns
`HMAC-SHA-256(credential-bound secret, salt)` — a deterministic 32-byte
value only obtainable via a successful, user-verified assertion of that
credential.

```ts
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge,
    extensions: { prf: { eval: { first: new TextEncoder().encode("commbank.eth/v1/kek") } } },
  },
});
const prfOut = assertion.getClientExtensionResults().prf?.results?.first; // 32 bytes
```

Two ways to use it:

- **B1 — PRF output *is* the wallet seed.** `entropy = PRF(salt)` →
  BIP-39/BIP-32 wallet. Zero stored state ("stateless wallet"). Downside:
  you cannot *import* an existing mnemonic, and the wallet dies with the
  passkey — no independent mnemonic backup is possible unless you export the
  derived seed (which reintroduces storage). Doesn't fit our restore-from-
  mnemonic flows.
- **B2 — PRF output is a KEK.** Encrypt the (imported or generated) mnemonic
  with `HKDF(prfOutput)` → AES-GCM, store the ciphertext wherever convenient
  (localStorage, IndexedDB, largeBlob, and/or a server backup keyed by
  credential ID — which is exactly the disaster-recovery hook
  `PasskeyCredentialInfo` was added for). This keeps import/export/restore
  intact and is a drop-in replacement for the broken
  authenticatorData-derived key.

### 3.1 PRF support matrix (as of early/mid-2026 — notably broader than largeBlob)

- **Android / Google Password Manager**: PRF by default; works in Chrome,
  Edge, Samsung Internet (not Firefox-on-Android).
- **iOS 18.4+ / macOS 15+ (iCloud Keychain)**: Safari 18+, Chrome 132+,
  Firefox 139+. (iOS 18.0–18.3 had cross-device PRF data-loss bugs.)
- **Windows 11 25H2** (Feb 2026 update, `WEBAUTHN_API_VERSION_8`): Windows
  Hello now returns PRF; Firefox 148+ and Chrome 147+ consume it.
- **Password managers**: 1Password, Bitwarden, Dashlane all ship PRF (Dashlane
  uses it to replace master passwords).
- **Security keys**: any hmac-secret-capable key (YubiKey 5 etc.). Caveat: on
  some keys PRF must be requested at *creation* time — always pass
  `prf: {}` (or an eval) in `create()` and check `enabled`.
- Known WebKit bugs with *USB/NFC security keys* on macOS/iPadOS (PRF result
  returned undecrypted / null for YubiKey Bio) — platform passkeys are fine.

Chrome engineers have explicitly said they prioritize **PRF over largeBlob**
for secret-material use cases, which is a good signal for where ecosystem
investment is going.

### 3.2 PRF caveats

- Output is **per-credential**: a user with two passkeys has two KEKs. We
  must either wrap the mnemonic once per credential or keep one credential
  (current model is single-credential anyway).
- Losing the passkey loses the KEK → mnemonic export ("write down your 24
  words") remains the ultimate recovery path, same as today.
- PRF requires an assertion, so "unlock" stays a one-gesture flow — no UX
  regression.

---

## 4. Recommendation

**Adopt PRF as the cryptographic root, and use largeBlob as an additional
replica of the ciphertext where available — rather than making largeBlob the
sole source of truth.**

Rationale:

1. The urgent problem is the key-derivation flaw (§1.1); PRF fixes it on the
   widest set of platforms (Android + Windows + Apple + password managers),
   while largeBlob alone would strand Android/Windows users.
2. largeBlob's real value for us is *durability*: the blob lives inside the
   credential and syncs with it (iCloud Keychain), so clearing site data no
   longer bricks the account on Apple devices. That's a storage upgrade, not
   a confidentiality upgrade.
3. Storing **PRF-encrypted ciphertext** in the blob (rather than raw
   entropy) means neither a stolen blob nor a stolen KEK alone reveals the
   seed, and an XSS needs to drive two extension flows to win.

### 4.1 Proposed target design

```
mnemonic (imported or generated)                 ← unchanged UX
  └─ entropy = bip39.mnemonicToEntropy(...)      (16–32 bytes)
KEK = HKDF-SHA256(PRF(salt="commbank.eth/v1/kek"), info="mnemonic-wrap")
ciphertext = AES-256-GCM(KEK, entropy || version)
stored:
  1. localStorage / IndexedDB                    (fast path, all platforms)
  2. passkey largeBlob (if supported=true)       (survives site-data clears; syncs on Apple)
  3. (future) server backup keyed by credentialId (disaster recovery TODO in AUTH.md)
```

Unlock: one `get()` with `prf.eval` + `largeBlob.read` — note **PRF and
largeBlob-read can be combined in one assertion** (write cannot be combined
with read); if the local ciphertext exists we don't even need the blob.

Registration flow (new account or import):
1. `create()` with `largeBlob: {support: "preferred"}`, `prf: {}` → record
   `supported`/`enabled` flags + credential ID (gesture 1).
2. `get()` with `prf.eval` → derive KEK, encrypt entropy, save ciphertext
   locally (gesture 2 — same as today's post-create authenticate).
3. If largeBlob supported: `get()` with `largeBlob: {write: ciphertext}` and
   `allowCredentials: [credId]`, verify `written === true` (gesture 3, can
   be deferred/retried in background on next unlock).

Fallback ladder when PRF is unavailable (`enabled: false`): keep the
mnemonic-export requirement front and center; optionally fall back to a
password-derived KEK — but **do not** silently fall back to the current
authenticatorData scheme.

### 4.2 Migration plan for existing users (v2 → v3)

Three facts drive the design:

- **F1.** The legacy KEK is computable offline from public information
  (§1.1). Normally that's the vulnerability; during migration it's a gift —
  we can decrypt the old ciphertext *without any legacy-shaped assertion*,
  so migration costs the user nothing extra.
- **F2.** PRF can be evaluated on *existing* credentials for the synced
  providers (iCloud Keychain, Google Password Manager retrofit
  hmac-secret); many older hardware-key credentials cannot (hmac-secret had
  to be requested at creation).
- **F3.** `largeBlob` support is declared at **credential creation**. An
  existing credential created without `largeBlob: {support}` cannot accept a
  blob write. So the PRF re-encryption is transparent, but "blob inside the
  passkey" requires a *passkey re-registration* ("upgrade your passkey"
  flow) for existing users.

One subtlety rules out the obvious shortcut: you might hope to do legacy
decrypt + PRF eval from a single assertion (its `authenticatorData` feeds
the old KDF, its `prf.results` feeds the new one). But requesting an
authenticator extension can set the ED flag / append extension data in
`authenticatorData`, which changes the bytes the legacy KDF consumes.
Don't depend on assertion-shape stability at all — use F1 instead.

**Payloads.** Keep the legacy item under its current key
(`encryptedMnemonic`, `version <= 2`). Write the new item under a new key,
e.g. `cb_vault_v3`:

```jsonc
{
  "version": 3,
  "kdf": "prf-hkdf-sha256",
  "hkdfSalt": "<random 32B, base64>",   // per-install, not secret
  "prfInput": "commbank.eth/v1/kek",     // fixed context string
  "iv": "<12B>",
  "ct": "<AES-256-GCM(entropy)>",        // BIP-39 entropy, not the string
  "credentialId": "<base64url>",
  "createdAt": 1234567890
}
```

**Migration on next unlock** (runs when `cb_vault_v3` is absent and a
legacy payload exists):

1. *One assertion, one gesture:* `navigator.credentials.get()` with
   `extensions: { prf: { eval: { first: utf8("commbank.eth/v1/kek") } } }`.
   Keep `clientExtensionResults().prf?.results?.first`.
2. *Legacy decrypt, offline:* reconstruct candidate `authenticatorData`
   preimages — `SHA-256(rpId) || flags || signCount` for `flags ∈ {0x05,
   0x1D, 0x45, 0x5D, …}` (UP|UV with/without BE/BS/ED) and `signCount ∈
   {0…k}` — run each through the legacy PBKDF2 and attempt AES-GCM
   decryption; the GCM tag identifies the right candidate. Milliseconds of
   work, and it also *rescues* users the old scheme stranded via flag/count
   drift across devices. Fallback if no candidate decrypts: one extra plain
   assertion (no extensions) and use its raw `authenticatorData` exactly as
   today.
3. *Re-encrypt:* `entropy = bip39.mnemonicToEntropy(mnemonic)`;
   `KEK = HKDF-SHA256(prfOutput, salt = hkdfSalt, info =
   "commbank.eth/mnemonic-wrap/v3")`; AES-256-GCM encrypt; write
   `cb_vault_v3`.
4. *Verify then destroy:* round-trip decrypt `cb_vault_v3` with a freshly
   derived KEK and compare entropy; only then delete `encryptedMnemonic`
   (and the old `passkeyCredentialIds`-era keys). Never delete before the
   verify passes — a failed write must leave the legacy path intact.
5. *PRF unavailable* (`results` absent — typical for old hardware-key
   credentials, F2): do **not** silently stay on v2 forever. Keep unlock
   working, but show a persistent "secure your account" prompt: confirm the
   user has their mnemonic exported, then run the passkey-upgrade flow
   below.

**Passkey-upgrade flow** (needed for blob storage, F3 — and for
PRF-incapable credentials):

1. `create()` a new credential with `prf: {}` and
   `largeBlob: {support: "preferred"}` (gesture 1); record new
   `credentialId`, `largeBlob.supported`, `prf.enabled`.
2. `get()` with `prf.eval` scoped to the new credential → derive new KEK →
   re-wrap the entropy → replace `cb_vault_v3` (gesture 2).
3. If `supported`: `get()` with `largeBlob: {write: ct}` and
   `allowCredentials: [newCredId]`, check `written === true` (gesture 3 —
   deferrable: retry in the background on subsequent unlocks until written).
4. Tell the user the old commbank.eth passkey is defunct and can be removed
   in their OS/password-manager settings (sites can't delete credentials;
   `excludeCredentials` with the old ID prevents accidental re-use).

**Multi-device notes.** A synced credential yields the *same* PRF output on
every device, but `cb_vault_v3` is per-browser-profile — each device simply
runs the same lazy migration on its next unlock (step 2 works offline
anywhere). After a passkey upgrade, other devices still holding only the old
credential ID must detect the mismatch (assertion returns a different
`credentialId` than stored) and refresh local state from the blob or from a
fresh PRF unwrap.

**Rollout order.**

1. Ship v3 write-path for *new* registrations (+ largeBlob mirror).
2. Ship lazy v2→v3 migration on unlock.
3. Ship the passkey-upgrade prompt for PRF-incapable credentials and for
   users who want blob-in-passkey durability.
4. When telemetry shows v2 unlocks ≈ 0, delete the legacy KDF from the
   unlock path (the offline reconstruction can live on in a standalone
   recovery page — it works without a passkey by construction).

---

## 5. If we *did* want "blob in passkey" as the sole secret source

For completeness — a largeBlob-only design (raw entropy in the blob, no
local ciphertext):

- ✅ Simplest mental model; nothing sensitive in web storage at all; account
  follows the passkey through iCloud sync and Apple device migration.
- ❌ Excludes GPM/Android, Windows Hello, Firefox users entirely (§2.3).
- ❌ Blob comes back plaintext on any UV'd assertion → single XSS + single
  gesture steals the seed (worse than the PRF-wrapped design).
- ❌ ~1 KB shared budget on security keys; blob write can silently fail
  (`written: false`) and needs its own verification/retry logic.
- ❌ Hybrid/cross-device assertions likely won't carry the blob, so "sign in
  on a friend's laptop via QR" wouldn't retrieve the wallet.

Verdict: acceptable as an *Apple-only* premium path, not as the platform
story. The hybrid design in §4.1 gets the same durability benefit without
the exclusions.

## 6. Open questions to verify empirically (small spike, ~1 day)

1. Confirm largeBlob write/read round-trips on: Safari/iOS 17+, Safari/macOS,
   Chrome+iCloud-Keychain-passkey on macOS, Chrome + YubiKey 5 (CTAP 2.1).
2. Confirm the blob actually syncs across two Apple devices via iCloud
   Keychain (docs imply it; nobody states it crisply).
3. Confirm `prf` + `largeBlob.read` in a single `get()` works on Safari
   (spec allows it; implementations vary).
4. Measure real blob-size ceilings per provider with our ciphertext
   (~16–64 bytes — comfortably small).
5. Confirm PRF retrofit on an existing iCloud/GPM credential created without
   the extension (reported to work; verify before designing migration).

## 7. Sources

- W3C WebAuthn L3 spec, §10.1.5 Large blob storage extension — https://w3c.github.io/webauthn/#sctn-large-blob-extension
- W3C wiki: largeBlob explainer — https://github.com/w3c/webauthn/wiki/Explainer:-WebAuthn-Large-Blob-Extension
- W3C wiki: largeBlob security & privacy self-review — https://github.com/w3c/webauthn/wiki/Security-&-privacy-self-review:-WebAuthn-Large-Blob-Extension
- MDN WebAuthn extensions (largeBlob / prf API shapes) — https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/WebAuthn_extensions
- Chrome Platform Status: largeBlob — https://chromestatus.com/feature/5657899357437952
- Chromium Intent to Ship: largeBlob (platform caveats incl. Windows) — https://groups.google.com/a/chromium.org/g/blink-dev/c/guUJ9FuOIfc
- Apple Developer Forums: largeBlob in iOS 17 / Safari 17 — https://developer.apple.com/forums/thread/730133
- Yubico: FIDO2 large blobs (size/compression/largeBlobKey encryption) — https://docs.yubico.com/yesdk/users-manual/application-fido2/large-blobs.html
- Yubico: WebAuthn L2 features — https://developers.yubico.com/WebAuthn/Concepts/WebAuthn_Level_2_Features_and_Enhancements.html
- Corbado: Passkeys & WebAuthn PRF for E2EE (2026 support matrix) — https://www.corbado.com/blog/passkeys-prf-webauthn
- Yubico: PRF extension concepts — https://developers.yubico.com/WebAuthn/Concepts/PRF_Extension/
- Oblique: Passkey PRFs for end-to-end encryption (+ demo repo) — https://oblique.security/blog/passkey-prf/ / https://github.com/oblique-security/webauthn-prf-demo
- Praveen Perera: Universal Bitcoin wallet backup with passkeys + PRF — https://praveenperera.com/blog/passkey-prf-bitcoin-wallet-backup/
- Spark research: Passkeys for Bitcoin wallets — https://www.spark.money/research/bitcoin-passkey-wallet-authentication
- FIDO CTAP 2.1 spec (largeBlobs, hmac-secret) — https://fidoalliance.org/specs/fido-v2.1-rd-20210309/fido-client-to-authenticator-protocol-v2.1-rd-20210309.html
