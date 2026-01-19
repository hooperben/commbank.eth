# commbank.eth

### open source, privacy enhancing financial technologies

## Components

- `client/`: the commbank.eth web app deployed to `https://commbank.eth.limo`
- `contracts/`: the EVM smart contracts required to facilitate Private Unstoppable Money
- `circuits/`: Private Unstoppable Money Zero Knowledge circuits
- `indexer/`: a data indexer used to cache Private Unstoppable Money transactions more efficiently
- `relayer/`: an expressJS based backend that forwards RPC requests and works as a transaction relayer

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
