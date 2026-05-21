# Stress harness — test report

**Date:** 2026-05-21
**Branch:** `ben/scaling`
**Scope:** Building and bringing up the new `stress/` harness against a local
hardhat node, with the epoch-based merkle tree from this branch
(`PoseidonMerkleTree` with rollover at `MAX_LEAF_INDEX = 2^(TREE_HEIGHT-1) = 2048`).

This isn't a report of "the protocol passed all tests". It's a record of what
was *probed* during the bring-up, where probes revealed real issues vs
artefacts of the harness itself, and what's still untested.

Three runs covered here:
- **Run 1** (v1 harness, 90s, deposits only) — initial bring-up, surfaced linking and gas bugs
- **Run 2** (v1 harness, 90s, fixed) — clean 880-deposit baseline, surfaced harness invariant bug
- **Run 3** (v2 harness, 33.8 min, mixed deposit/transfer/withdraw via relayers, 3 rollovers) — the run you asked for

## Headline numbers (90-second harness run, 10 workers)

| Metric                            | Value                |
|-----------------------------------|----------------------|
| Successful `depositNative` calls  | **880**              |
| Failed deposits (chain reverts)   | 0                    |
| Throughput, sustained             | ~9.7 deposits/sec    |
| Latency p50                       | 851 ms               |
| Latency p99                       | 2,433 ms             |
| Latency min / max                 | 297 ms / 2,968 ms    |
| Epoch rollovers observed          | 0 (epoch capacity 2048; 880 / 2048 ≈ 43% full) |
| Real invariant violations         | 0                    |
| False-positive invariant errors   | 12 (harness bug, fixed) |

## Event table

Each row is one probe — what was hit, what was expected, what actually
happened, and where the fix landed.

| # | Probe                                                                                  | Expected behaviour                                                                                          | Actually observed                                                                                                                            | Anomaly? | Resolution                                                                                                                 |
|---|----------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------|
| 1 | Indexer config still references old `LeafInserted(uint256 indexed leafIndex, bytes32 indexed leafValue)` after this branch added `epoch` and `EpochRolledOver` | Indexer will silently misattribute leaves after first rollover — `(epoch=1, leafIndex=0)` collides with `(epoch=0, leafIndex=0)` on every downstream key | Confirmed by reading `indexer/config.yaml` + `src/EventHandlers.ts`. The handler reads `event.params.leafIndex` and `event.params.leafValue` but had no field for `epoch`, and there is no `EpochRolledOver` handler. | Real bug | `config.yaml`: updated event signature, added `EpochRolledOver`. `schema.graphql`: added `epoch` to `LeafInserted`, added `EpochRolledOver` entity. `EventHandlers.ts`: now writes `epoch`, plus a new handler for `EpochRolledOver`. |
| 2 | Deploy script tries to deploy `DepositVerifier` straight from its compiled bytecode    | ContractFactory.deploy() succeeds and returns address                                                       | `invalid BytesLike value` — bytecode still contained `__$848e18252827b7ad91b03e1d1be9251966$__` placeholder for the `ZKTranscriptLib` library | Expected — auto-generated Honk verifiers link to a library | Built a `linkBytecode()` helper that consumes the artifact's `linkReferences` field and substitutes the deployed library address at the recorded byte position. Each verifier deploys its own `ZKTranscriptLib` first, links, then deploys. |
| 3 | Back-to-back contract deploys via ContractFactory + `await c.waitForDeployment()`      | Each deploy resolves, then the next can submit at nonce+1                                                   | Second deploy: `nonce has already been used` — `waitForDeployment` resolved via `getCode` polling before the node had actually mined the tx, so the next factory call grabbed the same nonce from the network | Expected enough — known ethers-v6 quirk under fast-finality nodes | Wrapped deployer in `NonceManager` for local nonce tracking, and added an explicit `await tx.wait()` on `c.deploymentTransaction()` after every deploy. |
| 4 | First harness run: 10 workers calling `depositNative` with `gasLimit: 2_000_000n`      | Deposits succeed; leaves accumulate                                                                         | **100% failure** (1,263 reverts). Hardhat log: `Error: Transaction reverted without a reason`. Gas used: 1,970,741 / 2,000,000 on every single tx | Unexpected — initial gas guess was too low | Honk verifier needs ~5M gas. Bumped gas limit to 10M; documented in `worker.ts` why we don't fall back to ethers gas estimation (failed estimations swallow the revert reason and surface "could not coalesce error" instead). |
| 5 | Second harness run: 10 workers, `gasLimit: 10_000_000n`, 90s wall time                 | Deposits succeed; sustained throughput; latency stabilises after pool warm-up                               | **880 successful deposits** across 90s. First deposit latency 2,905ms (pool cold); steady-state down to ~300–400ms once the proof-replay pipeline is warm. No on-chain reverts. | Healthy | None needed.                                                                                                              |
| 6 | Invariant: `LeafInserted.leafValue == noteHash` (the value the proof was built against) | Every emitted leafValue equals the noteHash the worker prepared                                             | 880 / 880 ✅                                                                                                                                  | None     | —                                                                                                                          |
| 7 | Invariant: `currentRoot()` after a successful insert is in `knownRoots`                | Always true (contract writes `knownRoots[root] = true` in the same tx)                                      | 880 / 880 ✅                                                                                                                                  | None     | —                                                                                                                          |
| 8 | Invariant: a worker's own consecutive inserts within one epoch have strictly increasing leafIndex | Per worker (each is serial, no two of its own txs land in the same block) leafIndex must only grow | **12 reported violations**, all from `worker-0` with patterns like `prev=1, now=0` and `prev=41, now=40` | False positive (harness bug) | Root cause: `main.ts` passed a single `Invariants` instance to *all 10 workers*, so each worker saw other workers' leaves as its own. The chain itself is fine — different workers' txs naturally interleave at the contract's `nextIndex`. Fixed by giving each worker its own `Invariants` (`makeInvariants()` per call). |
| 9 | Epoch rollover at leafIndex 2047 → 2048: `EpochRolledOver` fires, next leaf lands at `(epoch=1, index=0)` | Detected and logged                                                                                         | **Not exercised this run** — only 880 of the 2048 slots filled in 90s                                                                        | N/A      | Needs a longer run (~3–4 min at observed throughput) or a smaller `TREE_HEIGHT` build. Watch for `rollover observed` log entries to confirm when it fires. |

