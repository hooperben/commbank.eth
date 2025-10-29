import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BASE_EID = 1;
const REMOTE_EID = 2;

const TestingAPIModule = buildModule("TestingAPI", (m) => {
  // Deploy LayerZero EndpointV2Mock contracts
  const baseEndpoint = m.contract("EndpointV2Mock", [BASE_EID]);
  const remoteEndpoint = m.contract("EndpointV2Mock", [REMOTE_EID]);

  // Deploy Mock Tokens
  const usdcToken = m.contract("USDC", []);
  const fourDecToken = m.contract("FourDEC", []);

  // Deploy LayerZero OFT tokens
  const lzOFTBase = m.contract("LZOFT", [
    "XXX",
    "XXX",
    baseEndpoint,
    m.getAccount(0),
  ]);

  const lzOFTRemote = m.contract("LZOFT", [
    "YYY",
    "YYY",
    remoteEndpoint,
    m.getAccount(0),
  ]);

  // Deploy Verifier contracts
  const depositVerifier = m.contract("DepositVerifier", []);
  const transferVerifier = m.contract("TransferVerifier", []);
  const withdrawVerifier = m.contract("WithdrawVerifier", []);
  const warpVerifier = m.contract("WarpVerifier", []);

  // Deploy main CommBankDotEth contract
  const commBankDotEth = m.contract("CommBankDotEth", [
    depositVerifier,
    transferVerifier,
    withdrawVerifier,
  ]);

  // // Set up LayerZero endpoint destinations (after deployment)
  // m.call(baseEndpoint, "setDestLzEndpoint", [lzOFTRemote, remoteEndpoint]);
  // m.call(remoteEndpoint, "setDestLzEndpoint", [lzOFTBase, baseEndpoint]);

  // // Set up peer connections for LayerZero OFT tokens
  // m.call(lzOFTBase, "setPeer", [REMOTE_EID, m.staticCall(m.getAccount(0), "zeroPadValue", [lzOFTRemote, 32])]);
  // m.call(lzOFTRemote, "setPeer", [BASE_EID, m.staticCall(m.getAccount(0), "zeroPadValue", [lzOFTBase, 32])]);

  return {
    // Core contracts
    commBankDotEth,

    // Mock tokens
    usdcToken,
    fourDecToken,

    // LayerZero contracts
    lzOFTBase,
    lzOFTRemote,
    baseEndpoint,
    remoteEndpoint,

    // Verifier contracts
    depositVerifier,
    transferVerifier,
    withdrawVerifier,
    warpVerifier,
  };
});

export default TestingAPIModule;
