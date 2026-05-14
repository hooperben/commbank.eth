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

- poseidon key: used for proving of note ownership (poseidon hash commitment)
- envelope key: used for note passing (encryption and decryption)

The poseidon key is given by:

```ts
const privateAddress = poseidon2([wallet.privateKey]);
```

and the envelope key is given by:

```ts
const signingKey = wallet.publicKey;
```

The `privateAddress`/poseidon key is used in ZK circuits to prove knowledge of the pre-image of the output `privateAddress`. If that makes sense, hopefully this whole thing is correct.