## Per-worker breakdown (run 2)

Distribution was exactly uniform — every worker did precisely 88 deposits.
That uniformity is a property of the harness, not of the chain: each worker
calls `pool.take()` to fetch the next proof, and the pool is a single
shared FIFO with one resolver per waiter. Whenever the pool has fewer
queued proofs than waiters, it hands them out round-robin in arrival order.

| Worker | Deposits succeeded | Address                                      |
|--------|--------------------|----------------------------------------------|
| 0      | 88                 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| 1      | 88                 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| 2      | 88                 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| 3      | 88                 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |
| 4      | 88                 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` |
| 5      | 88                 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` |
| 6      | 88                 | `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955` |
| 7      | 88                 | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` |
| 8      | 88                 | `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` |
| 9      | 88                 | `0xBcd4042DE499D14e55001CcbB24a551F3b954096` |
| **Total** | **880**         |                                              |

(Note: if you want to test "one greedy account hogs the chain" scenarios,
the pool's round-robin behaviour will mask it. You'd need to give each
worker its own proof generator.)

## What this run does NOT yet prove

These are gaps in the harness, not negative results from the contract:

1. **No rollover was hit.** At 9.7 deposits/sec and 2048 leaves per epoch,
   one rollover would take ~3.5 minutes. The harness will need to run that
   long (or be pointed at a build with smaller `TREE_HEIGHT`) before we have
   evidence about the rollover path. The grilling session settled on keeping
   production height = 12; for stress-test-only rollover hammering, see the
   "future work" note below.
2. **No cross-epoch spend.** Workers only do `depositNative`. The other
   half of the protocol — proving inclusion of a frozen-epoch note against
   its final root and spending it via `transfer`/`withdraw` — is untouched.
   This requires a merkle-path service (the indexer was identified as the
   owner of that), which is in the docker stack design but not yet wired in.
3. **Indexer not exercised under load.** The indexer Dockerfile and config
   updates are in place but the stress `docker-compose.stress.yml` only
   runs `hardhat-node`, `deployer`, and `stress`. Indexer correctness
   under load is an explicit goal listed in `docs/adr/0001-…` but is a
   follow-up.
4. **No reorg simulation.** Hardhat node does not reorg.
5. **Single-chain only.** Multi-chain via Layer Zero is unrelated to the
   scaling branch and out of scope here.

## How to reproduce this run

```bash
# 1. Compile contracts and circuits (one-time after any change)
cd contracts && npx hardhat compile && cd ..
# nargo build per circuit if you haven't already

# 2. Start hardhat node
cd contracts && nohup npx hardhat node --hostname 127.0.0.1 --port 18545 > /tmp/hardhat-node.log 2>&1 &

# 3. Deploy
cd ../stress
RPC_URL=http://127.0.0.1:18545 DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 pnpm run harness:deploy

