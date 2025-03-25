import { Log, EventLog } from "ethers";
import { CommBankDotEth } from "../typechain-types";

export const getLeafAddedDetails = (
  commbank: CommBankDotEth,
  logs: (Log | EventLog)[],
) => {
  const formatted = logs
    .filter((log) => {
      // Find the event by topic (event signature hash)
      return (
        log.topics[0] === commbank.interface.getEvent("LeafAdded").topicHash
      );
    })
    .map((log) => {
      // Parse the event data
      return commbank.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });
    });

  return formatted.map((event) => ({
    leafIndex: event!.args[0],
    noteHash: event!.args[1],
  }));
};

export const getPayloadDetails = (
  commbank: CommBankDotEth,
  logs: (Log | EventLog)[],
) => {
  console.log(logs);
  const formatted = logs
    .filter((log) => {
      // Find the event by topic (event signature hash)
      return (
        log.topics[0] ===
        commbank.interface.getEvent("EncryptedSecret").topicHash
      );
    })
    .map((log) => {
      // Parse the event data
      return commbank.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });
    })[0];

  return {
    leafIndex: formatted?.args[0],
    payload: formatted?.args[1],
  };
};
