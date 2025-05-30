interface SupportedAsset {
  chainId: number;
  name: string;
  symbol: string;
  lzEndpointId: number; // v2 by default
  address: string;
  decimals: number;
}

const mainnetAssets: SupportedAsset[] = [
  {
    chainId: 1,
    lzEndpointId: 30101,
    name: "Australian Digital Dollar",
    symbol: "AUDD",
    address: "0x4cCe605eD955295432958d8951D0B176C10720d5",
    decimals: 6,
  },
  {
    chainId: 1,
    lzEndpointId: 30101,
    name: "USD Coin",
    symbol: "USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
  },
];

const baseAssets: SupportedAsset[] = [
  {
    chainId: 8453,
    lzEndpointId: 30184,
    name: "USD Coin",
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
];

const optimismAssets: SupportedAsset[] = [
  {
    chainId: 10,
    lzEndpointId: 30111,
    name: "USD Coin",
    symbol: "USDC",
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
  },
];

const polygonAssets: SupportedAsset[] = [
  {
    chainId: 137,
    lzEndpointId: 30109,
    name: "USD Coin",
    symbol: "USDC",
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
  },
];

// TODO fix
// const arbitrumAssets: SupportedAsset[] = [
//   {
//     chainId: 42161,
//     lzEndpointId: 30110,
//     name: "USD Coin",
//     symbol: "USDC",
//     address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
//     decimals: 6,
//   },
// ];

export const supportedAssets: SupportedAsset[] = [
  ...mainnetAssets,
  ...baseAssets,
  ...optimismAssets,
  ...polygonAssets,
  // ...arbitrumAssets,
];
