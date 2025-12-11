import { ethers } from "ethers";

export const approve = async (
  account: ethers.Signer,
  erc20Address: string,
  spender: string,
  amount: bigint,
) => {
  // Get current gas price from RPC
  const provider = account.provider;
  if (!provider) throw new Error("Signer has no provider");
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  const erc20 = new ethers.Contract(
    erc20Address,
    [
      {
        constant: false,
        inputs: [
          { name: "_spender", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    account,
  );

  const tx = await erc20.approve(spender, amount, { gasPrice });

  return tx;
};
