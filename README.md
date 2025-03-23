# commbank.eth

### Commbank.eth - the bank you don't have to trust.

Commbank.eth allows for easy sending and receiving of both public and private ERC20s, by utilising Zero Knowledge circuits written with Noir and compiled to Solidity.

No data ever leaves the browser, except to send transactions and balance checks. All secrets and private balance proofs are stored in the browsers IndexDB, which is guarded by PassKey authentication.

Commbank.eth is able to do this by utilising quite a few cryptographic techniques, mainly:

- an EVM address and an RSA key pair is created and saved in the browsers indexdb based on a secret stored in the users pass key
- when a user wishes to deposit to the privacy pool, they create a note hash to add to the contract. A note contains:

  - asset id (address)
  - amount of asset
  - owner public key
  - secret value (random 32 bytes)

we call our leaf nodes in the tree note commitments, and these leaf hashes are given by:

note_commitment = hash(asset_id, amount, owner, secret).

the NoteVerifier circuit ensures that a user can't falsely inflate their asset amount, and that note_commitment is created correctly (without revealing any details about it). The solidity around the verifier handles the transfer of the erc20.

now that a user has deposited into the private pool, they probably want to send some funds privately. any time a user wishes to receive a private transaction, they give the sender:

pub_key_a = keccak(keccak(rsa.private_key));
pub_key_b = rsa.public_key

pub_key_a is used within ZK proofs to verify ownership of a note.
pub_key_b is used to decrypt secrets that the sender attaches to their masked transactions.

The sender takes these 2 pub keys, and creates the following:

#### input notes

input notes contain all of the fields of regular notes, plus some others that are involved in proving. namely:

- merkle root: a merkle root in the trees recent history (last ~100 inserts)
- leaf index: the index of the note being spent in the tree
- merkle path + values: the steps needed to recreate the known merkle root
- owner_secret: keccak(rsa.private_key), this is used to prove that they own the note

#### output notes

output notes are the notes that this transfer is creating, and is very similar to the deposit process in terms of flow. the sum of the output notes assets MUST always equal to sum of the input notes assets, otherwise the proof if not valid. value in the pools can only be added to by depositing, or decreased by withdrawing.

#### nullifiers

a cryptographic commitment that allows for marking of notes as spent, without revealing which note is spent. these are recorded in the solidity contract so that double spends are not possible.

#### encrypted payloads

contains (note_secret, asset_id, amount) as one long string, which is encrypted with the receivers pub_key_b. By having this on the contract, this means that no middleman is required to relay messages, and if the user keeps their RSA keypair, they can always decrypt the history just by checking the logs on the chain.

once Alice transfers Bob and Bob:

- gets the encrypted payload
- records the secret, amount and asset

Bob is now free to withdraw out of the privacy pool. He can do this by utilising the Withdraw flow. This works pretty similarly to spending, however there are no output notes. Input notes are checked to ensure that they're correct, they're nullifier, and then the total of the input notes is transferred to Bob as the asset in ERC20 form.
