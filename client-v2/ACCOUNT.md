# commbank.eth Account System (v2)

## Overview

The commbank.eth v2 account system uses **WebAuthn passkeys** to provide a secure, domain-locked authentication mechanism for managing Ethereum wallets. This implementation eliminates the need for traditional passwords while providing strong cryptographic security.

## Architecture

### Core Components

1. **CommbankDotETHAccount Class** (`src/lib/commbankdoteth-account.ts`)
   - Main account management class
   - Handles passkey registration, authentication, and wallet recovery
   - Uses singleton pattern for convenience

2. **WebAuthn Passkey**
   - Username: `commbank.eth` (hardcoded, cannot be changed)
   - Domain-locked to: `commbank.eth.limo` via `rp.id`
   - Authenticator type: Platform (Touch ID, Face ID, Windows Hello, etc.)
   - Resident key: Required (discoverable credential)

3. **Encrypted Storage**
   - Location: `localStorage`
   - Key: `cb_encrypted_account`
   - Contains: Encrypted BIP-39 mnemonic phrase

## Security Model

### Domain Locking (✅ Implemented)

WebAuthn passkeys are **natively domain-locked** through the `rp.id` (Relying Party ID) parameter. This means:

- The passkey registered at `commbank.eth.limo` can **only** be used on that domain
- Phishing sites cannot use your passkey
- Even if someone copies your localStorage data, they cannot decrypt it without your passkey
- The passkey is tied to your device's secure enclave (TPM, Secure Enclave, etc.)

**Configuration:**

```typescript
rp: {
  name: "commbank.eth",
  id: "commbank.eth.limo",  // ← This locks the passkey to this domain
}
```

### Encryption & Storage

#### What Gets Stored Where

| Data     | Location                      | Format                  | Security                                |
| -------- | ----------------------------- | ----------------------- | --------------------------------------- |
| Passkey  | Device's secure authenticator | Public/Private key pair | Hardware-secured, never exposed         |
| Mnemonic | localStorage (encrypted)      | AES-GCM encrypted bytes | Can only be decrypted with passkey auth |
| Username | localStorage (plaintext)      | String: "commbank.eth"  | Not sensitive, used for quick checks    |

#### Encryption Flow

1. **Registration/Storage:**

   ```
   User registers passkey
   ↓
   Generate random BIP-39 mnemonic (24 words)
   ↓
   Authenticate with passkey to get authenticator data
   ↓
   Derive AES-256-GCM key from authenticator data (PBKDF2, 100k iterations)
   ↓
   Encrypt mnemonic with derived key
   ↓
   Store encrypted mnemonic in localStorage
   ```

2. **Retrieval/Decryption:**
   ```
   User wants to access account
   ↓
   Authenticate with passkey (biometric prompt)
   ↓
   Get authenticator data from successful auth
   ↓
   Derive same AES-256-GCM key (deterministic)
   ↓
   Decrypt mnemonic from localStorage
   ↓
   Create ethers.Wallet from mnemonic
   ```

### Why We Can't Store Data "Inside" the Passkey

**Important Design Limitation:**

WebAuthn passkeys do **not** support storing arbitrary user data. The passkey only stores:

- Public key
- Credential ID
- Counter
- User handle (fixed identifier)

**Our Solution:**

Instead of storing the mnemonic "in" the passkey, we:

1. Store it **encrypted** in localStorage
2. Use the passkey's **authenticator data** as the source for deriving the encryption key
3. This creates a "virtual binding" - the encrypted data is useless without passkey authentication

**Benefits of this approach:**

- Mnemonic can only be decrypted with successful passkey authentication
- No network requests needed (fully client-side)
- Passkey provides strong authentication + key derivation
- Works offline once registered

## Account Data Structure

### Encrypted Account Object (localStorage)

```typescript
interface EncryptedAccount {
  iv: number[]; // AES-GCM initialization vector (12 bytes)
  data: number[]; // Encrypted mnemonic phrase (bytes)
  version: number; // Schema version for future migrations
}
```

**Storage Key:** `cb_encrypted_account`

**Example:**

```json
{
  "iv": [142, 251, 98, 33, 175, 228, 91, 12, 44, 198, 77, 209],
  "data": [45, 123, 88, 234, ...],
  "version": 2
}
```

### Decrypted Wallet Structure

Once decrypted, the account is a standard **ethers.js HDNodeWallet** with:

```typescript
interface HDNodeWallet {
  address: string; // Ethereum address (0x...)
  privateKey: string; // Private key (NEVER stored unencrypted)
  mnemonic: {
    phrase: string; // BIP-39 mnemonic (24 words)
    path: string; // HD derivation path (m/44'/60'/0'/0/0)
    locale: string; // Language (en)
  };
  provider?: Provider; // Optional provider for transactions
}
```

## API Reference

### Class: `CommbankDotETHAccount`

#### Constructor

```typescript
const commbankDotEthAccount = new CommbankDotETHAccount();
```

