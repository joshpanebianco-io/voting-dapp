import { Contract, Interface, JsonRpcProvider, Network } from "ethers";
import PollManagerABI from "../abis/PollManager.json";
import PollRetrieverABI from "../abis/PollRetriever.json";
import { ADDRESSES, CHAIN_ID, RPC_URL } from "../config";

let readProvider = null;

/**
 * Read-only provider used for every query, independent of the user's wallet.
 * Requests made in the same tick are batched into a single HTTP call.
 */
export function getReadProvider() {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(RPC_URL, CHAIN_ID, {
      staticNetwork: Network.from(CHAIN_ID),
      batchMaxCount: 10,
      batchStallTime: 10,
      polling: false,
    });
  }
  return readProvider;
}

export const pollManagerInterface = new Interface(PollManagerABI);
export const pollRetrieverInterface = new Interface(PollRetrieverABI);

export function getPollManager(runner = getReadProvider()) {
  return new Contract(ADDRESSES.pollManager, PollManagerABI, runner);
}

export function getPollRetriever(runner = getReadProvider()) {
  return new Contract(ADDRESSES.pollRetriever, PollRetrieverABI, runner);
}
