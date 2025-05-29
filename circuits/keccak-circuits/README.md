# commbank.eth circuits

### `circuits/deposit/`

contains the circuits for verifying user deposits. It checks:

- that a hash calculated by the user is actually comprised of the asset and amount that they are depositing

upon success, this hash is inserted into the MerkleTree.

### `circuits/transact/`

contains the circuit that allows for private transfers. In order to complete a transfer, the sender needs to know:

- the receivers commbank.eth address
  - this is given by `pub_key = keccak(keccak(rsa.secret_key))`. This can be improved, but was chosen as it made proving ownership of the rsa much easier than using or modifying noir rsa.
- the receivers RSA public key
  - they need this as they encrypt the secret value of the note, and the receiver decrypts this with their RSA private key (all done by the web app).

security is held in the pool by the simple evaluation of sum of input notes == sum of output notes. A user cannot create private balances unless they are depositing, and they cannot decrease private balances unless they are withdrawing.
