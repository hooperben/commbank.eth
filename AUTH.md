# commbank.eth account model

the client/ app currently just stores a menmonic created with

```ts
const accountSecret = ethers.Wallet.createRandom();
```

in passkey as `commbank.eth`.

the EVM address derived is the default returned from using this wallet as

```ts
const wallet = ethers.Wallet.fromPhase(accountSecret);
```

if a user can successfully sign up/in using passkey - they have an `authToken` in session storage. This auth token doesn't really have any power at the moment, as is much more of a placeholder for future features.

### Private Transfers

for private transfers, the user has 2 public fields:

- signing key: used for note passing (encryption and decryption)
- owning key: used for proving of note ownership

These are 2 separate fields as proving ownership in zero knowledge is much more efficient using a different hash encryption pattern rather than encrypting and decrypting in zero knowledge.

The owning key is given by:

```ts
const owningKey = poseidon2(wallet.privateKey);
```

note: if you pass a wallet.privateKey > the field size for poseidon, poseidon2 should (TODO confirm) take the modulo for you

The signing key is given by:

```ts
const signingKey = wallet.publicKey;
```
