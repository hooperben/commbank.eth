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
pnpm install
```

To start both the indexer and client from root:

```
pnpm run dev
```

This will:

- Start the indexer at `indexer/` (envio dev)
- Start the client at `client/` (vite dev server)
- Set the environment variable `VITE_RUNNING_LOCAL_INDEXER=true` for the client

To run just the client without the indexer:

```
cd client
pnpm run dev
```

### Indexer Setup

The indexer uses Envio and requires dependencies to be installed in the `generated` folder. If you encounter errors about missing packages (like `rescript-envsafe` or `ts-node`), run:

```
cd indexer/generated
pnpm install --ignore-workspace
cd ../..
```

Then run codegen to generate the indexer code:

```
cd indexer
pnpm run codegen
```

#### Docs

[AUTH.md](./AUTH.md) describes how notes are currently implemented in the private transfer model

#### Development Tips

ngrok is handy for mobile testing

```
ngrok http http://localhost:5173
```

creates a tunnel that you can use passkey on for development. Can be a bit of a pain without static domains though, as you have to add the tunnel site to `vite.config.ts`.
