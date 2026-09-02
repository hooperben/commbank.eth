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
stored (see §8 — origin storage alone is NOT durable):
  1. localStorage / IndexedDB                    (cache only; evicted after 7 days on iOS Safari)
  2. passkey largeBlob (if supported=true)       (survives site-data clears; syncs on Apple)
  3. off-origin encrypted backup keyed by credentialId — REQUIRED for a returning user
     (server, or on-chain/IPFS; server only ever sees PRF-wrapped ciphertext)
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

---

## 8. Durability: the "comes back a month later" problem

**Scenario:** user signs up on mobile, leaves, returns after a month.
Will they be able to sign in?

**With PRF + local ciphertext only: no.** The passkey survives (it lives in
iCloud Keychain / Google Password Manager and even follows them to a new
phone), but the ciphertext it unlocks is gone:

| Platform | What happens to localStorage / IndexedDB |
|---|---|
| iOS / iPadOS Safari (and every iOS browser, all use WebKit) | ITP deletes **all script-writable storage after 7 days without user interaction**. Home-screen-installed web apps are exempt; ordinary tabs are not. |
| Android Chrome | No time-based eviction, but storage is "best-effort" and purged under disk pressure unless `navigator.storage.persist()` is granted (Chrome grants it for installed PWAs / highly engaged sites). |
| Any | "Clear browsing data", browser reinstall, new device. |

`navigator.storage.persist()` and PWA install reduce the risk (worth doing)
but don't eliminate it; Safari largely ignores `persist()`.

So the design principle is: **origin storage is a cache, never the only
copy.** The durable copy must live somewhere that survives with the passkey.

### 8.1 Where the durable copy can live

| Location | Survives eviction | Coverage | Trust |
|---|---|---|---|
| **A. Inside the passkey (`largeBlob`)** | ✅ (syncs with the credential) | Apple + CTAP2.1 keys only (§2.3) | None beyond the credential provider |
| **B. Server-side encrypted backup** — PRF-wrapped ciphertext keyed by credential ID | ✅ | Everywhere PRF works: Android, Windows, Apple, 1Password/Bitwarden | Server sees ciphertext only; KEK exists only inside a user-verified assertion on the user's hardware. Availability depends on us. |
| **C. On-chain / IPFS encrypted backup** — `keccak(credentialId) → ciphertext` | ✅ | Same as B | Trustless, censorship-resistant, fits "the bank you don't have to trust". Ciphertext is permanently public and can never be un-published; ~100 bytes on Base/Arbitrum costs cents. |

B and C are the same protocol with a different bulletin board; A is a bonus
replica on Apple. **Decision: B (server) is rejected — the goal is a
decentralised front end with no backend/database.** Adopted: A where
supported + C (on-chain) everywhere, origin storage as a cache. See §9.

Why the server/chain copy is safe: the ciphertext is
`AES-256-GCM(HKDF(PRF(passkey, salt)), entropy)`. Nobody — including us —
can produce the KEK without the passkey *and* a user-verification gesture.
An attacker who scrapes every backup we hold gets nothing usable. This is
the same model Bitwarden/Dashlane use for passkey-unlocked vaults.

Lookup key: the assertion itself returns `credential.rawId`, so no local
state is needed to find the backup. Credential IDs are 16+ random bytes
(unguessable), but to avoid a public "does this credential exist" oracle,
store under `SHA-256(credentialId)` and, for the server variant, gate the
fetch with the assertion signature (verify the WebAuthn assertion against
the public key we recorded at registration — `PasskeyCredentialInfo`
already captures it).

### 8.2 Returning-user flow (no words required)

1. Page loads with empty origin storage → "Sign in with passkey".
2. One `get()` with **no** `allowCredentials` (discoverable credential — OS
   shows the passkey picker; already how `authenticatePasskey()` works),
   plus `prf.eval` and `largeBlob.read`.
3. If `largeBlob.blob` present → decrypt with the PRF-derived KEK. Done.
4. Else → fetch ciphertext by `SHA-256(rawId)` from server/chain → decrypt.
5. Re-populate local cache; opportunistically request
   `navigator.storage.persist()`.
6. Only if no backup exists anywhere (registration's backup upload failed,
   or the passkey itself is gone — new phone with no keychain sync) →
   mnemonic import. Nothing can fix "passkey gone + no words".

### 8.3 Registration-time guarantees

The month-later flow only works if the backup actually landed at sign-up:

- Treat the backup write as part of registration: don't show "you're all
  set" until (largeBlob `written === true`) **or** (server/chain write
  acknowledged). Retry in the background on every unlock until at least one
  durable copy is confirmed; surface a "Backup: ✓ passkey / ✓ cloud" status
  in the account UI.
- Re-run the backup whenever the wallet changes (import/restore) or the
  passkey is upgraded (§4.2) — the KEK changes with the credential.
- Keep "export mnemonic" prominent regardless; it is the only recovery from
  passkey loss.

### 8.4 What this means for the original question

"Store the blob in the passkey as the secret source" is the *right instinct*
for durability — it is the only option where the secret has exactly one
home and it moves with the passkey. Its problem is coverage, not concept.
The PRF-wrapped ciphertext replicated to (passkey blob | server | chain)
delivers the same "nothing to lose when the site is evicted" property on
every platform.

---

## 9. Decided direction: decentralised durability (no backend)

