# commbank.eth

### the bank you don't have to trust

## Components

- `client*/`: the commbank.eth web app (currently 2 versions)
- `contracts/`: the EVM smart contracts required to facilitate private transfers
- `circuits/`: an implementation of a Multi Asset Shield Pool with `poseidon2` as the merkle tree hash function
- `indexer/`: the indexer that makes the merkle tree data available easier

## Development

To install dependencies:

```
pnpm run dev
```

To start the indexer and client, from root:

```
pnpm run dev
```

To run just the client:

```
cd client
pnpm run dev
```

#### Docs

[AUTH.md](./AUTH.md) describes how notes are currently implemented in the private transfer model
