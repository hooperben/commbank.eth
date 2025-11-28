export interface SupportedAsset {
  chainId: number;
  name: string;
  symbol: string;
  lzEndpointId: number; // v2 by default
  address: string;
  decimals: number;
  isNative?: boolean;
  roundTo?: number;
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
    name: "Ethereum",
    symbol: "ETH",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    isNative: true,
    roundTo: 8,
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

export const sepoliaAssets: SupportedAsset[] = [
  {
    chainId: 11155111,
    lzEndpointId: 40101,
    name: "USD Coin",
    symbol: "USDC",
    address: "0x237eEeE66266c72DBb7Ee2Aa84811666cE4EB815",
    decimals: 6,
    roundTo: 2,
  },
  {
    chainId: 11155111,
    lzEndpointId: 40101,
    name: "Ethereum",
    symbol: "ETH",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    isNative: true,
    roundTo: 8,
  },
];

export const supportedAssets: SupportedAsset[] = [
  ...mainnetAssets,
  ...baseAssets,
  ...optimismAssets,
  ...polygonAssets,
];
