# commbank.eth circuits

### `circuits/deposit/`

contains the circuits for verifying user deposits. It checks:

- that a hash calculated by the user is actually comprised of the asset and amount that they are depositing

upon success, this hash is inserted into the MerkleTree.

### `circuits/transact/`

contains the circuit that allows for private transfers. In order to complete a transfer, the sender needs to know:

- the receivers RSA signature commitment
  - this is given by `sig_commitment = rsa.sign(receiver.public_key, receiver.private_key)` (the users signed public key, signed by themselves). This was chosen as the only `noir-rsa` library I could find was for signature verification, not explicit private key => public key proving.
- the receivers RSA public key
  - they need this as they encrypt the secret value of the note, and the receiver decrypts this with their RSA private key (all done by the web app).

security is held in the pool by the simple evaluation of sum of input notes == sum of output notes. A user cannot create private balances unless they are depositing, and they cannot decrease private balances unless they are withdrawing.