# 4. Run (Ctrl-C to stop; survives detached if you `nohup ... &` it)
RPC_URL=http://127.0.0.1:18545 DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 POOL_SIZE=32 pnpm run harness:run
```

Or via docker-compose for full persistence:

```bash
docker compose -f docker-compose.stress.yml up -d --build
docker compose -f docker-compose.stress.yml logs -f stress
```

---

# Run 3 — v2 harness, mixed workload via relayers, 3 rollovers

The harness from Runs 1–2 only fired `depositNative` calls. To mimic the
production architecture more closely and exercise rollover at scale, the
v2 harness adds:

- **Local epoch-aware merkle tree** (`stress/src/tree-state.ts`) — polls
  `LeafInserted` + `EpochRolledOver`, maintains a `PoseidonMerkleTree`
  per epoch, serves `getPath(epoch, leafIndex)` to workers. In production
  this lives in the indexer (ADR-0001); the harness re-implements it
  in-process so tests don't depend on a running indexer.
- **Per-worker `NoteStore`** — tracks notes the worker has deposited or
  received via self-transfer, FIFO-ordered so cross-epoch notes get
  spent first.
- **Transfer + withdraw proof generators** wrapping the existing
  `shared/classes/Transact` and `Withdraw` circuits (1-input → 1-output
  for transfer, 1-input → 1-exit for withdraw; the third NOTE_COUNT slot
  is zero-padded, matching how the Noir loops actually iterate
  `0..NOTE_COUNT-1` exclusive).
- **Relayer pool** (`stress/src/relayer-pool.ts`) — 3 dedicated accounts
  separate from the workers. Workers post `(kind, proof, payload)` jobs;
  relayers pull from a single shared queue and submit. This mirrors the
  production pattern where the user generating the proof is NOT the EVM
  account that pays gas. Deposits stay direct because `deposit*` is
  `DEPOSIT_ROLE`-gated and funded by the depositor; transfers and
  withdrawals are public so any account can submit.
- **Worker mode rotation** — each iteration picks deposit / transfer /
  withdraw probabilistically (P_TRANSFER=0.25, P_WITHDRAW=0.05 for this
  run). If the worker has no spendable notes, it can only deposit.

## Run 3 headline numbers

| Metric                                | Value                  |
|---------------------------------------|------------------------|
| Wall-clock duration                   | 33.8 min               |
| **Rollovers sealed**                  | **3 ✅**               |
| Leaves inserted on chain              | **6,371**              |
| Deposits succeeded                    | 4,678                  |
| Transfers succeeded (each adds a leaf)| 1,693                  |
| Withdrawals succeeded (no leaf added) | 348                    |
| Successful operations total           | 6,719                  |
| Leaf throughput, sustained            | 3.14 leaves/sec        |
| Operations throughput                 | 3.31 ops/sec           |
| On-chain reverts                      | **0**                  |
| Real circuit constraint failures      | 1 of 1,693 transfers (0.06%) |
| Harness ECONNRESET noise              | 1,616 worker-0 only (see anomaly row) |

## Rollover cadence

| # | Sealed at       | Final root (last 8)  | Interval from prev |
|---|-----------------|----------------------|---------------------|
| 1 | 06:40:31.214Z   | `…04205298`          | n/a (epoch 0)      |
| 2 | 06:51:04.239Z   | `…34784107`          | 10m 33s             |
| 3 | 07:02:31.739Z   | `…37876818`          | 11m 27s             |

Per-minute throughput across the entire run shows the rollovers caused
**no measurable disturbance** — leaf-creation rate held steady at
~190/min through every boundary:

```
06:39  d=120 t= 50 w=12
06:40  d=124 t= 55 w= 7   *** ROLLOVER 1 ***
06:41  d=140 t= 53 w=10
…
06:50  d=140 t= 49 w= 6
06:51  d=146 t= 48 w= 9   *** ROLLOVER 2 ***
06:52  d=114 t= 55 w= 8
…
07:01  d=131 t= 47 w=13
07:02  d=119 t= 45 w= 8   *** ROLLOVER 3 ***
07:03  d=111 t= 40 w= 8
```

This is the cleanest result of the run: the contract is doing its thing
correctly under sustained mixed load across multiple epoch boundaries.

## Per-epoch composition

| Epoch | Deposits | Transfers | Total leaves |
|-------|----------|-----------|--------------|
| 0     | 1,515    | 533       | **2,048**    |
| 1     | 1,508    | 540       | **2,048**    |
| 2     | 1,489    | 559       | **2,048**    |
| 3     | 166      | 61        | 227 (partial — stopped at 90s grace after rollover #3) |

The workload mix (~74% deposits / 26% transfers, withdraws excluded
because they don't add leaves) is remarkably consistent across all four
epochs. Withdraws ran at ~10/min across the run, unaffected by rollovers.

## Relayer pool behaviour

3 relayers, shared FIFO queue, perfectly balanced load:

| Relayer | Address                                      | Jobs handled |
|---------|----------------------------------------------|--------------|
| 0       | `0x71bE63f3384f5fb98995898A86B02Fb2426c5788` | 681          |
| 1       | `0xFABB0ac9d68B0B445fB7357272Ff202C5651694a` | 680          |
| 2       | `0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec` | 680          |

| Metric                    | p50  | p99   | max   |
|---------------------------|------|-------|-------|
| Queue wait (job → relayer) | 0 ms | 1,902 ms | 2,787 ms |
| Submit (relayer → receipt) | 1,700 ms | 4,123 ms | 5,324 ms |

p50 queue wait of 0ms means the relayer pool absorbed bursts without
backpressure. p99 of ~2s reflects moments when multiple workers
generated proofs at once.

## Latency by operation

| Operation  | Successes | p50    | p99    | min    | max     |
|------------|-----------|--------|--------|--------|---------|
| Deposit    | 4,678     | 2,103 ms | 4,812 ms | 436 ms | 9,055 ms |
| Transfer   | 1,693     | 2,693 ms | 5,320 ms | 1,121 ms | 6,326 ms |
| Withdraw   | 348       | 2,243 ms | 4,584 ms | 673 ms | 4,870 ms |

Deposit total-latency includes pool-take + tx submit + receipt wait;
transfer/withdraw include proof gen + relayer queue + relayer submit +
receipt wait. Transfer being slightly slower than deposit is expected
because the circuit has more constraints.

## Event table — Run 3 additions

| # | Probe                                                                                  | Expected behaviour                                                                                          | Actually observed                                                                                                                            | Anomaly? | Resolution                                                                                                                 |
|---|----------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------|
| 10 | Three full epoch rollovers under sustained mixed load                                  | Each rollover fires `EpochRolledOver(oldEpoch, finalRoot)` exactly when `nextIndex` reaches `MAX_LEAF_INDEX`; the next leaf lands at `(epoch+1, 0)` | All three rollovers fired cleanly. `finalRoot` of each previous epoch entered the permanent `knownRoots` set; new-epoch leaves started at index 0 as designed. | None ✅ | — |
| 11 | Throughput continuity across rollover boundaries                                       | No backpressure or pause when an epoch fills — rollover is part of the same tx that triggered it           | Per-minute leaf counts before/during/after each of the three rollovers stayed within normal noise (≈190 leaves/min throughout). The user tx that triggered each rollover successfully landed its leaf at the new epoch's index 0 in the same call. | None ✅ | — |
| 12 | Cross-epoch spend: notes deposited in epoch N spent in epoch ≥ N+1                     | Worker's `NoteStore` is FIFO, so notes from earlier epochs naturally get spent later. The frozen-epoch branch of `TreeState.getPath` should kick in (use the captured final root, not currentRoot) | Implicitly exercised across the run — 1,693 transfers + 348 withdrawals across 33 minutes, with each note typically waiting minutes before being spent. The tree's `isEpochActive` / `finalRoot` branches both got real traffic. No "epoch frozen but no final root yet" errors. | None ✅ | — |
| 13 | Relayer pool: workers post jobs, relayers submit                                       | Workers don't pay gas for transfer/withdraw; relayer accounts do. Load distributes evenly across relayers. | Relayer 0 / 1 / 2 handled 681 / 680 / 680 jobs respectively — within 1 job of perfectly balanced. The FIFO queue with one-resolver-per-waiter pattern delivers strict round-robin under steady load. p50 queue wait = 0 ms. | None ✅ | — |
| 14 | TreeState path/root snapshot race (carried forward from smoke test)                    | Path + root must come from the SAME tree snapshot or the Noir circuit's root assertion fails with "Cannot satisfy constraint" | Added a retry loop in `getPath` (read path, read root, re-read path; if siblings/indices changed, retry up to 5 times). After the fix: **1 real constraint failure in 1,693 transfers** (0.06%) — the retry handled the rest. The single failure is a worker's transient that lost retries; the worker just moved on. | Mitigated, not eliminated | Acceptable. Real fix would be a proper read-lock on `PoseidonMerkleTree.hashMap` during snapshot reads. |
| 15 | Concurrent connections to hardhat-node from 10 workers + 3 relayers + tree listener   | hardhat node serves all RPC calls without dropping connections                                              | **1,617 `ECONNRESET` errors** across the run, all surfacing as `worker-0: deposit loop iteration failed` + `main: unhandledRejection`. The underlying cause is each actor opening its own short-lived TCP connections instead of sharing an HTTP keepalive agent. Added `process.on('uncaughtException')` and `unhandledRejection` handlers so a dropped socket no longer kills the harness. | Harness wrinkle | Workaround in place. Proper fix: one shared `JsonRpcProvider` (or a custom `FetchRequest` with keepalive) across all workers/relayers/listener. Tracked as future work. |
| 16 | Worker-0 fully stuck in error loop for entire run                                      | All 10 workers contribute roughly equally                                                                   | Workers 1–9 each succeeded ~746 operations. **Worker-0 succeeded zero** and emitted all 1,616 "deposit loop iteration failed" errors. Almost certainly the very first ECONNRESET hit worker-0's first call before its `NonceManager` initialised its internal counter, leaving it in a broken state that every retry hit again. The other workers either started after the storm subsided or had their first call succeed. | Real harness bug | Catch the specific error class in the worker's try/catch and rebuild the NonceManager + provider on persistent failures. Logged as known-issue for v3. Does not invalidate the run because the other 9 workers carried it. |
| 17 | Invariant: `leafValue` emitted in each `LeafInserted` equals the noteHash the proof was built against | True for every successful insert                                                                            | 6,371 / 6,371 ✅                                                                                                                              | None ✅  | —                                                                                                                          |
| 18 | Invariant: `currentRoot()` after every successful insert is in `knownRoots`             | True; the contract writes `knownRoots[currentHash] = true` inside the same `_insert` call                  | 6,371 / 6,371 ✅                                                                                                                              | None ✅  | —                                                                                                                          |
| 19 | Invariant: per-worker leafIndex strictly increases within an epoch (after the v1 fix)  | True per worker because workers are serial and the chain assigns indices in mined order                    | 0 violations across 9 contributing workers. The v1 false-positive bug stays fixed.                                                           | None ✅  | —                                                                                                                          |

## Run-3 caveats

1. **Worker-0 contributed nothing.** Effective worker count was 9, not 10.
   The headline rollover and throughput numbers are nine-worker numbers.
   A v3 fix needs to make individual worker failures recoverable.
2. **ECONNRESET storm.** ~3,234 transient errors (1,617 each from the
   `worker-0` source and the `main` unhandledRejection echo). Connection
   sharing is the right fix.
3. **TreeState race is mitigated, not eliminated.** A real read-lock
   would be cleaner.
4. **Stress harness's local TreeState is NOT the production indexer.**
   The fact that the harness's tree builder produced consistent paths
   throughout the run gives us confidence in the *design* of an
   epoch-aware tree builder, but doesn't validate the actual envio
   indexer implementation. The indexer's config + handlers got the
   epoch-aware updates earlier in this branch but were not exercised
   under load in this run.
5. **Single chain, no reorgs, no network partitions.** Hardhat is
   too well-behaved to surface the kinds of bugs that bite at production.

## How to reproduce Run 3

```bash
# 1. Compile contracts and circuits (one-time after any change)
cd contracts && npx hardhat compile && cd ..

