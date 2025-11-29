import assert from "assert";
import { TestHelpers, Commbankdoteth_LeafInserted } from "generated";
const { MockDb, Commbankdoteth } = TestHelpers;

describe("Commbankdoteth contract LeafInserted event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Commbankdoteth contract LeafInserted event
  const event = Commbankdoteth.LeafInserted.createMockEvent({
    /* It mocks event fields with default values. You can overwrite them if you need */
  });

  it("Commbankdoteth_LeafInserted is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Commbankdoteth.LeafInserted.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualCommbankdotethLeafInserted =
      mockDbUpdated.entities.Commbankdoteth_LeafInserted.get(
        `${event.chainId}_${event.block.number}_${event.logIndex}`,
      );

    // Creating the expected entity
    const expectedCommbankdotethLeafInserted: Commbankdoteth_LeafInserted = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      leafIndex: event.params.leafIndex,
      leafValue: event.params.leafValue,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualCommbankdotethLeafInserted,
      expectedCommbankdotethLeafInserted,
      "Actual CommbankdotethLeafInserted should be the same as the expectedCommbankdotethLeafInserted",
    );
  });
});
