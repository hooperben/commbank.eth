// Global mocha teardown. Tears down the bb.js Barretenberg WASM workers
// started by get-noir-classes.ts (transitively via getTestingAPI) and the
// four shared classes (Deposit / Withdraw / Transact / TransferExternal),
// so the test process can exit on its own once the suite finishes.
//
// Without this, mocha sits open after the last `passing` line because the
// bb.js worker thread keeps the event loop alive.

import { destroyNoirApi } from "@/helpers/objects/get-noir-classes";
import { destroyAllBb } from "shared/classes/bb-teardown";

after(async () => {
  await destroyNoirApi();
  await destroyAllBb();
});