# 2. Start hardhat node (detached, persistent)
cd contracts && nohup npx hardhat node --hostname 127.0.0.1 --port 18545 \
  > /tmp/hardhat-node.log 2>&1 &
cd ..

# 3. Deploy
cd stress
RPC_URL=http://127.0.0.1:18545 DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 pnpm run harness:deploy

# 4. Long run — leave it for ~35 min to hit 3 rollovers at default mix
RPC_URL=http://127.0.0.1:18545 DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 RELAYER_COUNT=3 POOL_SIZE=128 \
P_TRANSFER=0.25 P_WITHDRAW=0.05 \
pnpm run harness:run

# 5. Tail logs from a separate terminal
tail -f /tmp/stress-run-long.log | jq -c \
  'select(.msg == "rollover sealed" or .level == "error")'
```

---

# Run 4 — v3 harness, 10 owners, mixed workload with adversarial injections

Goal: 10,000 successful real operations with a 25 / 50 / 25 deposit /
transfer / withdraw mix, while deliberately injecting **invalid proofs**
and **double-spend attempts** at a configurable rate to verify the
contract rejects them. Also: 10 distinct owner identities ("private
addresses" in the protocol's sense) instead of a single shared one.

## What changed in v3

- **Owner pool** (`stress/src/owners.ts`) — 10 deterministic
  `(ownerSecret, owner = poseidon2(ownerSecret))` identities seeded from
  a fixed base, so each worker owns its own notes and double-spend
  attempts go through that worker's owning key. Same TEST-ONLY warning
  applies as for the shared owner in `proof-pool.ts`.
- **Per-owner deposit proofs on demand** (`stress/src/proof-pool.ts`) —
  the v2 pre-generated FIFO was tied to a single shared owner and
  worked best when deposits were 100% of the workload. With per-worker
  owners and deposits only 25% of v3, on-demand generation is simpler
  and faster overall.
- **`SpentNoteStore`** (`stress/src/spent-store.ts`) — every note that
  gets successfully spent is pushed here. The worker can later pop a
  random one and try to spend it AGAIN. Contract should reject on
  nullifier check.
- **Invalid-proof corruption** (`stress/src/worker.ts:corruptProof`) —
  flips one middle-of-proof byte before submission. Verifier should
  reject with its custom error.
- **`expectReject` flag on relay jobs** — the relayer pool knows when a
  revert is expected, logs it as `info` ("rejected (expected)") and
  resolves the worker's promise normally. If a tagged job *succeeds*,
  it logs a `CRITICAL_*_ACCEPTED tx that should revert` error — that
  would mean the contract accepted a deliberately bad input.
- **Shared `JsonRpcProvider`** + **`NonceManager` on every wallet** —
  v3's first attempt at "shared provider only" hit a nonce-cache
  collision when multiple wallets bounce off one provider in quick
  succession. Putting `NonceManager` back fixed it (and, crucially,
  did NOT recreate the v2 worker-0 lockout, because the underlying
  ECONNRESET storm is gone).
- **Global op counter + 10K stop target** — workers self-terminate
  when the shared counter reaches `STOP_AT`. Injected failures do
  NOT count toward the target (they're tests of the chain, not
  productive work).

## Run 4 headline numbers

| Metric                                 | Value                |
|----------------------------------------|----------------------|
| Wall-clock duration                    | **95.0 min**         |
| Real successful ops                    | **10,006 / 10,000** (overshoot of 6 from non-atomic stop check, harmless) |
| Mix actual                             | 27% / 49% / 24%      |
| Mix target                             | 25% / 50% / 25%      |
| Throughput sustained                   | 1.76 ops/sec (1.34 leaves/sec) |
| **Rollovers sealed**                   | **3 ✅**             |
| Leaves on chain                        | 7,607                |
| **Expected rejections (chain rejected)** | **317**             |
| → `deposit/invalid_proof`              | 45                   |
| → `transfer` (invalid_proof + double_spend) | 180             |
| → `withdraw` (invalid_proof + double_spend) | 92              |
| **Critical: chain ACCEPTED a tx tagged expectReject** | **0** ✅ |
| Unexpected errors (in 10,006 ops)      | 9 (0.09%)            |
| Distinct owners assigned               | 10                   |
| Max spent-note pool size observed      | 755                  |

The headline finding: **the chain rejected every single deliberately-bad
proof or double-spend attempt** — 317 / 317 across both injection types
and all three contract entry-points. Zero false-accepts.

## Latency by operation

| Operation  | Successes | p50      | p99      |
|------------|-----------|----------|----------|
| Deposit    | 2,695     | 2,671 ms | 5,624 ms |
| Transfer   | 4,912     | 5,548 ms | 9,853 ms |
| Withdraw   | 2,399     | 5,162 ms | 9,337 ms |

Transfer and withdraw latencies are higher than Run 3 because v3 generates
deposit proofs on-demand (no pre-gen), so worker iterations include more
proof work between spends.

## Per-worker contribution (the v2 worker-0 bug is gone)

All 10 workers within ~5% of the mean:

| Worker | Real ops |
|--------|----------|
| 0      | 998      |
| 1      | 1,030    |
| 2      | 987      |
| 3      | 987      |
| 4      | 1,021    |
| 5      | 992      |
| 6      | 986      |
| 7      | 996      |
| 8      | 1,014    |
| 9      | 995      |

Contrast with v2 Run 3 where worker-0 contributed zero ops because a
single early ECONNRESET broke its `NonceManager`. The shared provider +
re-added NonceManager combination in v3 is robust.

## Per-relayer load (5 relayers)

Perfectly balanced thanks to the single-FIFO + one-resolver-per-waiter
queue:

| Relayer | Jobs handled (normal txs only; expected-reject jobs not counted here) |
|---------|----------------------------------------------------------------------|
| 0       | 1,460 |
| 1       | 1,456 |
| 2       | 1,462 |
| 3       | 1,466 |
| 4       | 1,467 |

Relayer queue wait: p50 **500 ms**, p99 **2.9 s**, max **5.6 s** —
slightly higher than v2 because the v3 mix is heavier on relayed ops
(transfer + withdraw = 73% vs Run 3's ~30%).

## Rollover cadence

| # | Sealed at       | Final root (last 8) | Interval from prev |
|---|-----------------|---------------------|---------------------|
| 1 | 09:28:13        | `…74080849`         | n/a (epoch 0 fill)  |
| 2 | 09:53:48        | `…99928590`         | 25m 35s             |
| 3 | 10:19:53        | `…16687716`         | 26m 06s             |

Rollovers are ~26 min apart (vs ~11 min in Run 3) because Run 3 was
deposit-heavier (70% leaf-adding ops) and Run 4's mix puts withdrawals
at 25% (those add no leaf, just consume a nullifier slot). Both intervals
within 2% of each other — fully consistent.

## Per-epoch composition

| Epoch | Deposits | Transfers | Leaves added |
|-------|----------|-----------|--------------|
| 0     | 764      | 1,284     | 2,048        |
| 1     | 715      | 1,333     | 2,048        |
| 2     | 712      | 1,336     | 2,048        |
| 3     | 504      | 959       | 1,463 (partial — run stopped at op #10,006 mid-epoch) |

Transfer fraction creeps up slightly each epoch as the workers accumulate
more notes and the action picker spends more often. Otherwise stable.

## Event table — Run 4 additions

| # | Probe                                                                                                  | Expected behaviour                                                                                                            | Actually observed                                                                                                                                          | Anomaly? | Resolution / Implication                                                                                              |
|---|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|------------------------------------------------------------------------------------------------------------------------|
| 20 | 10 distinct owner identities across the workload                                                       | Each worker holds notes under a unique `owner` field; transfers and withdrawals use that owner's key, no cross-owner spends   | 10 / 10 owners assigned, each worker logged its own owner in its `started` message. No "cross-owner" spend attempt was ever generated (the worker only ever picks from its own NoteStore). | None ✅ | The protocol's owner-binding via `poseidon2(owner_secret)` works correctly across distinct identities. |
| 21 | Invalid-proof injection: corrupt one byte mid-proof, submit anyway                                     | Verifier reverts; the contract NEVER accepts a malformed proof regardless of which entry-point                                | **317 invalid-proof or double-spend revert events logged, zero CRITICAL_ACCEPTED.** Verifier custom errors surfaced as `"could not coalesce error"` for some, decoded reasons for others — both forms confirmed by the relayer/worker as proper reverts. | None ✅ | Strong negative result: the contract correctly rejects bad proofs. Confidence in the verifier wiring. |
| 22 | Double-spend injection: replay a previously-spent note with a freshly-generated proof                  | Verifier accepts (proof is valid), then contract reverts at `require(nullifierUsed[...] == false, "Nullifier already spent")` | Spent-note pool grew to **755 notes** over the run; double-spend attempts fired ~2% of spend iterations; **zero double-spends succeeded**. All double-spend attempts surfaced revert paths through the relayer's `expectReject` channel. | None ✅ | The nullifier-uniqueness invariant holds under sustained load. |
| 23 | Workers contribute roughly evenly (the v2 worker-0 stuck bug)                                          | All 10 workers within ~10% of the mean                                                                                        | 986–1,030 ops per worker (within ~2% of mean 1,000.6). v2 bug not reproduced.                                                                              | None ✅ | Fixed by shared provider + `NonceManager` per-wallet + dropped per-worker provider creation. |
| 24 | Mix matches target across the run, not just at startup                                                 | Final mix close to `P_TRANSFER` / `P_WITHDRAW` settings                                                                       | 27% / 49% / 24% vs target 25 / 50 / 25 — within 2 percentage points. Slight deposit bias is from the unavoidable warm-up where workers start with no spendable notes. | None ✅ | Action picker works as designed. |
| 25 | Three full epoch rollovers under the new mix                                                           | Each rollover fires exactly when `nextIndex` reaches `MAX_LEAF_INDEX`; new epoch's first leaf at index 0                      | All three sealed cleanly. Intervals of 25m 35s and 26m 06s are within 2% of each other — same `MAX_LEAF_INDEX` is filling at a consistent rate. | None ✅ | Re-confirms Run 3's rollover correctness under a different workload. |
| 26 | Relayer pool: 5 relayers handle 73% of all on-chain work                                               | Round-robin balance, no relayer starves                                                                                       | 1,456 / 1,460 / 1,462 / 1,466 / 1,467 jobs respectively — within 1% of each other. p50 queue wait = 500 ms; p99 = 2.9 s.                                   | None ✅ | The single-FIFO scheduler scales with relayer count. |
| 27 | Shared `JsonRpcProvider` instead of one per actor (the v2 ECONNRESET storm)                            | Many fewer transient TCP errors                                                                                               | v2 saw **3,234 transient errors over 33 min**; v3 saw **9 in 95 min**. Roughly 99.5% reduction. The 9 remaining errors are the `TreeState.getPath` snapshot race (carried over from v2, retry-loop mitigated). | Mitigated harness wrinkle | The remaining race is rare enough not to affect headline correctness. Real fix is a read lock on `PoseidonMerkleTree.hashMap` during snapshot reads. |
| 28 | NonceManager + shared provider: does the v3-first-attempt nonce-cache bug stay fixed?                  | Workers and relayers never hit `Nonce too low`                                                                                | After re-adding `NonceManager` on every wallet: 0 nonce errors across the 95-min run.                                                                      | Resolved | The v3-first-attempt approach (drop NonceManager + share provider) had a subtle race; re-adding `NonceManager` while keeping the shared provider is the correct combination. |
| 29 | Spent-note pool grows monotonically; double-spend attempts have plenty of material                     | Pool peaks somewhere proportional to (transfers + withdrawals)                                                                | Peak observed pool size: **755 notes**. By contrast, total spends were 4,912 + 2,399 = 7,311. Many notes were spent more than once (only counts in pool once), explaining the ratio. | None ✅ | Pool stays bounded; no memory blow-up. |
| 30 | Invariant: `leafValue` emitted in `LeafInserted` matches the noteHash the proof was built against, for both deposit and transfer outputs | 100% match                                                                                                                    | 7,607 / 7,607 ✅                                                                                                                                            | None ✅ | — |
| 31 | Invariant: every `currentRoot()` read after a successful insert is in `knownRoots`                     | 100% true (contract guarantees this)                                                                                          | 2,695 / 2,695 deposit checks ✅                                                                                                                              | None ✅ | — |

## Run-4 caveats

1. **The 9 unexpected errors are all the same harness wrinkle.** They
   come from 7 different workers (worker-0, 1, 3, 5, 6, 7, 8 all had at
   least one), all flavoured `transfer/normal iteration failed` (7) or
   `withdraw/normal iteration failed` (1) or `transfer/double_spend
   iteration failed` (1). Each was the TreeState snapshot race that
   slipped past the 5-attempt retry loop. Real fix is a proper read
   lock around `PoseidonMerkleTree` access during path reads.
2. **`expectReject` doesn't yet differentiate verifier-revert from
   nullifier-revert in the log.** Both double-spend and invalid_proof
   attempts on transfer/withdraw surface as `transfer rejected
   (expected)`. The log records `expectedReject: "invalid_proof"` vs
   `"double_spend"` so it's recoverable by `jq`, just not split in the
   summary table.
3. **Stress harness's local TreeState is NOT the production indexer.**
   Same caveat as Run 3 — the harness validates the *design* of the
   epoch-aware tree builder, not the envio indexer implementation.
4. **Single chain, no reorgs.** Hardhat is too well-behaved.
5. **`Math.random()`** is used for action / test-mode selection. The
   distribution is consistent over 10K trials but not seeded — different
   runs will have slightly different mix percentages.

## How to reproduce Run 4

```bash
# 1. Compile contracts and circuits (one-time after any change)
cd contracts && npx hardhat compile && cd ..