Constraint: **no centralised server or database.** The front end must be
self-sufficient. Durability therefore comes from two decentralised homes for
the v3 ciphertext, plus a cache:

| Tier | Where | Who gets it | Survives eviction |
|---|---|---|---|
| 1 | `largeBlob` inside the commbank.eth passkey | any stack reporting `largeBlob.supported === true` (Apple platform passkeys, CTAP2.1 keys) | ✅ |
| 2 | On-chain event: `SHA-256(credentialId) → ciphertext`, emitted with the **first deposit** | everyone, once they have deposited | ✅ |
| 3 | localStorage / IndexedDB cache | everyone | ❌ (cache only) |

The user's **durability class** = which tiers are confirmed written. The
"export your phrase" prompt is loud only while a user has tier 3 alone.

### 9.1 Branch on capability, not on OS

Never sniff iOS/Android. The facts we need are returned by WebAuthn itself:

- registration: `create().getClientExtensionResults().largeBlob.supported`
- sign-in: presence of `largeBlob.blob` in the assertion

This covers the awkward cases for free: Mac Safari (blob ✅), Mac Chrome
with an iCloud passkey (probably ❌ — verify), iPhone whose passkeys are in
Google Password Manager (❌), YubiKey on any desktop browser (✅).

### 9.2 Sign-in must come before sign-up (overwrite hazard)

With evicted local state the app cannot tell a returning user from a new
one, and `excludeCredentials` is empty. Today `user.id` is the constant
`"commbank.eth"`. iCloud Keychain and Google Password Manager treat a
`create()` with the same `rp.id` + `user.id` as **replacing** the existing
passkey — on iOS that would destroy the only copy of the seed.

Fixes (both):

1. One "Continue with passkey" button that always runs `get()` first
   (discoverable credential, no `allowCredentials`, with `prf.eval` +
   `largeBlob.read`). "Create a new account" is offered only after the
   picker is cancelled/empty, behind an explicit warning.
2. Random 16-byte `user.id` per account, with a distinguishing
   `user.name`/`displayName` (e.g. `commbank.eth · 0x1234…`, or the creation
   date) so a second registration *adds* a passkey rather than replacing
   one.

### 9.3 Same ciphertext everywhere (blob holds v3 ciphertext, not raw entropy)

`prf.eval` and `largeBlob.read` can be requested in the **same** assertion,
so unlocking from the blob is still one gesture. Storing the v3 ciphertext
in the blob gives one storage-agnostic format across all tiers, and a blob
leaked provider-side is useless without the PRF. (XSS exposure is unchanged
either way — both values arrive in the same assertion result.)

Spike item: confirm Safari honours both extensions in one `get()`. If not,
raw entropy in the blob is the acceptable iOS-only fallback.

### 9.4 On-chain backup piggybacked on the first deposit

The v3 ciphertext (~100 bytes) can only be opened by a user-verified
assertion on the user's own hardware, so it is safe to publish. Emit it as
log data from the first deposit:

```solidity
event WalletBackup(bytes32 indexed credentialIdHash, bytes ciphertext);
// called inside deposit(...) when `backup.length > 0`
```

- Cost: log data is 8 gas/byte → < 2k gas on top of a deposit on an L2.
- No funds needed before there is anything to lose: a user with zero
  balance loses nothing if their cache is evicted — they can just create a
  fresh account. Durability starts exactly when value does.
- Recovery on a wiped device: `get()` → `rawId` + PRF output →
  `eth_getLogs` filtered by `SHA-256(rawId)` topic (any public RPC; no
  commbank.eth infrastructure) → decrypt → re-cache.
- **Privacy:** emit **once**, on the first deposit only, so the topic never
  links multiple deposits. Re-emit only when the KEK changes (passkey
  upgrade, §4.2), which is rare and can be sent as a standalone tx.
- Multi-chain: emit on whichever chain the first deposit happens on;
  recovery queries all supported chains (Ethereum, Arbitrum, Base).

### 9.5 Resulting sign-in / sign-up flow

```
[Continue with passkey]
  └─ get({ prf.eval, largeBlob.read })           ← 1 gesture
       ├─ blob present      → decrypt → cache → signed in      (tier 1)
       ├─ local cache present → decrypt → signed in           (tier 3)
       ├─ else eth_getLogs(SHA-256(rawId)) on each chain
       │      └─ found      → decrypt → cache → signed in     (tier 2)
       └─ nothing anywhere  → "Import your phrase" / "Create new account"
[Create new account]  (only reachable from the branch above)
  └─ create({ prf:{}, largeBlob:{support:"preferred"}, user.id = random })
  └─ get({ prf.eval })  → wrap entropy → cache (tier 3)
  └─ if supported: get({ largeBlob.write }) until written === true (tier 1)
  └─ show durability status; loud export prompt iff tier 3 only
[First deposit]
  └─ include ciphertext → WalletBackup event (tier 2) → downgrade prompt
```

### 9.6 Android-specific mitigations (cheap, do all of them)

- Call `navigator.storage.persist()` after registration; Chrome grants it
  automatically for installed PWAs / engaged sites, which removes the
  disk-pressure eviction case.
- Encourage "Add to Home Screen" (PWA install) — also exempts iOS Safari
  from the 7-day ITP purge for users whose passkeys aren't blob-capable.
- Keep the export prompt loud until tier 2 is confirmed.