Or use the singleton:

```typescript
import { commbankDotEthAccount } from "@/lib/commbankdoteth-account";
```

#### Methods

##### `isRegistered(): Promise<boolean>`

Check if a passkey is registered for commbank.eth.

**Behavior:**

1. First checks localStorage for quick validation
2. Optionally verifies with WebAuthn if localStorage check is inconclusive
3. Non-intrusive (doesn't trigger biometric prompt)

**Returns:** `true` if registered, `false` otherwise

**Example:**

```typescript
const registered = await commbankDotEthAccount.isRegistered();
if (!registered) {
  // Show registration UI
}
```

---

##### `registerPasskey(): Promise<HDNodeWallet | null>`

Register a new passkey and create a new random Ethereum account.

**Behavior:**

1. Checks if already registered (won't overwrite)
2. Generates a random 24-word BIP-39 mnemonic
3. Triggers passkey registration (biometric prompt)
4. Encrypts and stores the mnemonic
5. Returns the generated wallet

**Returns:** The newly created `HDNodeWallet`, or `null` if registration failed or already registered

**Example:**

```typescript
const wallet = await commbankDotEthAccount.registerPasskey();
if (wallet) {
  console.log("Account created:", wallet.address);
  console.log("Mnemonic:", wallet.mnemonic.phrase);
  // Show mnemonic to user for backup!
}
```

---

##### `getPasskeyAccount(): Promise<HDNodeWallet>`

Authenticate with passkey and retrieve the Ethereum account.

**Behavior:**

1. Checks if passkey is registered
2. Triggers biometric authentication
3. Decrypts the stored mnemonic
4. Returns the wallet

**Returns:** `HDNodeWallet` on success

**Throws:** Error if not registered or authentication fails

**Example:**

```typescript
try {
  const wallet = await commbankDotEthAccount.getPasskeyAccount();
  console.log("Authenticated as:", wallet.address);
  // Use wallet for transactions
} catch (error) {
  console.error("Authentication failed:", error);
}
```

---

##### `restoreFromMnemonic(mnemonic: string): Promise<HDNodeWallet | null>`

Restore an account from an existing mnemonic phrase.

**Behavior:**

1. Validates the mnemonic
2. If no passkey exists, registers one first
3. If passkey exists, authenticates with it
4. Encrypts and stores the provided mnemonic (overwrites existing)
5. Returns the restored wallet

**Parameters:**

- `mnemonic`: BIP-39 mnemonic phrase (12 or 24 words)

**Returns:** The restored `HDNodeWallet`, or `null` if restoration failed

**Example:**

```typescript
const mnemonic =
  "witch collapse practice feed shame open despair creek road again ice least";
const wallet = await commbankDotEthAccount.restoreFromMnemonic(mnemonic);
if (wallet) {
  console.log("Account restored:", wallet.address);
}
```

---

##### `clearStoredAccount(): void` ⚠️ **DANGER**

Clear all stored account data from localStorage.

**Behavior:**

- Removes encrypted mnemonic
- Removes username marker
- **Does NOT delete the passkey** (passkey remains in device authenticator)

**WARNING:** After calling this, you will need your mnemonic backup to restore access!

**Example:**

```typescript
// DANGER: Only call this if you have your mnemonic backed up!
commbankDotEthAccount.clearStoredAccount();
// User will need to restore from mnemonic or register new account
```

---

##### `static isSupported(): boolean`

Check if WebAuthn/Passkeys are supported in the current environment.

**Returns:** `true` if supported, `false` otherwise

**Example:**

```typescript
if (!CommbankDotETHAccount.isSupported()) {
  alert("Passkeys are not supported in this browser");
}
```

## User Flows

### 1. New User Registration

```
User visits commbank.eth.limo for first time
↓
Check: isRegistered() → false
↓
Click "Create Account"
↓
Call: registerPasskey()
↓
System generates 24-word mnemonic
↓
Biometric prompt appears (Touch ID, Face ID, etc.)
↓
User authenticates
↓
Mnemonic is encrypted and stored
↓
Show mnemonic to user: "BACKUP THESE WORDS!"
↓
Account ready to use
```

### 2. Returning User Login

```
User visits commbank.eth.limo
↓
Check: isRegistered() → true
↓
Click "Login"
↓
Call: getPasskeyAccount()
↓
Biometric prompt appears
↓
User authenticates
↓
Mnemonic is decrypted
↓
Wallet is created and returned
↓
User can now sign transactions
```

### 3. Account Recovery

```
User has new device or cleared localStorage
↓
Check: isRegistered() → false
↓
Click "Restore Account"
↓
User enters 24-word mnemonic
↓
Call: restoreFromMnemonic(mnemonic)
↓
System validates mnemonic
↓
Biometric prompt appears (registering new passkey on this device)
↓
User authenticates
↓
Mnemonic is encrypted and stored
↓
Account restored
```

## Design Considerations & Trade-offs

### ✅ What Works Well

1. **Domain Security**: Passkeys are cryptographically bound to `commbank.eth.limo` - cannot be phished
2. **No Passwords**: Users never create or remember passwords
3. **Biometric UX**: Native OS authentication (Touch ID, Face ID, Windows Hello)
4. **Offline Capable**: All encryption/decryption happens client-side
5. **Recovery Possible**: Users can restore from mnemonic on new devices

### ⚠️ Limitations & Workarounds

| Limitation                            | Workaround                                                      |
| ------------------------------------- | --------------------------------------------------------------- |
| Can't store data in passkey           | Store encrypted in localStorage, use passkey for key derivation |
| Passkeys don't sync across domains    | Use single canonical domain (`commbank.eth.limo`)               |
| Passkey lost if device reset          | Provide mnemonic backup during registration                     |
| Can't use on different browser/device | Restore from mnemonic to set up new passkey                     |
| localStorage can be cleared           | User must restore from mnemonic backup                          |

### 🔒 Security Properties

1. **Authentication Factor**: Something you have (device) + something you are (biometric)
2. **Encryption**: AES-256-GCM with 100k PBKDF2 iterations
3. **Domain Binding**: WebAuthn enforces same-origin policy
4. **Forward Secrecy**: New IV for each encryption operation
5. **No Server Required**: All operations are client-side

## Common Scenarios

### What if user clears localStorage?

The encrypted mnemonic is lost, but the passkey still exists in the device authenticator. User must:

1. Restore from their backed-up mnemonic phrase
2. `restoreFromMnemonic()` will re-encrypt and store it

### What if user gets a new device?

The passkey is device-bound and won't transfer. User must:

1. Use their backed-up mnemonic phrase
2. Call `restoreFromMnemonic()` on the new device
3. This creates a new passkey on the new device

### What if user loses mnemonic backup?

If localStorage is intact: They can still access their account via `getPasskeyAccount()`
If localStorage is cleared: **Account is permanently inaccessible** ⚠️

**Prevention:** Always prompt users to backup mnemonic during registration!

### Can users have multiple devices?

Yes! Each device gets its own passkey, but all decrypt the same mnemonic (same Ethereum account):

1. Device A: Register and backup mnemonic
2. Device B: Restore from mnemonic → creates new passkey on Device B
3. Both devices control the same Ethereum address

## Best Practices

### For Developers

1. **Always show mnemonic during registration** - User must back it up
2. **Validate mnemonic format** before calling `restoreFromMnemonic()`
3. **Handle errors gracefully** - Passkey prompts can be cancelled
4. **Check `isSupported()`** before showing passkey UI
5. **Don't call `getPasskeyAccount()` repeatedly** - Cache the wallet in memory/context
6. **Use `isRegistered()`** to show appropriate UI (login vs register)

### For Users

1. **Backup your mnemonic** - Write it down, store it securely
2. **Never share your mnemonic** - It's your master key
3. **Use a supported browser** - Chrome, Safari, Edge, Firefox (modern versions)
4. **Enable device security** - Passkeys require device lock (PIN, password, biometric)

## Migration from v1

If you have existing v1 accounts with encrypted mnemonics in localStorage:

```typescript
// Pseudo-code for migration
const oldEncryptedMnemonic = localStorage.getItem("encryptedMnemonic");
if (oldEncryptedMnemonic) {
  // Decrypt using v1 method
  const mnemonic = await v1DecryptMnemonic(oldEncryptedMnemonic);

  // Re-encrypt using v2
  const wallet = await commbankDotEthAccount.restoreFromMnemonic(mnemonic);

  // Clean up v1 data
  localStorage.removeItem("encryptedMnemonic");
}
```

## Troubleshooting

### Error: "No passkey registered for commbank.eth"

**Cause:** Attempting to call `getPasskeyAccount()` without registering first

**Solution:** Call `registerPasskey()` or `restoreFromMnemonic()` first

---

### Error: "Failed to create passkey credential"

**Possible Causes:**

- User cancelled the biometric prompt
- Browser doesn't support WebAuthn
- Device doesn't have a secure authenticator
- User already has a passkey for this username (check with `isRegistered()`)

**Solution:** Check `CommbankDotETHAccount.isSupported()`, ensure device has biometrics enabled

---

### Error: "Failed to decrypt account data"

**Possible Causes:**

- Authenticator data changed (rare, but can happen after OS updates)
- localStorage data corrupted
- Trying to decrypt with wrong passkey

**Solution:** Have user restore from mnemonic backup

---

### Biometric prompt appears but nothing happens

**Cause:** Promise is unresolved due to timeout or user inaction

**Solution:** Set appropriate timeout values, provide UI feedback for waiting state

## References

- [WebAuthn Spec](https://www.w3.org/TR/webauthn-2/)
- [Passkeys.dev](https://passkeys.dev/)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [BIP-39 Mnemonic Spec](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