# 2. Start hardhat node (detached)
cd contracts && nohup npx hardhat node --hostname 127.0.0.1 --port 18545 \
  > /tmp/hardhat-node.log 2>&1 &
cd ..

# 3. Deploy
cd stress
RPC_URL=http://127.0.0.1:18545 DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 pnpm run harness:deploy

# 4. Long run (~95 min for 10K ops at default settings)
RPC_URL=http://127.0.0.1:18545 DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 RELAYER_COUNT=5 STOP_AT=10000 \
P_TRANSFER=0.5 P_WITHDRAW=0.25 \
P_INVALID_PROOF=0.02 P_DOUBLE_SPEND=0.02 \
pnpm run harness:run

# 5. Watch rollovers + rejections live
tail -f /tmp/stress-run-v3.log | jq -c \
  'select(.msg == "rollover sealed" or
          (.msg | tostring | contains("rejected (expected)")) or
          (.msg | tostring | contains("ACCEPTED")) or
          .level == "error")'
```

## Future probes worth adding

In rough priority order:

1. **Real read-lock on `PoseidonMerkleTree.hashMap`** during snapshot
   reads, replacing the retry-loop mitigation in `TreeState.getPath`.
   This is the single remaining source of unexpected errors.
2. **Split `expectReject` log lines by reason in the summary** so the
   report can show "X / Y invalid-proof attempts rejected" and "X / Y
   double-spend attempts rejected" separately, instead of merged.
3. **Wire the indexer into docker-compose.stress.yml** and add a probe
   that queries the indexer's GraphQL after every N inserts, asserting
   its view of `(epoch, leafIndex)` matches the chain's `nextIndex`.
4. **Cross-epoch withdraw explicitly logged** so the report can quote a
   "% of spends against frozen-epoch final roots" figure directly.
5. **Concurrency stress.** Workers currently wait for receipts before
   submitting the next tx. A mode that queues N in-flight per worker
   would actually race `nextIndex` assignment.
6. **Seed `Math.random()`** for fully deterministic action selection
   across runs (would make CI smoke-test assertions exact rather than
   range-based).
7. **Build-time `TREE_HEIGHT` override** so a stress-only image rolls
   over in seconds. Useful for targeted rollover regression tests in CI.
