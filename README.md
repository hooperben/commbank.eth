# commbank.eth

### the bank you don't have to trust

## Components

- `client/`: the web app deployed at https://commbank.eth.limo
- `contracts/`: the EVM smart contracts required to facilitate private transfers
- `circuits`: an implementation of a Multi Asset Shield Pool with `poseidon2` as the merkle tree hash function
- `server/`: is a backend that's used for getting price data of assets from coingecko and to relay transactions for users (still a work in progress).
